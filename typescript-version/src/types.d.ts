// Declaraciones globales
declare global {
    interface SerialPort {
        readonly readable: ReadableStream<Uint8Array> | null;
        readonly writable: WritableStream<Uint8Array> | null;
        open(options: SerialOptions): Promise<void>;
        close(): Promise<void>;
        forget(): Promise<void>;
        getInfo(): SerialPortInfo;
        getSignals(): Promise<SerialPortSignals>;
        setSignals(signals?: SerialPortSignals): Promise<void>;
        addEventListener(type: string, listener: EventListener): void;
        removeEventListener(type: string, listener: EventListener): void;
    }

    interface SerialOptions {
        baudRate: number;
        dataBits?: number;
        stopBits?: number;
        parity?: "none" | "even" | "odd";
        bufferSize?: number;
        flowControl?: "none" | "hardware";
    }

    interface SerialPortInfo {
        usbVendorId?: number;
        usbProductId?: number;
    }

    interface SerialPortSignals {
        dataTerminalReady?: boolean;
        requestToSend?: boolean;
        break?: boolean;
    }

    interface Serial {
        requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
        getPorts(): Promise<SerialPort[]>;
    }

    interface SerialPortRequestOptions {
        filters?: SerialPortFilter[];
    }

    interface SerialPortFilter {
        usbVendorId?: number;
        usbProductId?: number;
    }

    interface Navigator {
        serial?: Serial;
    }
}

// Declaraciones de tipos para esptool-js
declare module "https://unpkg.com/esptool-js@0.5.6/bundle.js" {
    export class Transport {
        constructor(device: SerialPort, enableTracing?: boolean);
        connect(baudrate: number): Promise<void>;
        disconnect(): Promise<void>;
        waitForUnlock(timeout: number): Promise<void>;
    }

    export class ESPLoader {
        constructor(options: {
            transport: Transport;
            baudrate: number;
            terminal?: {
                clean(): void;
                writeLine(data: string): void;
                write(data: string): void;
            };
            debugLogging?: boolean;
        });
        main(mode: string): Promise<string>;
        readReg(addr: number): Promise<number>;
        eraseFlash(): Promise<void>;
        writeFlash(options: any): Promise<void>;
    }
}

export {};
