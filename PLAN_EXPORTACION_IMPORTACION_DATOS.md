# Plan: Sistema de Exportación/Importación de Datos del Usuario

## 📋 Resumen

Sistema completo para exportar e importar todos los datos del usuario almacenados en localStorage, permitiendo transferir su progreso, configuración y personalización entre dispositivos.

## 🎯 Datos a Exportar/Importar

### 1. Biblioteca y Progreso
- **`library`** - Lista de mangas en la biblioteca con:
  - Mangas guardados
  - Capítulos leídos por manga
  - Rating de cada manga
  - Estado (devorando, completado, pausado)
- **`devouredChapters`** - Total de capítulos devorados (para logros)
- **`notes`** - Notas personales por manga
- **`translations`** - Traducciones guardadas

### 2. Progreso de Lectura
- **`reading_progress`** - Progreso de lectura por capítulo:
  - Página actual en cada capítulo
  - Timestamp de última lectura

### 3. Configuración Visual
- **`potaxie_theme`** - Tema de color personalizado:
  - Color primario
  - Paleta de colores generada
  - Timestamp
- **`potaxie_background_image`** - Imagen de fondo personalizada (base64)
- **`potaxie_background_effects`** - Efectos del fondo (blur, brightness, etc.)
- **`theme`** - Modo claro/oscuro
- **`christmasMode`** - Modo navideño activado/desactivado

### 4. Configuración de Fuentes
- **`source_order`** - Orden personalizado de las fuentes (TuManga, ManhwaWeb, Ikigai)

### 5. Datos de Usuario
- **`userName`** - Nombre del usuario
- **`userGender`** - Género seleccionado (para personalización)

## 🏗️ Arquitectura del Sistema

### Componentes Principales

```
┌─────────────────────────────────────┐
│   ExportImportService               │
│   (src/services/exportImportService.js)│
│                                     │
│   - exportAllData()                 │
│   - importAllData()                 │
│   - validateImportData()            │
│   - downloadBackup()                │
│   - uploadBackup()                  │
└─────────────────────────────────────┘
           │
           │ usa
           ▼
┌─────────────────────────────────────┐
│   BackupModal                       │
│   (src/components/BackupModal.jsx)  │
│                                     │
│   - Botón Exportar                  │
│   - Botón Importar                  │
│   - Preview de datos                │
│   - Confirmación de importación     │
└─────────────────────────────────────┘
           │
           │ accesible desde
           ▼
┌─────────────────────────────────────┐
│   Navbar / Settings                 │
│   (Botón "Backup de Datos 💾")     │
└─────────────────────────────────────┘
```

## 📦 Formato de Exportación

### Estructura del Archivo JSON

```json
{
  "version": "1.0.0",
  "exportDate": "2024-01-15T10:30:00.000Z",
  "appName": "Potaxie Sanctuary",
  "data": {
    "library": {
      "library": [...],
      "devouredChapters": 150,
      "notes": {...},
      "translations": {...}
    },
    "readingProgress": {
      "reading_progress": {...}
    },
    "theme": {
      "potaxie_theme": {...},
      "potaxie_background_image": "data:image/...",
      "potaxie_background_effects": {...},
      "theme": "dark",
      "christmasMode": "false"
    },
    "sources": {
      "source_order": [...]
    },
    "user": {
      "userName": "Potaxina",
      "userGender": "femenino"
    }
  },
  "metadata": {
    "totalMangas": 25,
    "totalChaptersRead": 150,
    "level": "Diva Devoradora ✨",
    "dataSize": "2.5 MB"
  }
}
```

## 🔧 Funcionalidades del Sistema

### 1. Exportación

**Flujo:**
1. Usuario hace clic en "Exportar Datos 💾"
2. Sistema recopila todos los datos de localStorage
3. Genera archivo JSON con timestamp
4. Muestra preview de los datos (cantidad de mangas, capítulos, etc.)
5. Usuario confirma y descarga el archivo: `potaxie-backup-YYYY-MM-DD.json`

**Características:**
- Compresión opcional de imágenes grandes
- Validación de datos antes de exportar
- Nombre de archivo con fecha automática
- Tamaño del archivo mostrado antes de descargar

### 2. Importación

**Flujo:**
1. Usuario hace clic en "Importar Datos 📂"
2. Selecciona archivo JSON de backup
3. Sistema valida el archivo:
   - Verifica formato correcto
   - Verifica versión compatible
   - Detecta datos corruptos
4. Muestra preview de lo que se va a importar
5. Usuario elige modo de importación:
   - **Reemplazar todo** - Borra datos actuales y carga el backup
   - **Fusionar** - Combina datos actuales con el backup (sin duplicados)
6. Confirma y aplica los cambios
7. Recarga la página para aplicar todos los cambios

