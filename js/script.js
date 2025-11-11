import { ESPLoader, Transport } from "https://unpkg.com/esptool-js@0.5.6/bundle.js";

// Versión reducida: solo conexión y lectura de MAC
const baudRates = [115200, 921600];

const log = document.getElementById("log");
const butConnect = document.getElementById("butConnect");
const baudRate = document.getElementById("baudRate");

let device = null;
let transport = null;
let esploader = null;
let chip = null;
let detectedMac = null;
const serialLib = ("serial" in navigator) ? navigator.serial : navigator.usb;

document.addEventListener("DOMContentLoaded", () => {
    initBaudRate();
    butConnect.addEventListener("click", () => {
        clickConnect().catch((e) => {
            writeLogLine('Error: ' + (e.message || e));
        });
    });
    writeLogLine("Listo: use el botón 'Conectar' para seleccionar puerto y leer MAC.");
});

function initBaudRate() {
    for (let rate of baudRates) {
        var option = document.createElement("option");
        option.text = rate + " Baud";
        option.value = rate;
        if (baudRate) baudRate.add(option);
    }
}

function pruneLog() {
    // Remove old log content
    if (log.textContent.split("\n").length > maxLogLength + 1) {
        let logLines = log.innerHTML.replace(/(\n)/gm, "").split("<br>");
        log.innerHTML = logLines.splice(-maxLogLength).join("<br>\n");
    }

    if (autoscroll.checked) {
        log.scrollTop = log.scrollHeight;
    }
}

function writeLog(text) {
    if (!log) return;
    log.innerHTML += text;
}

function writeLogLine(text) {
    writeLog(text + "<br>");
}

// Terminal simplificado para capturar la MAC del output
const espLoaderTerminal = {
    clean() { if (log) log.innerHTML = ""; detectedMac = null; },
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
    write(data) { writeLog(data); },
};

function errorMsg(text) { writeLogLine('<span class="error-message">Error:</span> ' + text); console.error(text); }

/**
 * @name updateTheme
 * Sets the theme to  Adafruit (dark) mode. Can be refactored later for more themes
 */
function updateTheme() {
    // Disable all themes
    document
        .querySelectorAll("link[rel=stylesheet].alternate")
        .forEach((styleSheet) => {
        enableStyleSheet(styleSheet, false);
        });

    if (darkMode.checked) {
        enableStyleSheet(darkSS, true);
    } else {
        enableStyleSheet(lightSS, true);
    }
}

function enableStyleSheet(node, enabled) {
    node.disabled = !enabled;
}

/**
 * @name clickConnect
 * Click handler for the connect/disconnect button.
 */
async function clickConnect() {
    // Disconnect path
    if (transport !== null) {
        try { await transport.disconnect(); await transport.waitForUnlock(1500); } catch(e){}
        transport = null;
        if (device) { try { await device.close(); } catch(e){} device = null; }
        detectedMac = null;
        writeLogLine('Desconectado');
        return;
    }

    // Request port and create transport
    if (device === null) {
        device = await serialLib.requestPort({});
    }
    transport = new Transport(device, true);

    const romBaudrate = parseInt(baudRate && baudRate.value ? baudRate.value : 115200);
    const loaderOptions = { transport: transport, baudrate: romBaudrate, terminal: espLoaderTerminal, debugLogging: false };
    esploader = new ESPLoader(loaderOptions);

    try {
        // Reset captured MAC
        detectedMac = null;
        chip = await esploader.main('default_reset');
        writeLogLine('Detectado: ' + chip);

        if (detectedMac) {
            writeLogLine('MAC: ' + detectedMac);
            return;
        }

        // Fallback: try reading eFuse registers (por ejemplo en H2)
        if (typeof esploader.readReg === 'function' && chip && chip.toLowerCase().includes('h2')) {
            try {
                const mac0 = await esploader.readReg(0x600B0844);
                const mac1 = await esploader.readReg(0x600B0848);
                const macArr = [ (mac1>>8)&0xff, mac1&0xff, (mac0>>24)&0xff, (mac0>>16)&0xff, (mac0>>8)&0xff, mac0&0xff ];
                const macStr = macArr.map(b => b.toString(16).padStart(2,'0')).join(':').toUpperCase();
                writeLogLine('MAC (efuse): ' + macStr);
                return;
            } catch (e) {
                writeLogLine('No se pudo leer eFuse: ' + (e.message || e));
            }
        }

        writeLogLine('MAC no encontrada en salida inicial.');
    } catch (e) {
        writeLogLine('Error durante conexión: ' + (e.message || e));
        console.error(e);
    }
}

/**
 * @name changeBaudRate
 * Change handler for the Baud Rate selector.
 */
async function changeBaudRate() {
    if (baudRates.includes(parseInt(baudRate.value))) {
        saveSetting("baudrate", baudRate.value);
    }
}

/**
 * @name clickAutoscroll
 * Change handler for the Autoscroll checkbox.
 */
async function clickAutoscroll() {
    saveSetting("autoscroll", autoscroll.checked);
}

/**
 * @name clickDarkMode
 * Change handler for the Dark Mode checkbox.
 */
async function clickDarkMode() {
    updateTheme();
    saveSetting("darkmode", darkMode.checked);
}

/**
 * @name clickNoReset
 * Change handler for ESP32 co-processor boards
 */
async function clickNoReset() {
    saveSetting("noReset", noReset.checked);
}

/**
 * @name clickErase
 * Click handler for the erase button.
 */
