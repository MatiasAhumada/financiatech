import { useState, useEffect, useRef } from 'react'
import './App.css'

declare global {
  interface Window {
    require: (module: string) => any;
  }
  namespace NodeJS {
    interface Process {
      resourcesPath: string;
    }
  }
}

function App() {
  const [status, setStatus] = useState<"idle" | "detecting" | "installing" | "configuring" | "success" | "error">("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [mobileLogs, setMobileLogs] = useState<string[]>([]);
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);
  const logViewerRef = useRef<any>(null);
  const logProcessRef = useRef<any>(null);

  const appendLog = (msg: string) => setLogs((prev) => [...prev, msg]);
  const appendMobileLog = (msg: string) => setMobileLogs((prev) => [...prev.slice(-500), msg]); // Keep last 500 lines

  const runCommand = (command: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const { exec } = window.require('child_process');
      const path = window.require('path');
      const fs = window.require('fs');

      // Detectar y usar la ruta de nuestro ADB local empaquetado
      const getAdbPath = () => {
        // En producción las herramientas quedan fuera del ASAR, en "process.resourcesPath/bin"
        const isPackaged = __dirname.includes('app.asar');
        if (isPackaged) {
           return path.join(process.resourcesPath, 'bin', 'adb.exe');
        }
        return path.join(__dirname, '..', 'bin', 'adb.exe');
      };
      
      const adbPath = fs.existsSync(getAdbPath()) ? `"${getAdbPath()}"` : 'adb';
      
      // Remplazar el comando 'adb' con la ruta completa a nuestro binario local si existe
      const finalCommand = command.startsWith('adb') ? command.replace(/^adb/, adbPath) : command;

      exec(finalCommand, (error: any, stdout: string, stderr: string) => {
        if (error) {
          reject(error.message || stderr);
        } else {
          resolve(stdout);
        }
      });
    });
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // Hook para Polling en background cuando está idle
  useEffect(() => {
    let interval: any;
    // Solo poleamos si estamos inactivos, con error, o tras éxito
    if (status === "idle" || status === "error" || status === "success") {
      interval = setInterval(async () => {
         try {
           const out = await runCommand('adb devices');
           const lines = out.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
           const devices = lines.slice(1).filter((l: string) => l.includes('device') && !l.includes('unauthorized'));

           if (devices.length > 0) {
             const deviceName = devices[0].split('\t')[0];
             if (connectedDevice !== deviceName) {
                // Dispositivo cambiado o reconectado
                const wasDisconnected = connectedDevice === null;
                setConnectedDevice(deviceName);
                if (wasDisconnected && isLogViewerOpen) {
                  appendLog("📱 Dispositivo reconectado - Los logs se reanudarán automáticamente");
                }
             }
           } else {
             if (connectedDevice !== null) {
                // Dispositivo desconectado
                setConnectedDevice(null);
             }
           }
         } catch (e) {
           // Ignoramos el error en el polling visual para no llenar el log
         }
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [status, connectedDevice, isLogViewerOpen]);

  const handleProvision = async () => {
    try {
      if (!connectedDevice) {
        throw new Error("No hay dispositivo conectado y autorizado.");
      }

      setLogs([]); // Limpiamos la consola al iniciar
      setStatus("detecting");
      appendLog("Iniciando proceso de provisión...");
      appendLog(`Dispositivo conectado: ${connectedDevice}`);

      // 1. Verificar cuentas
      appendLog("Verificando si existen cuentas configuradas (dumpsys account)...");
      const accountsOut = await runCommand('adb shell dumpsys account');
      if (accountsOut.includes('Account {name=')) {
        appendLog("⚠️ ADVERTENCIA: Se encontraron cuentas activas en el dispositivo.");
        appendLog("Esto podría causar que falle la activación del Device Owner.");
      } else {
        appendLog("✅ Cuentas limpias.");
      }

      await delay(1000);

      // 2. Instalar el APK
      setStatus("installing");
      appendLog("Instalando APK...");
      
      const path = window.require('path');
      const fs = window.require('fs');
      
      // Buscar el APK porteble
      let apkPath = path.join(__dirname, '..', 'bin', 'app-release.apk');
      if (__dirname.includes('app.asar')) {
         apkPath = path.join(process.resourcesPath, 'bin', 'app-release.apk');
      }
      
      // Fallback a la ruta absoluta pedida
      if (!fs.existsSync(apkPath)) {
          apkPath = "E:\\DeviceGuard\\deviceguard-app\\android\\app\\build\\outputs\\apk\\release\\app-release.apk";
      }

      appendLog(`Ruta del APK a instalar: ${apkPath}`);
      try {
        // Usamos -r (reinstall/update) y -d (allow downgrade) para actualizar transparentemente
        const installOut = await runCommand(`adb install -r -d "${apkPath}"`);
        appendLog(`Respuesta: ${installOut}`);
        appendLog(`✅ App instalada/actualizada correctamente.`);
      } catch (installErr: any) {
        const errMsg = String(installErr);
        if (!errMsg.includes("Success")) {
          throw new Error(`Error en la instalación: ${errMsg}`);
        } else {
          appendLog(`✅ App instalada/actualizada correctamente.`);
        }
      }

      await delay(1000);

      // 3. Activar Device Owner
      setStatus("configuring");
      appendLog("Verificando si la app ya es Device Owner...");
      
      let isAlreadyOwner = false;
      try {
        const policyOut = await runCommand('adb shell dumpsys device_policy');
        if (policyOut.includes('com.deviceguard.kiosk/.DeviceAdmin') && (policyOut.includes('Device Owner:') || policyOut.includes('owner'))) {
          isAlreadyOwner = true;
        }
      } catch (e) {
        // Si falla el checkeo preliminar, lo intentamos configurar más abajo
      }

      if (isAlreadyOwner) {
        appendLog('✅ La app YA ESTABA configurada como Device Owner. Saltando activación.');
      } else {
        appendLog("Activando el Modo Propietario (Device Owner)...");
        const ownerCmd = 'adb shell dpm set-device-owner com.deviceguard.kiosk/.DeviceAdmin';
        try {
          const ownerOut = await runCommand(ownerCmd);
          appendLog(`Respuesta DPM: ${ownerOut}`);
          if (ownerOut.includes('Success')) {
              appendLog('✅ Device Owner configurado con éxito.');
          } else if (ownerOut.includes('already set') || ownerOut.includes('is already set')) {
              appendLog('✅ Device Owner ya estaba configurado.');
          } else {
              throw new Error(`Respuesta desconocida de dpm: ${ownerOut}`);
          }
        } catch (ownerErr: any) {
           const errMsg = String(ownerErr);
           if (errMsg.includes("already some accounts")) {
             throw new Error("Fallo al establecer Device Owner: ya hay cuentas o perfiles de usuario en el equipo. Debes eliminarlos desde los ajustes.");
           } else if (errMsg.includes("Success") || errMsg.includes("already set") || errMsg.includes("is already set") || errMsg.includes("ya está")) {
             appendLog('✅ Device Owner ya estaba configurado o se configuró con éxito.');
           } else {
             throw new Error(`Ocurrió un error (DPM): ${errMsg}`);
           }
        }
      }

      // Forzar que el sistema se entere de los bloqueos extras antes de apagar
      appendLog("Aplicando reglas nativas...");
      try {
        await runCommand("adb shell am broadcast -a com.deviceguard.kiosk.FORCE_RESTRICTIONS -n com.deviceguard.kiosk/.DeviceAdmin");
      } catch (e) {
        // lo ignoramos, no es crítico para el final state
      }

      // Reinicio del dispositivo
      appendLog("Reiniciando el dispositivo para aplicar bloqueos...");
      await runCommand("adb reboot");

      await delay(1000);

      setStatus("success");
      appendLog("🎉 ¡Proceso finalizado exitosamente! El dispositivo se está reiniciando.");

    } catch (err: any) {
      appendLog(`❌ ERROR: ${err}`);
      setStatus("error");
    }
  };

  // Funciones para el visor de logs del dispositivo móvil
  const startLogViewer = () => {
    if (!connectedDevice) {
      appendLog("⚠️ No hay dispositivo conectado");
      return;
    }

    if (logProcessRef.current) {
      appendLog("El visor de logs ya está en ejecución");
      return;
    }

    const { spawn } = window.require('child_process');
    const path = window.require('path');
    const fs = window.require('fs');

    const getAdbPath = () => {
      const isPackaged = __dirname.includes('app.asar');
      if (isPackaged) {
        return path.join(process.resourcesPath, 'bin', 'adb.exe');
      }
      return path.join(__dirname, '..', 'bin', 'adb.exe');
    };

    const adbPath = fs.existsSync(getAdbPath()) ? getAdbPath() : 'adb';

    // Comando para ver logs de DeviceGuard y Firebase
    // Usamos findstr para filtrar las etiquetas relevantes
    // -s para imprimir líneas que coinciden, -i para ignorar mayúsculas/minúsculas
    const logcatCommand = `"${adbPath}" -s ${connectedDevice} logcat -s DGPollingService DeviceGuard DeviceGuardJS FCM NOTIFICATION firebase.messaging CONFIG PROVISIONING AppGuardian MainActivity BootReceiver PersistentService DeviceAdmin DeviceModule`;

    appendLog("📱 Iniciando visor de logs del dispositivo móvil...");
    appendLog(`Comando: ${logcatCommand}`);
    appendLog(`Dispositivo: ${connectedDevice}`);

    const logProcess = spawn(logcatCommand, { shell: true, detached: false });
    logProcessRef.current = logProcess;

    let isClosed = false;

    logProcess.stdout.on('data', (data: Buffer) => {
      const lines = data.toString().split('\n').filter(line => line.trim());
      lines.forEach(line => {
        if (line.trim()) {
          appendMobileLog(line);
        }
      });
    });

    logProcess.stderr.on('data', (data: Buffer) => {
      const stderr = data.toString();
      appendMobileLog(`[ERROR] ${stderr}`);
      // Detectar errores de conexión del dispositivo
      if (stderr.includes('device') && (stderr.includes('not found') || stderr.includes('no devices'))) {
        appendLog("⚠️ Dispositivo desconectado detectado");
        if (!isClosed) {
          isClosed = true;
          logProcessRef.current = null;
          setIsLogViewerOpen(false);
        }
      }
    });

    logProcess.on('close', (code: number | null) => {
      appendLog(`Visor de logs cerrado (código: ${code})`);
      logProcessRef.current = null;
      if (!isClosed) {
        isClosed = true;
        setIsLogViewerOpen(false);
      }
    });

    logProcess.on('error', (err: any) => {
      appendLog(`Error en el visor de logs: ${err.message}`);
      logProcessRef.current = null;
      if (!isClosed) {
        isClosed = true;
        setIsLogViewerOpen(false);
      }
    });

    setIsLogViewerOpen(true);
  };

  const stopLogViewer = () => {
    appendLog("Deteniendo visor de logs...");
    if (logProcessRef.current) {
      // Matar el proceso y todos sus hijos (en Windows)
      try {
        const { exec } = window.require('child_process');
        // En Windows, usamos taskkill para matar el árbol de procesos
        exec(`taskkill /pid ${logProcessRef.current.pid} /T /F`, (err: any) => {
          if (err) {
            // Fallback: kill simple
            logProcessRef.current?.kill();
          }
          logProcessRef.current = null;
          appendLog("Visor de logs detenido");
          setIsLogViewerOpen(false);
        });
      } catch (e) {
        logProcessRef.current.kill();
        logProcessRef.current = null;
        appendLog("Visor de logs detenido");
        setIsLogViewerOpen(false);
      }
    } else {
      // Si no hay proceso, igual cerramos el modal por seguridad
      appendLog("No hay proceso activo, cerrando visor");
      setIsLogViewerOpen(false);
    }
  };

  const clearMobileLogs = () => {
    setMobileLogs([]);
    appendLog("Logs del móvil limpiados");
  };

  const copyMobileLogs = () => {
    const text = mobileLogs.join('\n');
    navigator.clipboard.writeText(text);
    appendLog("Logs copiados al portapapeles");
  };

  const resumeLogViewer = () => {
    if (connectedDevice) {
      appendMobileLog("--- Reconectando al dispositivo ---");
      startLogViewer();
    }
  };

  // Limpiar proceso al desmontar
  useEffect(() => {
    return () => {
      if (logProcessRef.current) {
        logProcessRef.current.kill();
        logProcessRef.current = null;
      }
    };
  }, []);

  // Detectar desconexión del dispositivo mientras el visor de logs está abierto
  useEffect(() => {
    if (isLogViewerOpen && !connectedDevice && logProcessRef.current) {
      appendLog("⚠️ Dispositivo desconectado mientras se mostraban logs");
      // El proceso se cerrará solo, pero forzamos la limpieza
      logProcessRef.current = null;
      setIsLogViewerOpen(false);
    }
  }, [connectedDevice, isLogViewerOpen]);

  return (
    <div className="container">
      <header className="header">
        <h1>DeviceGuard <span>Provisioner</span></h1>
        <p>Herramienta Oficial de Configuración y Kiosco</p>
      </header>

      <main className="main-content">
        <div className="status-card">
          <div className={`status-indicator ${status}`}>
            <span className="dot"></span>
            {status === 'idle' && (connectedDevice ? `Lista para configurar (${connectedDevice})` : 'Esperando dispositivo conectarse...')}
            {status === 'detecting' && 'Comprobando Dispositivo...'}
            {status === 'installing' && 'Instalando APK...'}
            {status === 'configuring' && 'Activando Device Owner...'}
            {status === 'success' && '¡Dispositivo Provisionado!'}
            {status === 'error' && 'Error de configuración'}
          </div>

          <div className="button-group">
            <button
              className="provision-btn"
              disabled={!connectedDevice || (status !== 'idle' && status !== 'success' && status !== 'error')}
              onClick={handleProvision}
            >
              <span className="icon">⚡</span>
              {connectedDevice ? 'Provisionar Equipo' : 'Conecta un Equipo USB'}
            </button>
            
            <button
              className={`log-viewer-btn ${isLogViewerOpen ? 'active' : ''}`}
              disabled={!connectedDevice}
              onClick={isLogViewerOpen ? stopLogViewer : startLogViewer}
              title="Ver logs del dispositivo móvil en tiempo real"
            >
              <span className="icon">📱</span>
              {isLogViewerOpen ? 'Detener Logs' : 'Ver Logs Móvil'}
            </button>
          </div>
        </div>

        <div className="terminal-log">
          <div className="terminal-header">
            Logs de ADB
            {connectedDevice && (
              <span className="device-badge">📱 {connectedDevice}</span>
            )}
          </div>
          <div className="terminal-body">
            {logs.length === 0 ? (
              <span className="empty-log">Conecte el dispositivo mediante USB y habilite la Depuración USB.</span>
            ) : (
              logs.map((log, i) => <div key={i} className="log-line">{`> ${log}`}</div>)
            )}
          </div>
        </div>
      </main>

      {/* Modal del Visor de Logs del Móvil */}
      {isLogViewerOpen && (
        <div className="log-viewer-modal" ref={logViewerRef}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>📱 Logs del Dispositivo Móvil</h2>
              <div className="modal-actions">
                <button onClick={clearMobileLogs} className="btn-secondary" title="Limpiar logs">
                  🗑️ Limpiar
                </button>
                <button onClick={copyMobileLogs} className="btn-secondary" title="Copiar logs">
                  📋 Copiar
                </button>
                <button onClick={stopLogViewer} className="btn-danger" title="Cerrar visor">
                  ❌ Cerrar
                </button>
              </div>
            </div>
            <div className="modal-body">
              <div className="mobile-logs">
                {!connectedDevice ? (
                  <div className="empty-logs">
                    <div style={{ marginBottom: '16px', color: '#F59E0B' }}>
                      ⚠️ Dispositivo desconectado
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                      Conecta el dispositivo para continuar viendo logs
                    </div>
                    {mobileLogs.length > 0 && (
                      <button 
                        onClick={resumeLogViewer} 
                        className="btn-secondary"
                        style={{ marginTop: '8px' }}
                      >
                        🔄 Reanudar logs
                      </button>
                    )}
                  </div>
                ) : mobileLogs.length === 0 ? (
                  <div className="empty-logs">Esperando logs del dispositivo...</div>
                ) : (
                  mobileLogs.map((log, i) => (
                    <div key={i} className="log-entry">
                      <span className="log-prefix">{`> `}</span>
                      <span className={log.includes('ERROR') || log.includes('Exception') ? 'log-error' : 'log-text'}>
                        {log}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="modal-footer">
              <div className="log-info">
                <span>Mostrando últimos {mobileLogs.length} logs</span>
                <span className="log-filters">
                  Filtros: DeviceGuardJS | DGPollingService | DeviceGuard | CONFIG | PROVISIONING | AppGuardian | MainActivity
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
