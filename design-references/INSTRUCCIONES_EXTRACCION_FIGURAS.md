# Instrucciones para Extraer Figuras de Género

## Imagen de Referencia

La imagen de referencia contiene 3 personajes ilustrados con sus etiquetas:
- **Izquierda**: Personaje con hoodie verde y controlador (MASCULINO)
- **Centro**: Personaje con flores rosadas y vestido crema (FEMENINO)
- **Derecha**: Personaje con poncho multicolor y lentes (OTRO)

## Proceso de Extracción

### Opción 1: Usar remove.bg (Recomendado - Más Rápido)

1. Ve a https://www.remove.bg/
2. Sube la imagen de referencia
3. Descarga la imagen sin fondo
4. Abre en un editor de imágenes (Photoshop, GIMP, Photopea)
5. Recorta cada personaje individualmente:
   - Selecciona el área del primer personaje (Masculino)
   - Copia y pega en un nuevo archivo
   - Guarda como `gender-masculino.png`
   - Repite para los otros dos personajes
6. Asegúrate de remover el texto de las etiquetas

### Opción 2: Usar Photoshop/GIMP (Control Manual)

1. Abre la imagen en Photoshop o GIMP
2. Usa la herramienta "Magic Wand" o "Select by Color" para seleccionar el fondo blanco
3. Elimina el fondo (Delete o Backspace)
4. Usa la herramienta "Lasso" o "Rectangle Select" para recortar cada personaje
5. Para cada personaje:
   - Selecciona el área del personaje
   - Copia (Ctrl+C)
   - Crea un nuevo archivo (Ctrl+N)
   - Pega (Ctrl+V)
   - Recorta el canvas al contenido (Image > Trim en Photoshop)
   - Guarda como PNG con transparencia
6. Remover manualmente el texto usando la herramienta "Clone Stamp" o "Healing Brush"

### Opción 3: Usar Photopea (Gratis, Online)

1. Ve a https://www.photopea.com/
2. Abre la imagen (File > Open)
3. Usa "Magic Wand Tool" (W) para seleccionar el fondo blanco
4. Presiona Delete para eliminar el fondo
5. Usa "Rectangular Marquee Tool" (M) para seleccionar cada personaje
6. Para cada personaje:
   - Selecciona el área
   - Edit > Copy (Ctrl+C)
   - File > New (Ctrl+N)
   - Edit > Paste (Ctrl+V)
   - Image > Trim
   - File > Export As > PNG
7. Usa "Clone Stamp Tool" (S) para remover el texto

## Especificaciones Técnicas

### Tamaño Recomendado
- Altura: 300-400px
- Ancho: Proporcional (mantener aspect ratio)
- Formato: PNG con transparencia (alpha channel)

### Nombres de Archivos
- `public/gender-masculino.png` - Personaje con hoodie
- `public/gender-femenino.png` - Personaje con flores
- `public/gender-otro.png` - Personaje con poncho

### Optimización
- Después de guardar, optimiza con TinyPNG (https://tinypng.com/)
- Objetivo: < 100KB por imagen
- Mantener calidad visual alta

## Verificación de Calidad

Antes de usar las imágenes, verifica:
- [ ] Fondo completamente transparente (sin bordes blancos)
- [ ] Texto removido completamente
- [ ] Bordes limpios sin artefactos
- [ ] Tamaño apropiado (300-400px altura)
- [ ] Formato PNG con alpha channel
- [ ] Peso de archivo optimizado (< 100KB)

## Ubicación Final

Coloca los archivos en:
```
public/
├── gender-masculino.png
├── gender-femenino.png
└── gender-otro.png
```

## Notas

- Si usas remove.bg, la versión gratuita tiene límite de resolución
- Para mejor calidad, considera la versión HD de remove.bg
- Photopea es una excelente alternativa gratuita a Photoshop
- Mantén copias de las imágenes originales por si necesitas ajustes