async function clickErase() {
    if (
        window.confirm("This will erase the entire flash. Click OK to continue.")
    ) {
        baudRate.disabled = true;
        butErase.disabled = true;
        butProgram.disabled = true;
        try {
            writeLogLine("Erasing flash memory. Please wait...");
            let stamp = Date.now();
            await esploader.eraseFlash();
            writeLogLine("Finished. Took " + (Date.now() - stamp) + "ms to erase.");
        } catch (e) {
            errorMsg(e);
        } finally {
            butErase.disabled = false;
            baudRate.disabled = false;
            butProgram.disabled = getValidFiles().length == 0;
        }
    }
}

/**
 * @name clickProgram
 * Click handler for the program button.
 */
async function clickProgram() {
    const readUploadedFileAsBinaryString = (inputFile) => {
        const reader = new FileReader();

        return new Promise((resolve, reject) => {
            reader.onerror = () => {
                reader.abort();
                reject(new DOMException("Problem parsing input file."));
            };

            reader.onload = () => {
                resolve(reader.result);
            };
            reader.readAsBinaryString(inputFile);
        });
    };

    baudRate.disabled = true;
    butErase.disabled = true;
    butProgram.disabled = true;
    for (let i = 0; i < 4; i++) {
        firmware[i].disabled = true;
        offsets[i].disabled = true;
    }

    const fileArray = [];
    for (let file of getValidFiles()) {
        progress[file].classList.remove("hidden");
        let binfile = firmware[file].files[0];
        let contents = await readUploadedFileAsBinaryString(binfile);
        try {
            let offset = parseInt(offsets[file].value, 16);
            fileArray.push({ data: contents, address: offset });
        } catch (e) {
            errorMsg(e);
        }
    }

    try {
        const flashOptions = {
            fileArray: fileArray,
            flashSize: "keep",
            eraseAll: false,
            compress: true,
            reportProgress: (fileIndex, written, total) => {
                progress[fileIndex].querySelector("div").style.width = Math.floor((written / total) * 100) + "%";
            },
            calculateMD5Hash: (image) => CryptoJS.MD5(CryptoJS.enc.Latin1.parse(image)),
        };
        await esploader.writeFlash(flashOptions);
    } catch (e) {
        console.error(e);
        errorMsg(e.message);
    } finally {
        for (let i = 0; i < 4; i++) {
            firmware[i].disabled = false;
            offsets[i].disabled = false;
            progress[i].classList.add("hidden");
            progress[i].querySelector("div").style.width = "0";
        }
        butErase.disabled = false;
        baudRate.disabled = false;
        butProgram.disabled = getValidFiles().length == 0;
    }

    writeLogLine("To run the new firmware, please reset your device.");
}

function getValidFiles() {
    // Get a list of file and offsets
    // This will be used to check if we have valid stuff
    // and will also return a list of files to program
    let validFiles = [];
    let offsetVals = [];
    for (let i = 0; i < 4; i++) {
        let offs = parseInt(offsets[i].value, 16);
        if (firmware[i].files.length > 0 && !offsetVals.includes(offs)) {
            validFiles.push(i);
            offsetVals.push(offs);
        }
    }
    return validFiles;
}

/**
 * @name checkProgrammable
 * Check if the conditions to program the device are sufficient
 */
async function checkProgrammable() {
    butProgram.disabled = getValidFiles().length == 0;
}

/**
 * @name checkFirmware
 * Handler for firmware upload changes
 */
async function checkFirmware(event) {
    let filename = event.target.value.split("\\").pop();
    let label = event.target.parentNode.querySelector("span");
    let icon = event.target.parentNode.querySelector("svg");
    if (filename != "") {
        if (filename.length > 17) {
            label.innerHTML = filename.substring(0, 14) + "&hellip;";
        } else {
            label.innerHTML = filename;
        }
        icon.classList.add("hidden");
    } else {
        label.innerHTML = "Choose a file&hellip;";
        icon.classList.remove("hidden");
    }

    await checkProgrammable();
}

/**
 * @name clickClear
 * Click handler for the clear button.
 */
async function clickClear() {
    // reset();     Reset function wasnt declared.
    log.innerHTML = "";
}

function toggleUIToolbar(show) {
    for (let i = 0; i < 4; i++) {
        progress[i].classList.add("hidden");
        progress[i].querySelector("div").style.width = "0";
    }
    if (show) {
        appDiv.classList.add("connected");
    } else {
        appDiv.classList.remove("connected");
    }
    butErase.disabled = !show;
}

function toggleUIConnected(connected) {
    let lbl = "Conectar";
    if (connected) {
        lbl = "Desconectar";
    } else {
        toggleUIToolbar(false);
    }
    butConnect.textContent = lbl;
}

function loadAllSettings() {
    // Load all saved settings or defaults
    autoscroll.checked = loadSetting("autoscroll", true);
    baudRate.value = loadSetting("baudrate", 115200);
    darkMode.checked = loadSetting("darkmode", false);
    noReset.checked = loadSetting("noReset", false);
}

function loadSetting(setting, defaultValue) {
    let value = JSON.parse(window.localStorage.getItem(setting));
    if (value == null) {
        return defaultValue;
    }

    return value;
}

function saveSetting(setting, value) {
    window.localStorage.setItem(setting, JSON.stringify(value));
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @name formatMacAddr
 * Format MAC address from array to string
 */
function formatMacAddr(macAddr) {
    if (!macAddr || macAddr.length === 0) {
        return "No disponible";
    }
    
    // Check if all bytes are zero
    const isZeroMac = macAddr.every(byte => byte === 0);
    if (isZeroMac) {
        return "00:00:00:00:00:00 (No programada)";
    }
    
    return macAddr.map(value => value.toString(16).toUpperCase().padStart(2, "0")).join(":");
}
