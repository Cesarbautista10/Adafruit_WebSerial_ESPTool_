# 📋 Versiones Disponibles

Este repositorio contiene **dos versiones** del Lector de MAC para ESP32:

## 📂 Raíz del Proyecto (JavaScript)

**Ubicación**: Archivos en la raíz (`index.html`, `js/script.js`)  
**Tecnología**: JavaScript puro (ES6+)  
**Uso**: Abrir `index.html` directamente o con servidor HTTP  

```bash
python3 -m http.server 8000
# Abre http://localhost:8000
```

### Ventajas
- ✅ Sin compilación necesaria
- ✅ Código directo y simple
- ✅ Rápido para pruebas

---

## 📂 Versión TypeScript

**Ubicación**: `typescript-version/`  
**Tecnología**: TypeScript con tipos seguros  
**Uso**: Requiere compilación con npm  

```bash
cd typescript-version
npm install
npm run build
npm run serve
# Abre http://localhost:8000
```

### Ventajas
- ✅ Tipos seguros
- ✅ Mejor IDE support
- ✅ Detección de errores en compile-time
- ✅ Código más mantenible

---

## 🚀 Funcionalidad

Ambas versiones tienen la **misma funcionalidad**:
- Conexión vía Web Serial API
- Detección automática de chip (ESP32-C6, H2, etc.)
- Lectura de dirección MAC
- Fallback a registros eFuse para ESP32-H2

---

## 💡 ¿Cuál usar?

- **JavaScript**: Para desarrollo rápido y pruebas
- **TypeScript**: Para proyectos a largo plazo y equipos

---

## 📝 Ramas

- `main`: Versión JavaScript estable
- `test`: Código reducido solo conexión y MAC
- `typescript-version`: Versión TypeScript completa
