import { useState, useEffect } from 'react'
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

  const appendLog = (msg: string) => setLogs((prev) => [...prev, msg]);

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
                setConnectedDevice(deviceName);
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
  }, [status, connectedDevice]);

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
          
          <button 
            className="provision-btn"
            disabled={!connectedDevice || (status !== 'idle' && status !== 'success' && status !== 'error')}
            onClick={handleProvision}
          >
            <span className="icon">⚡</span>
            {connectedDevice ? 'Provisionar Equipo' : 'Conecta un Equipo USB'}
          </button>
        </div>

        <div className="terminal-log">
          <div className="terminal-header">Logs de ADB</div>
          <div className="terminal-body">
            {logs.length === 0 ? (
              <span className="empty-log">Conecte el dispositivo mediante USB y habilite la Depuración USB.</span>
            ) : (
              logs.map((log, i) => <div key={i} className="log-line">{`> ${log}`}</div>)
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
