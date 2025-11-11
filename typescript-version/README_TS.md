# Lector de MAC ESP32 (TypeScript)

Versión migrada a TypeScript del lector de MAC para dispositivos ESP32.

## � Ubicación

Este directorio contiene la versión TypeScript del proyecto, separada del código JavaScript original.

## � Instalación y Uso

### 1. Navegar al directorio

```bash
cd typescript-version
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Compilar TypeScript

```bash
npm run build
```

Esto compilará `src/script.ts` → `dist/script.js`

### 4. Iniciar servidor

```bash
npm run serve
```

O para desarrollo con auto-compilación:

```bash
npm run dev
```

Luego abre http://localhost:8000 en tu navegador.

## 📁 Estructura

```
typescript-version/
├── src/
│   ├── script.ts      # Código TypeScript
│   └── types.d.ts     # Declaraciones de tipos
├── dist/              # JavaScript compilado
├── index.html         # Interfaz web
├── tsconfig.json      # Config TypeScript
├── package.json       # Dependencias
└── README_TS.md       # Este archivo
```

## 🔧 Scripts

- `npm run build` - Compilar TS → JS
- `npm run watch` - Auto-compilación
- `npm run serve` - Servidor HTTP
- `npm run dev` - Watch + Serve

## ✨ Ventajas de TypeScript

- ✅ Tipos seguros en tiempo de compilación
- ✅ Autocompletado mejorado en IDEs
- ✅ Detección temprana de errores
- ✅ Mejor documentación del código
- ✅ Refactorización más segura

## � Diferencias con la versión JavaScript

La funcionalidad es idéntica, pero con:
- Tipos explícitos para todas las variables
- Interfaces para objetos complejos
- Validación de tipos en tiempo de compilación
- Source maps para debugging

## 👤 Autor

Adaptado por Cesar Bautista para UNIT-Electronics
