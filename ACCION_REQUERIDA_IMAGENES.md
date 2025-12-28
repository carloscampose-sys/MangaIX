# ⚠️ ACCIÓN REQUERIDA: Extraer Imágenes de Género

## 🎯 Objetivo

Necesitas extraer las 3 figuras de la imagen de referencia y guardarlas como archivos PNG en la carpeta `public/`.

## 📸 Imagen de Referencia

La imagen que me proporcionaste contiene 3 personajes:
1. **Izquierda**: Personaje con hoodie verde y controlador → `gender-masculino.png`
2. **Centro**: Personaje con flores rosadas y vestido crema → `gender-femenino.png`
3. **Derecha**: Personaje con poncho multicolor y lentes → `gender-otro.png`

## 🚀 Proceso Rápido (5-10 minutos)

### Paso 1: Remover Fondo
1. Ve a **https://www.remove.bg/**
2. Sube la imagen de referencia
3. Descarga la imagen sin fondo (botón "Download")

### Paso 2: Recortar Figuras
1. Ve a **https://www.photopea.com/**
2. Abre la imagen sin fondo (File > Open)
3. Selecciona la herramienta "Rectangular Marquee Tool" (M)
4. Recorta el primer personaje (Masculino):
   - Selecciona el área alrededor del personaje
   - Edit > Copy (Ctrl+C)
   - File > New (Ctrl+N) - acepta el tamaño sugerido
   - Edit > Paste (Ctrl+V)
   - Image > Trim (para ajustar el canvas)
5. Usa "Clone Stamp Tool" (S) para remover el texto "MASCULINO":
   - Mantén Alt presionado y haz clic en un área limpia
   - Pinta sobre el texto para cubrirlo
6. File > Export As > PNG
7. Guarda como `gender-masculino.png`
8. Repite los pasos 4-7 para los otros dos personajes

### Paso 3: Colocar Archivos
Guarda los 3 archivos PNG en la carpeta `public/` de tu proyecto:
```
public/
├── gender-masculino.png
├── gender-femenino.png
└── gender-otro.png
```

## ✅ Verificación

Después de colocar las imágenes:
1. Inicia el servidor: `npm run dev`
2. Ve a la pantalla de selección de género
3. Verifica que las 3 figuras se muestren correctamente
4. Prueba las animaciones hover y selección

## 🎨 Especificaciones

- **Formato**: PNG con transparencia
- **Tamaño**: 300-400px de altura (el ancho se ajusta proporcionalmente)
- **Fondo**: Completamente transparente
- **Texto**: Removido (sin "MASCULINO", "FEMENINO", "OTRO")
- **Calidad**: Alta (sin artefactos o bordes blancos)

## 🛠️ Herramientas Alternativas

Si prefieres otras herramientas:
- **Photoshop**: Usa Magic Wand + Layer Mask
- **GIMP**: Usa Select by Color + Delete
- **Figma**: Importa y exporta con transparencia
- **Canva**: Usa Background Remover (requiere cuenta Pro)

## 📚 Documentación Adicional

- Instrucciones detalladas: `design-references/INSTRUCCIONES_EXTRACCION_FIGURAS.md`
- Placeholders temporales: `public/CREAR_PLACEHOLDERS_RAPIDO.md`
- Resumen de implementación: `RESUMEN_IMPLEMENTACION_GENERO.md`

## 💡 Tip

Si quieres ver el componente funcionando antes de extraer las imágenes reales, puedes crear placeholders temporales con emojis grandes (ver `public/CREAR_PLACEHOLDERS_RAPIDO.md`).

## ✨ Resultado Final

Una vez completado, tendrás una hermosa pantalla de selección de género con:
- ⭐ Estrellas parpadeantes en el fondo
- 🎨 Figuras ilustradas personalizadas
- ✨ Animaciones suaves en hover
- 🎯 Efectos visuales claros en selección
