# Solución para lectura de MAC en ESP32-H2

## Cambios Realizados

### 1. **index.html**
- Se agregó un div con id `chipInfo` para mostrar la información del chip y su dirección MAC
- Este div contiene dos spans: uno para el tipo de chip y otro para la dirección MAC

### 2. **js/script.js**
- Se agregaron referencias a los nuevos elementos del DOM (chipInfo, chipType, chipMac)
- Se implementó la función `formatMacAddr()` que formatea correctamente la dirección MAC de un array de bytes a formato XX:XX:XX:XX:XX:XX
- Se modificó `clickConnect()` para:
  - Llamar a `esploader.readMac()` después de conectar al dispositivo
  - Mostrar el tipo de chip detectado
  - Mostrar la dirección MAC formateada
  - Manejar errores si no se puede leer la MAC
- Se actualizó la función de desconexión para limpiar la información del chip

### 3. **css/style.css, dark.css, light.css**
- Se agregaron estilos para `.chip-info` que muestra la información de manera elegante
- Los estilos son consistentes en modo claro y oscuro

## Problema Específico con ESP32-H2

El ESP32-H2 es un chip más reciente de Espressif que puede tener las siguientes diferencias:

1. **Formato de MAC diferente**: El H2 puede usar un formato de MAC diferente o tener múltiples MACs (WiFi, BLE)

2. **Versión de esptool-js**: El proyecto usa esptool-js@0.5.4. Si hay problemas, considera actualizar a una versión más reciente que tenga mejor soporte para H2:
   ```javascript
   // En script.js línea 1
   import { ESPLoader, Transport } from "https://unpkg.com/esptool-js@latest/bundle.js";
   ```

3. **Comando readMac()**: Si `readMac()` no funciona correctamente con H2, puedes intentar usar comandos específicos:
   ```javascript
   // Alternativa si readMac() falla
   let mac = await esploader.readReg(0x60008800); // Registro específico de MAC
   ```

## Pruebas Recomendadas

1. Conecta tu dispositivo ESP32-H2
2. Haz clic en "Conectar"
3. Verifica que:
   - Se muestre el tipo de chip correctamente
   - Se muestre la dirección MAC en formato XX:XX:XX:XX:XX:XX
   - Los mensajes aparezcan en el log

## Solución de Problemas

Si la MAC no se lee correctamente:

1. **Revisa la consola del navegador** (F12) para ver errores específicos
2. **Verifica la versión de esptool-js** - puede necesitar actualización
3. **Comprueba el chip detectado** - debe mostrar "esp32h2" o similar
4. **Prueba con otro baudrate** - algunos chips requieren velocidades específicas

## Código de Debugging Adicional

Si necesitas más información, agrega esto después de la línea de `chip = await esploader.main(resetMode);`:

```javascript
console.log("Chip completo:", chip);
console.log("Loader:", esploader);
console.log("Intentando leer MAC...");
```

Esto te mostrará más detalles en la consola del navegador.