**Características:**
- Validación exhaustiva del archivo
- Preview antes de importar
- Opción de fusionar o reemplazar
- Backup automático de datos actuales antes de importar
- Rollback en caso de error

### 3. Validaciones

**Validaciones de Exportación:**
- Verificar que existan datos para exportar
- Validar integridad de cada sección
- Calcular tamaño total del archivo
- Advertir si el archivo es muy grande (>10MB)

**Validaciones de Importación:**
- Verificar formato JSON válido
- Verificar versión compatible
- Validar estructura de datos
- Detectar campos faltantes o corruptos
- Verificar que las imágenes base64 sean válidas
- Validar que los IDs de mangas sean consistentes

## 🎨 Interfaz de Usuario

### BackupModal Component

```jsx
<BackupModal>
  {/* Header */}
  <Header>
    <Icon>💾</Icon>
    <Title>Backup de Datos Potaxie</Title>
  </Header>

  {/* Tabs */}
  <Tabs>
    <Tab active>Exportar</Tab>
    <Tab>Importar</Tab>
  </Tabs>

  {/* Exportar Tab */}
  <ExportTab>
    <DataSummary>
      <Stat>📚 {totalMangas} mangas en biblioteca</Stat>
      <Stat>🥑 {devouredChapters} capítulos devorados</Stat>
      <Stat>✨ Nivel: {level}</Stat>
      <Stat>🎨 Tema personalizado guardado</Stat>
    </DataSummary>
    
    <ExportButton onClick={handleExport}>
      Exportar Todos los Datos 💾
    </ExportButton>
    
    <InfoText>
      Se descargará un archivo JSON con todos tus datos.
      Guárdalo en un lugar seguro para restaurar tu progreso.
    </InfoText>
  </ExportTab>

  {/* Importar Tab */}
  <ImportTab>
    <FileUpload>
      <DropZone>
        Arrastra tu archivo de backup aquí
        o haz clic para seleccionar
      </DropZone>
    </FileUpload>
    
    {fileSelected && (
      <Preview>
        <PreviewTitle>Vista Previa del Backup</PreviewTitle>
        <PreviewData>
          <Stat>📚 {importData.totalMangas} mangas</Stat>
          <Stat>🥑 {importData.devouredChapters} capítulos</Stat>
          <Stat>📅 Exportado: {importData.exportDate}</Stat>
        </PreviewData>
        
        <ImportOptions>
          <Radio name="mode" value="replace">
            Reemplazar todos los datos actuales
          </Radio>
          <Radio name="mode" value="merge">
            Fusionar con datos actuales
          </Radio>
        </ImportOptions>
        
        <ImportButton onClick={handleImport}>
          Importar Datos 📂
        </ImportButton>
      </Preview>
    )}
    
    <WarningText>
      ⚠️ Se creará un backup automático de tus datos actuales
      antes de importar.
    </WarningText>
  </ImportTab>
</BackupModal>
```

### Ubicación en la App

**✅ Implementación: Botón en el Navbar**

El botón de Backup se agregará en la barra superior (Navbar) junto a los otros botones existentes:

```jsx
// En Navbar.jsx
<nav className="navbar">
  {/* Botones existentes */}
  <button onClick={handleOracleClick}>🔮 Oráculo</button>
  <button onClick={handleLibraryClick}>📚 Biblioteca</button>
  <button onClick={handleThemeClick}>🎨 Tema</button>
  
  {/* NUEVO: Botón de Backup */}
  <button 
    onClick={() => setShowBackupModal(true)}
    className="backup-button"
    title="Backup de Datos"
  >
    💾 Backup
  </button>
</nav>

{/* Modal de Backup */}
{showBackupModal && (
  <BackupModal onClose={() => setShowBackupModal(false)} />
)}
```

**Características del botón:**
- Emoji: 💾 (disco de guardado)
- Texto: "Backup" o "Datos" (responsive)
- Posición: En la barra superior, junto a otros botones
- Tooltip: "Exportar/Importar tus datos"
- Responsive: En móvil solo muestra el emoji 💾

## 🔐 Seguridad y Privacidad

### Consideraciones

1. **Datos Locales**: Todo se maneja en el navegador, sin enviar datos a servidores
2. **Encriptación Opcional**: Posibilidad de encriptar el backup con contraseña
3. **Validación Estricta**: Verificar que los datos importados sean seguros
4. **Backup Automático**: Crear backup antes de importar para poder revertir

### Advertencias al Usuario

- Los archivos de backup contienen datos personales
- No compartir archivos de backup públicamente
- Guardar en lugar seguro (Drive, Dropbox, etc.)
- Verificar el origen del archivo antes de importar

## 📝 Casos de Uso

