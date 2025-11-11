/// <reference path="./types.d.ts" />

// @ts-ignore: import from CDN
import { ESPLoader, Transport } from "https://unpkg.com/esptool-js@0.5.6/bundle.js";

// Tipos
interface Terminal {
    clean(): void;
    writeLine(data: string): void;
    write(data: string): void;
}

interface LoaderOptions {
    transport: Transport;
    baudrate: number;
    terminal: Terminal;
    debugLogging: boolean;
}

// Constantes
const baudRates: number[] = [115200, 921600];

// Elementos del DOM
const log = document.getElementById("log") as HTMLDivElement;
const butConnect = document.getElementById("butConnect") as HTMLButtonElement;
const baudRate = document.getElementById("baudRate") as HTMLSelectElement;
const chipType = document.getElementById("chipType") as HTMLSpanElement;
const chipMac = document.getElementById("chipMac") as HTMLSpanElement;

// Variables de estado
let device: SerialPort | null = null;
let transport: Transport | null = null;
let esploader: ESPLoader | null = null;
let chip: string | null = null;
let detectedMac: string | null = null;
const serialLib = ("serial" in navigator) ? navigator.serial : (navigator as any).usb;

// Inicialización
document.addEventListener("DOMContentLoaded", (): void => {
    initBaudRate();
    butConnect.addEventListener("click", (): void => {
        clickConnect().catch((e: Error): void => {
            writeLogLine('Error: ' + (e.message || e));
        });
    });
    writeLogLine("Listo para conectar. Presione 'Conectar' y seleccione el puerto serial.");
});

function initBaudRate(): void {
    for (const rate of baudRates) {
        const option: HTMLOptionElement = document.createElement("option");
        option.text = rate + " Baud";
        option.value = rate.toString();
        if (baudRate) baudRate.add(option);
    }
}

function writeLog(text: string): void {
    if (!log) return;
    log.innerHTML += text;
}

function writeLogLine(text: string): void {
    writeLog(text + "<br>");
}

// Terminal simplificado para capturar la MAC del output
const espLoaderTerminal: Terminal = {
    clean(): void { 
        if (log) log.innerHTML = ""; 
        detectedMac = null; 
    },
    writeLine(data: string): void {
        writeLogLine(data);
        if (data && typeof data === 'string') {
            const macMatch: RegExpMatchArray | null = data.match(/MAC:\s*([0-9a-fA-F:]{17})/);
            if (macMatch) {
                detectedMac = macMatch[1].toUpperCase();
                console.log("MAC capturada:", detectedMac);
            }
        }
    },
    write(data: string): void { 
        writeLog(data); 
    },
};

// Manejador de conexión/desconexión
async function clickConnect(): Promise<void> {
    // Ruta de desconexión
    if (transport !== null) {
        try { 
            await transport.disconnect(); 
            await transport.waitForUnlock(1500); 
        } catch(e) {
            console.error("Error al desconectar:", e);
        }
        transport = null;
        
        if (device) { 
            try { 
                await device.close(); 
            } catch(e) {
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

    const romBaudrate: number = parseInt(baudRate && baudRate.value ? baudRate.value : "115200");
    const loaderOptions: LoaderOptions = { 
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
                const mac0: number = await esploader.readReg(0x600B0844);
                const mac1: number = await esploader.readReg(0x600B0848);
                const macArr: number[] = [ 
                    (mac1>>8)&0xff, 
                    mac1&0xff, 
                    (mac0>>24)&0xff, 
                    (mac0>>16)&0xff, 
                    (mac0>>8)&0xff, 
                    mac0&0xff 
                ];
                const macStr: string = macArr.map((b: number) => b.toString(16).padStart(2,'0')).join(':').toUpperCase();
                chipMac.textContent = macStr;
                writeLogLine('✓ MAC (eFuse): ' + macStr);
                butConnect.textContent = "Desconectar";
                return;
            } catch (e) {
                const error = e as Error;
                writeLogLine('⚠ No se pudo leer eFuse: ' + (error.message || error));
            }
        }

        chipMac.textContent = "No disponible";
        writeLogLine('⚠ MAC no encontrada en salida inicial.');
        butConnect.textContent = "Desconectar";
    } catch (e) {
        const error = e as Error;
        chipType.textContent = "Error";
        chipMac.textContent = "--:--:--:--:--:--";
        writeLogLine('✗ Error durante conexión: ' + (error.message || error));
        console.error(e);
    }
}
