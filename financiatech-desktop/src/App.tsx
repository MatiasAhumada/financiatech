import { useState, useEffect, useRef } from 'react'
import './App.css'
import logoImg from './assets/logo.png'

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

const Icons = {
  USB: ({ className }: { className?: string }) => (
    <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v10"/><circle cx="12" cy="16" r="3"/><path d="M8 16h8"/><path d="M12 6l-3-3M12 6l3-3"/><path d="M8 2h8"/>
    </svg>
  ),
  Lightning: ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
    </svg>
  ),
  Mobile: ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12" y2="18"/><circle cx="12" cy="18" r="1"/>
    </svg>
  ),
  Device: ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/>
    </svg>
  ),
  Package: ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  ),
  Settings: ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  ),
  Check: ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  CheckCircle: ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Error: ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  Alert: ({ className }: { className?: string }) => (
    <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Trash: ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  Copy: ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  Close: ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Refresh: ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  Info: ({ className }: { className?: string }) => (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
};

function App() {
  const [status, setStatus] = useState<"idle" | "detecting" | "installing" | "configuring" | "success" | "error">("idle");
  const [logs, setLogs] = useState<string[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<string | null>(null);
  const [mobileLogs, setMobileLogs] = useState<string[]>([]);
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);
  const logViewerRef = useRef<any>(null);
  const logProcessRef = useRef<any>(null);
  const terminalBodyRef = useRef<HTMLDivElement>(null);

  const appendLog = (msg: string) => setLogs((prev) => [...prev, msg]);
  const appendMobileLog = (msg: string) => setMobileLogs((prev) => [...prev.slice(-500), msg]);

  useEffect(() => {
    if (terminalBodyRef.current) {
      terminalBodyRef.current.scrollTop = terminalBodyRef.current.scrollHeight;
    }
  }, [logs]);

  const runCommand = (command: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const { exec } = window.require('child_process');
      const path = window.require('path');
      const fs = window.require('fs');

      const getAdbPath = () => {
        const isPackaged = __dirname.includes('app.asar');
        if (isPackaged) {
           return path.join(process.resourcesPath, 'bin', 'adb.exe');
        }
        return path.join(__dirname, '..', 'bin', 'adb.exe');
      };

      const adbPath = fs.existsSync(getAdbPath()) ? `"${getAdbPath()}"` : 'adb';

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

  useEffect(() => {
    let interval: any;
    if (status === "idle" || status === "error" || status === "success") {
      interval = setInterval(async () => {
         try {
           const out = await runCommand('adb devices');
           const lines = out.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 0);
           const devices = lines.slice(1).filter((l: string) => l.includes('device') && !l.includes('unauthorized'));

           if (devices.length > 0) {
             const deviceName = devices[0].split('\t')[0];
             if (connectedDevice !== deviceName) {
                const wasDisconnected = connectedDevice === null;
                setConnectedDevice(deviceName);
                if (wasDisconnected && isLogViewerOpen) {
                  appendLog("📱 Dispositivo reconectado - La actividad se reanudará automáticamente");
                }
             }
           } else {
             if (connectedDevice !== null) {
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

      setLogs([]);
      setStatus("detecting");
      appendLog("Iniciando configuración del dispositivo...");
      appendLog(`Dispositivo detectado: ${connectedDevice}`);

      appendLog("Verificando configuración del dispositivo...");
      const accountsOut = await runCommand('adb shell dumpsys account');
      if (accountsOut.includes('Account {name=')) {
        appendLog("⚠️ Atención: Hay cuentas configuradas en el dispositivo");
        appendLog("Esto podría impedir la configuración correcta del modo kiosco");
      } else {
        appendLog("✅ Dispositivo listo para configurar");
      }

      await delay(1000);

      setStatus("installing");
      appendLog("Instalando aplicación de control...");

      const path = window.require('path');
      const fs = window.require('fs');

      let apkPath = path.join(__dirname, '..', 'bin', 'app-release.apk');
      if (__dirname.includes('app.asar')) {
         apkPath = path.join(process.resourcesPath, 'bin', 'app-release.apk');
      }

      if (!fs.existsSync(apkPath)) {
          apkPath = "E:\\FinanciaTech\\financiatech-app\\android\\app\\build\\outputs\\apk\\release\\app-release.apk";
      }

      appendLog(`Buscando aplicación en: ${apkPath}`);
      try {
        const installOut = await runCommand(`adb install -r -d "${apkPath}"`);
        appendLog(`Estado: ${installOut}`);
        appendLog(`✅ Aplicación instalada correctamente`);
      } catch (installErr: any) {
        const errMsg = String(installErr);
        if (!errMsg.includes("Success")) {
          throw new Error(`Error en la instalación: ${errMsg}`);
        } else {
          appendLog(`✅ Aplicación instalada correctamente`);
        }
      }

      await delay(1000);

      setStatus("configuring");
      appendLog("Configurando permisos de administrador...");

      let isAlreadyOwner = false;
      try {
        const policyOut = await runCommand('adb shell dumpsys device_policy');
        if (policyOut.includes('com.financiatech.kiosk/.DeviceAdmin') && (policyOut.includes('Device Owner:') || policyOut.includes('owner'))) {
          isAlreadyOwner = true;
        }
      } catch (e) {
        // Si falla el checkeo preliminar, lo intentamos configurar más abajo
      }

      if (isAlreadyOwner) {
        appendLog('✅ El dispositivo ya estaba configurado como modo kiosco');
      } else {
        appendLog("Activando modo de control total (Device Owner)...");
        const ownerCmd = 'adb shell dpm set-device-owner com.financiatech.kiosk/.DeviceAdmin';
        try {
          const ownerOut = await runCommand(ownerCmd);
          appendLog(`Respuesta: ${ownerOut}`);
          if (ownerOut.includes('Success')) {
              appendLog('✅ Modo kiosco activado correctamente');
          } else if (ownerOut.includes('already set') || ownerOut.includes('is already set')) {
              appendLog('✅ El modo kiosco ya estaba activado');
          } else {
              throw new Error(`Respuesta desconocida: ${ownerOut}`);
          }
        } catch (ownerErr: any) {
           const errMsg = String(ownerErr);
           if (errMsg.includes("already some accounts")) {
             throw new Error("No se pudo activar el modo kiosco: hay cuentas de usuario en el dispositivo. Eliminelas desde Configuración > Cuentas.");
           } else if (errMsg.includes("Success") || errMsg.includes("already set") || errMsg.includes("is already set") || errMsg.includes("ya está")) {
             appendLog('✅ Modo kiosco activado correctamente');
           } else {
             throw new Error(`Error de configuración: ${errMsg}`);
           }
        }
      }

      appendLog("Aplicando restricciones de seguridad...");
      try {
        await runCommand("adb shell am broadcast -a com.financiatech.kiosk.FORCE_RESTRICTIONS -n com.financiatech.kiosk/.DeviceAdmin");
      } catch (e) {
        // lo ignoramos, no es crítico para el final state
      }

      appendLog("Reiniciando dispositivo para aplicar cambios...");
      await runCommand("adb reboot");

      await delay(1000);

      setStatus("success");
      appendLog("🎉 ¡Configuración completada! El dispositivo se reiniciará automáticamente");

    } catch (err: any) {
      appendLog(`❌ Error: ${err}`);
      setStatus("error");
    }
  };

  const startLogViewer = () => {
    if (!connectedDevice) {
      appendLog("⚠️ No hay dispositivo conectado");
      return;
    }

    if (logProcessRef.current) {
      appendLog("El monitor ya está en ejecución");
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

    const logcatCommand = `"${adbPath}" -s ${connectedDevice} logcat -s FGPollingService FinanciaTech FinanceTechJS FCM NOTIFICATION firebase.messaging CONFIG PROVISIONING AppGuardian MainActivity BootReceiver PersistentService DeviceAdmin DeviceModule`;

    appendLog("📱 Iniciando monitor de actividad del dispositivo...");
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
      appendLog(`Monitor cerrado (código: ${code})`);
      logProcessRef.current = null;
      if (!isClosed) {
        isClosed = true;
        setIsLogViewerOpen(false);
      }
    });

    logProcess.on('error', (err: any) => {
      appendLog(`Error en el monitor: ${err.message}`);
      logProcessRef.current = null;
      if (!isClosed) {
        isClosed = true;
        setIsLogViewerOpen(false);
      }
    });

    setIsLogViewerOpen(true);
  };

  const stopLogViewer = () => {
    appendLog("Deteniendo monitor de actividad...");
    if (logProcessRef.current) {
      try {
        const { exec } = window.require('child_process');
        exec(`taskkill /pid ${logProcessRef.current.pid} /T /F`, (err: any) => {
          if (err) {
            logProcessRef.current?.kill();
          }
          logProcessRef.current = null;
          appendLog("Monitor detenido");
          setIsLogViewerOpen(false);
        });
      } catch (e) {
        logProcessRef.current.kill();
        logProcessRef.current = null;
        appendLog("Monitor detenido");
        setIsLogViewerOpen(false);
      }
    } else {
      appendLog("Cerrando ventana de actividad");
      setIsLogViewerOpen(false);
    }
  };

  const clearMobileLogs = () => {
    setMobileLogs([]);
    appendLog("Actividad limpiada");
  };

  const copyMobileLogs = () => {
    const text = mobileLogs.join('\n');
    navigator.clipboard.writeText(text);
    appendLog("Actividad copiada al portapapeles");
  };

  const resumeLogViewer = () => {
    if (connectedDevice) {
      appendMobileLog("--- Reconectando al dispositivo ---");
      startLogViewer();
    }
  };

  useEffect(() => {
    return () => {
      if (logProcessRef.current) {
        logProcessRef.current.kill();
        logProcessRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (isLogViewerOpen && !connectedDevice && logProcessRef.current) {
      appendLog("⚠️ Dispositivo desconectado mientras se mostraba actividad");
      logProcessRef.current = null;
      setIsLogViewerOpen(false);
    }
  }, [connectedDevice, isLogViewerOpen]);

  const getStatusIcon = () => {
    switch(status) {
      case 'idle': return <Icons.Device />;
      case 'detecting': return <Icons.Lightning />;
      case 'installing': return <Icons.Package />;
      case 'configuring': return <Icons.Settings />;
      case 'success': return <Icons.CheckCircle />;
      case 'error': return <Icons.Error />;
      default: return <Icons.Device />;
    }
  };

  const getStatusMessage = () => {
    switch(status) {
      case 'idle':
        return connectedDevice 
          ? `Dispositivo listo: ${connectedDevice}` 
          : 'Conecte el dispositivo USB para comenzar';
      case 'detecting': return 'Verificando dispositivo...';
      case 'installing': return 'Instalando aplicación...';
      case 'configuring': return 'Configurando modo kiosco...';
      case 'success': return '¡Configuración completada!';
      case 'error': return 'Error en la configuración';
      default: return '';
    }
  };

  const getStatusDescription = () => {
    switch(status) {
      case 'idle':
        return connectedDevice 
          ? 'Presione "Iniciar Configuración" para comenzar' 
          : 'Asegúrese de que la depuración USB esté activada';
      case 'detecting': return 'Estamos verificando que el dispositivo esté listo';
      case 'installing': return 'La aplicación de control se está instalando';
      case 'configuring': return 'Configurando permisos de administrador del dispositivo';
      case 'success': return 'El dispositivo se reiniciará para aplicar los cambios';
      case 'error': return 'Revise el mensaje de error e intente nuevamente';
      default: return '';
    }
  };

  return (
    <div className="container">
      <header className="header">
        <div className="header-content">
          <img src={logoImg} alt="FinanciaTech" className="header-logo" />
          <div>
            <h1>FinanciaTech <span>Provisioner</span></h1>
            <p>Herramienta de Configuración de Dispositivos</p>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="status-card">
          <div className="status-info">
            <div className={`status-indicator ${status}`}>
              <span className="status-icon">{getStatusIcon()}</span>
              <div className="status-text">
                <div className="status-title">{getStatusMessage()}</div>
                <div className="status-description">{getStatusDescription()}</div>
              </div>
            </div>
          </div>

          <div className="button-group">
            <button
              className="provision-btn"
              disabled={!connectedDevice || (status !== 'idle' && status !== 'success' && status !== 'error')}
              onClick={handleProvision}
            >
              <span className="btn-icon"><Icons.Lightning /></span>
              {connectedDevice ? 'Iniciar Configuración' : 'Conecte Dispositivo USB'}
            </button>

            <button
              className={`log-viewer-btn ${isLogViewerOpen ? 'active' : ''}`}
              disabled={!connectedDevice}
              onClick={isLogViewerOpen ? stopLogViewer : startLogViewer}
              title="Ver actividad del dispositivo en tiempo real"
            >
              <span className="btn-icon"><Icons.Mobile /></span>
              {isLogViewerOpen ? 'Detener Monitor' : 'Ver Actividad'}
            </button>
          </div>
        </div>

        <div className="terminal-log">
          <div className="terminal-header">
            <span>Actividad del Dispositivo</span>
            {connectedDevice && (
              <span className="device-badge">
                <Icons.Mobile /> {connectedDevice}
              </span>
            )}
          </div>
          <div className="terminal-body" ref={terminalBodyRef}>
            {logs.length === 0 ? (
              <div className="empty-log">
                <div className="empty-log-icon"><Icons.USB /></div>
                <div>Conecte el dispositivo mediante USB</div>
                <div className="empty-log-hint">Habilite la depuración USB en las opciones de desarrollador</div>
              </div>
            ) : (
              logs.map((log, i) => <div key={i} className="log-line">{`> ${log}`}</div>)
            )}
          </div>
        </div>
      </main>

      {isLogViewerOpen && (
        <div className="log-viewer-modal" ref={logViewerRef}>
          <div className="modal-content">
            <div className="modal-header">
              <h2>
                <Icons.Mobile /> Monitor de Actividad
              </h2>
              <div className="modal-actions">
                <button onClick={clearMobileLogs} className="btn-secondary" title="Limpiar actividad">
                  <Icons.Trash /> Limpiar
                </button>
                <button onClick={copyMobileLogs} className="btn-secondary" title="Copiar actividad">
                  <Icons.Copy /> Copiar
                </button>
                <button onClick={stopLogViewer} className="btn-danger" title="Cerrar monitor">
                  <Icons.Close /> Cerrar
                </button>
              </div>
            </div>
            <div className="modal-body">
              <div className="mobile-logs">
                {!connectedDevice ? (
                  <div className="empty-logs">
                    <div className="empty-logs-icon"><Icons.Alert /></div>
                    <div style={{ marginBottom: '16px', color: '#F59E0B', fontSize: '14px', fontWeight: '600' }}>
                      Dispositivo desconectado
                    </div>
                    <div style={{ marginBottom: '16px', color: '#a8c5d1' }}>
                      Conecte el dispositivo para continuar viendo la actividad
                    </div>
                    {mobileLogs.length > 0 && (
                      <button
                        onClick={resumeLogViewer}
                        className="btn-secondary"
                        style={{ marginTop: '8px' }}
                      >
                        <Icons.Refresh /> Reanudar monitor
                      </button>
                    )}
                  </div>
                ) : mobileLogs.length === 0 ? (
                  <div className="empty-logs">
                    <Icons.Info />
                    <span style={{ marginLeft: '8px' }}>Esperando actividad del dispositivo...</span>
                  </div>
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
                <span>Mostrando últimos {mobileLogs.length} eventos</span>
                <span className="log-filters">
                  FinanciaTech | Configuración | Notificaciones | Sistema
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
