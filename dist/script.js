// @ts-ignore: import from CDN
import { ESPLoader, Transport } from "https://unpkg.com/esptool-js@0.5.6/bundle.js";
// Constantes
const baudRates = [115200, 921600];
// Elementos del DOM
const log = document.getElementById("log");
const butConnect = document.getElementById("butConnect");
const baudRate = document.getElementById("baudRate");
const chipType = document.getElementById("chipType");
const chipMac = document.getElementById("chipMac");
// Variables de estado
let device = null;
let transport = null;
let esploader = null;
let chip = null;
let detectedMac = null;
const serialLib = ("serial" in navigator) ? navigator.serial : navigator.usb;
// Inicialización
document.addEventListener("DOMContentLoaded", () => {
    initBaudRate();
    butConnect.addEventListener("click", () => {
        clickConnect().catch((e) => {
            writeLogLine('Error: ' + (e.message || e));
        });
    });
    writeLogLine("Listo para conectar. Presione 'Conectar' y seleccione el puerto serial.");
});
function initBaudRate() {
    for (const rate of baudRates) {
        const option = document.createElement("option");
        option.text = rate + " Baud";
        option.value = rate.toString();
        if (baudRate)
            baudRate.add(option);
    }
}
function writeLog(text) {
    if (!log)
        return;
    log.innerHTML += text;
}
function writeLogLine(text) {
    writeLog(text + "<br>");
}
// Terminal simplificado para capturar la MAC del output
const espLoaderTerminal = {
    clean() {
        if (log)
            log.innerHTML = "";
        detectedMac = null;
    },
    writeLine(data) {
        writeLogLine(data);
        if (data && typeof data === 'string') {
            const macMatch = data.match(/MAC:\s*([0-9a-fA-F:]{17})/);
            if (macMatch) {
                detectedMac = macMatch[1].toUpperCase();
                console.log("MAC capturada:", detectedMac);
            }
        }
    },
    write(data) {
        writeLog(data);
    },
};
// Manejador de conexión/desconexión
async function clickConnect() {
    // Ruta de desconexión
    if (transport !== null) {
        try {
            await transport.disconnect();
            await transport.waitForUnlock(1500);
        }
        catch (e) {
            console.error("Error al desconectar:", e);
        }
        transport = null;
        if (device) {
            try {
                await device.close();
            }
            catch (e) {
                console.error("Error al cerrar puerto:", e);
            }
            device = null;
        }
        detectedMac = null;
        chip = null;
        chipType.textContent = "No conectado";
        chipMac.textContent = "--:--:--:--:--:--";
        butConnect.textContent = "Conectar";
        writeLogLine('Desconectado');
        return;
    }
    // Solicitar puerto y crear transporte
    if (device === null) {
        device = await serialLib.requestPort({});
    }
    transport = new Transport(device, true);
    const romBaudrate = parseInt(baudRate && baudRate.value ? baudRate.value : "115200");
    const loaderOptions = {
        transport: transport,
        baudrate: romBaudrate,
        terminal: espLoaderTerminal,
        debugLogging: false
    };
    esploader = new ESPLoader(loaderOptions);
    try {
        // Resetear MAC capturada
        detectedMac = null;
        chip = await esploader.main('default_reset');
        chipType.textContent = chip;
        writeLogLine('✓ Detectado: ' + chip);
        if (detectedMac) {
            chipMac.textContent = detectedMac;
            writeLogLine('✓ MAC: ' + detectedMac);
            butConnect.textContent = "Desconectar";
            return;
        }
        // Fallback: intentar leer registros eFuse (por ejemplo en H2)
        if (typeof esploader.readReg === 'function' && chip && chip.toLowerCase().includes('h2')) {
            try {
                const mac0 = await esploader.readReg(0x600B0844);
                const mac1 = await esploader.readReg(0x600B0848);
                const macArr = [
                    (mac1 >> 8) & 0xff,
                    mac1 & 0xff,
                    (mac0 >> 24) & 0xff,
                    (mac0 >> 16) & 0xff,
                    (mac0 >> 8) & 0xff,
                    mac0 & 0xff
                ];
                const macStr = macArr.map((b) => b.toString(16).padStart(2, '0')).join(':').toUpperCase();
                chipMac.textContent = macStr;
                writeLogLine('✓ MAC (eFuse): ' + macStr);
                butConnect.textContent = "Desconectar";
                return;
            }
            catch (e) {
                const error = e;
                writeLogLine('⚠ No se pudo leer eFuse: ' + (error.message || error));
            }
        }
        chipMac.textContent = "No disponible";
        writeLogLine('⚠ MAC no encontrada en salida inicial.');
        butConnect.textContent = "Desconectar";
    }
    catch (e) {
        const error = e;
        chipType.textContent = "Error";
        chipMac.textContent = "--:--:--:--:--:--";
        writeLogLine('✗ Error durante conexión: ' + (error.message || error));
        console.error(e);
    }
}
//# sourceMappingURL=script.js.map