### Caso 1: Cambio de Dispositivo
1. Usuario exporta datos en PC
2. Descarga archivo JSON
3. Sube archivo a Drive/Dropbox
4. En móvil, descarga el archivo
5. Importa datos en móvil
6. Continúa leyendo desde donde lo dejó

### Caso 2: Backup Preventivo
1. Usuario exporta datos regularmente
2. Guarda archivos con fecha
3. Si pierde datos, puede restaurar backup anterior

### Caso 3: Compartir Biblioteca
1. Usuario exporta su biblioteca
2. Comparte archivo con amigo
3. Amigo importa y fusiona con su biblioteca
4. Ambos tienen las mismas recomendaciones

### Caso 4: Migración de Navegador
1. Usuario usa Chrome, quiere cambiar a Firefox
2. Exporta datos en Chrome
3. Importa datos en Firefox
4. Todos los datos transferidos exitosamente

## 🚀 Implementación por Fases

### Fase 1: Servicio de Exportación/Importación
- Crear `exportImportService.js`
- Implementar `exportAllData()`
- Implementar `importAllData()`
- Implementar validaciones básicas

### Fase 2: Interfaz de Usuario
- Crear `BackupModal.jsx`
- Implementar tab de Exportación
- Implementar tab de Importación
- Agregar botón en Navbar

### Fase 3: Validaciones Avanzadas
- Validación de versiones
- Detección de datos corruptos
- Backup automático antes de importar
- Rollback en caso de error

### Fase 4: Mejoras UX
- Preview detallado de datos
- Modo fusionar vs reemplazar
- Compresión de imágenes grandes
- Encriptación opcional

### Fase 5: Testing y Pulido
- Tests de exportación/importación
- Tests de validación
- Tests de fusión de datos
- Documentación de usuario

## 📊 Métricas de Éxito

- ✅ Usuario puede exportar todos sus datos en <5 segundos
- ✅ Usuario puede importar datos en <10 segundos
- ✅ 0% de pérdida de datos durante transferencia
- ✅ Validación detecta 100% de archivos corruptos
- ✅ Interfaz intuitiva (no requiere instrucciones)

## 🎯 Beneficios

1. **Portabilidad**: Usar la app en múltiples dispositivos
2. **Seguridad**: Backup de datos importante
3. **Flexibilidad**: Cambiar de navegador sin perder datos
4. **Compartir**: Compartir biblioteca con amigos
5. **Recuperación**: Restaurar datos en caso de pérdida

## 📌 Notas Técnicas

### Tamaño de Archivos

- Biblioteca típica: ~100KB - 500KB
- Con imágenes de fondo: +1MB - 5MB
- Progreso de lectura: ~50KB - 200KB
- Total estimado: 200KB - 6MB

### Compatibilidad

- Funciona en todos los navegadores modernos
- Compatible con móviles y desktop
- No requiere permisos especiales
- Funciona offline

### Limitaciones

- Tamaño máximo recomendado: 10MB
- Imágenes muy grandes pueden causar problemas
- Importación puede tardar en dispositivos lentos
- Requiere JavaScript habilitado

## 🔄 Flujo Completo

```
Usuario en Dispositivo A
    │
    ├─> Exportar Datos
    │   ├─> Recopilar de localStorage
    │   ├─> Validar datos
    │   ├─> Generar JSON
    │   └─> Descargar archivo
    │
    ├─> Guardar en nube (Drive, Dropbox, etc.)
    │
Usuario en Dispositivo B
    │
    ├─> Descargar archivo de nube
    │
    ├─> Importar Datos
    │   ├─> Seleccionar archivo
    │   ├─> Validar formato
    │   ├─> Mostrar preview
    │   ├─> Crear backup actual
    │   ├─> Aplicar datos
    │   └─> Recargar página
    │
    └─> ✅ Continuar usando la app normalmente
```

## 🎨 Estilo Visual

- Usar colores de Potaxie (verde aguacate)
- Iconos: 💾 📂 ✨ 🥑 📚
- Animaciones suaves al exportar/importar
- Confetti al importar exitosamente
- Toasts informativos en cada paso

## ✅ Checklist de Implementación

- [ ] Crear servicio de exportación/importación
- [ ] Implementar validaciones
- [ ] Crear componente BackupModal
- [ ] Agregar botón en Navbar
- [ ] Implementar exportación
- [ ] Implementar importación
- [ ] Agregar modo fusionar
- [ ] Crear backup automático
- [ ] Agregar preview de datos
- [ ] Implementar compresión de imágenes
- [ ] Testing exhaustivo
- [ ] Documentación de usuario

---

**Próximo Paso**: ¿Quieres que comience a implementar este sistema? Puedo empezar creando el servicio de exportación/importación y luego la interfaz de usuario.
