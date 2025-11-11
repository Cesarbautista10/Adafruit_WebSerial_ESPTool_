# ESP32 MAC Address Reader

A lightweight web tool to connect to ESP32 devices and read their MAC addresses using WebSerial API.

## Features

- **Simple Connection**: Connect to ESP32 devices directly from your browser
- **MAC Address Reading**: Automatically detects and displays the device MAC address
- **TypeScript**: Fully typed codebase for better reliability and maintainability
- **Multiple Chip Support**: Works with ESP32, ESP32-S2, ESP32-S3, ESP32-C3, ESP32-C6, and ESP32-H2
- **No Installation**: Runs directly in the browser using Web Serial API

## Requirements

- Modern browser with Web Serial API support (Chrome 89+, Edge 89+, Opera 76+)
- USB connection to ESP32 device

## Usage

### Online

Visit the live tool: https://cesarbautista10.github.io/Adafruit_WebSerial_ESPTool_/

### Local Development

1. Clone this repository:
```bash
git clone https://github.com/Cesarbautista10/Adafruit_WebSerial_ESPTool_.git
cd Adafruit_WebSerial_ESPTool_
```

2. Install dependencies:
```bash
npm install
```

3. Build the TypeScript code:
```bash
npm run build
```

4. Start a local server:
```bash
npm run serve
```

5. Open http://localhost:8000 in your browser

## Project Structure

```
.
├── src/
│   ├── script.ts       # Main TypeScript source code
│   └── types.d.ts      # Type definitions
├── dist/
│   └── script.js       # Compiled JavaScript
├── index.html          # Web interface
├── tsconfig.json       # TypeScript configuration
└── package.json        # Project dependencies
```

## Development

### TypeScript Compilation

- **Build once**: `npm run build`
- **Watch mode**: `npm run watch`
- **Serve**: `npm run serve`

### Making Changes

1. Edit `src/script.ts` for application logic
2. Edit `src/types.d.ts` for type definitions
3. Run `npm run build` to compile
4. Test in browser with `npm run serve`

## Technical Details

- **esptool-js**: v0.5.6
- **TypeScript**: v5.3.0
- **Target**: ES2020
- **Module System**: ES Modules

## How It Works

1. Uses Web Serial API to establish connection with ESP32 device
2. Communicates with the ROM bootloader using esptool-js
3. Captures MAC address from chip detection output
4. Displays chip type and MAC address in the interface

## Browser Compatibility

| Browser | Version | Support |
|---------|---------|---------|
| Chrome  | 89+     | ✅ Yes  |
| Edge    | 89+     | ✅ Yes  |
| Opera   | 76+     | ✅ Yes  |
| Firefox | -       | ❌ No   |
| Safari  | -       | ❌ No   |

## Origin

This project is based on [Adafruit WebSerial ESPTool](https://github.com/adafruit/Adafruit_WebSerial_ESPTool), simplified and focused specifically on reading MAC addresses from ESP32 devices.

## License

See [license.md](license.md) for details.