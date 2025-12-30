# Plan: Botón de Guardar Progreso en el Lector

## Objetivo
Agregar un botón de "Guardar Progreso" en la barra de navegación del lector (junto a los botones de retroceder, menú y avanzar) que permita al usuario marcar que ha completado la lectura de un capítulo y actualizar automáticamente su progreso en la biblioteca.

## Análisis del Estado Actual

### Componente Reader (`src/components/Reader.jsx`)
- Ya tiene una barra de navegación con 3 botones:
  - **Retroceder**: Ir al capítulo anterior
  - **Menú**: Volver a la lista de capítulos
  - **Avanzar**: Ir al siguiente capítulo
- Tiene acceso al contexto de la biblioteca mediante `useLibrary()`
- Ya usa `updateProgress()` para actualizar capítulos leídos

### Contexto de Biblioteca (`src/context/LibraryContext.jsx`)
- Función `updateProgress(mangaId, additionalChapters)` disponible
- Actualiza `chaptersRead` del manga
- Actualiza `devouredChapters` global

## Diseño de la Interfaz

### Ubicación del Botón

```
┌─────────────────────────────────────────────────┐
│                                                 │
│              [Imagen del capítulo]              │
│                                                 │
├─────────────────────────────────────────────────┤
│  [◀ Anterior] [📚 Menú] [💾 Guardar] [Siguiente ▶] │
└─────────────────────────────────────────────────┘
```

### Versión Móvil

```
┌──────────────────────┐
│                      │
│   [Imagen]           │
│                      │
├──────────────────────┤
│ [◀] [📚] [💾] [▶]   │
└──────────────────────┘
```

## Especificaciones del Botón

### Diseño Visual

**Desktop**:
- Icono: 💾 o `<Save />` de lucide-react
- Texto: "Guardar Progreso"
- Color: Verde potaxie (`bg-potaxie-green`)
- Posición: Entre el botón "Menú" y "Siguiente"

**Mobile**:
- Solo icono: 💾
- Tamaño más pequeño
- Mismo color verde

### Estados del Botón

1. **Normal**: 
   - `bg-potaxie-green hover:bg-green-600`
   - Texto: "Guardar Progreso"

2. **Guardando** (loading):
   - `bg-potaxie-green opacity-70`
   - Icono animado (spinner)
   - Texto: "Guardando..."
   - Deshabilitado

3. **Guardado** (success):
   - `bg-green-600`
   - Icono: ✓ (checkmark)
   - Texto: "¡Guardado!"
   - Dura 2 segundos, luego vuelve a normal

4. **Ya guardado**:
   - `bg-gray-400 cursor-not-allowed`
   - Texto: "Ya guardado"
   - Deshabilitado

## Lógica de Funcionamiento

### Flujo Principal

1. **Usuario hace click en "Guardar Progreso"**
2. **Sistema verifica**:
   - ¿El manga está en la biblioteca?
   - ¿El capítulo actual ya fue marcado como leído?
3. **Si está en biblioteca y no fue leído**:
   - Llamar a `updateProgress(mangaId, 1)`
   - Mostrar toast: "✨ Progreso guardado! +1 capítulo devorado 🥑"
   - Cambiar estado del botón a "Guardado" por 2 segundos
   - Opcional: Confetti animation
4. **Si no está en biblioteca**:
   - Mostrar toast: "⚠️ Añade esta obra a tu biblioteca primero 📚"
5. **Si ya fue leído**:
   - Mostrar toast: "ℹ️ Ya marcaste este capítulo como leído ✓"

### Detección de Capítulo Leído

**Opción 1: Comparar con chaptersRead**
```javascript
const isChapterRead = manga?.chaptersRead >= currentChapterNumber;
```

**Opción 2: Guardar lista de capítulos leídos** (más preciso)
```javascript
// En LibraryContext, agregar:
const [readChapters, setReadChapters] = useState({});
// Formato: { mangaId: [1, 2, 3, 5, 7] }

const markChapterAsRead = (mangaId, chapterNumber) => {
  setReadChapters(prev => ({
    ...prev,
    [mangaId]: [...(prev[mangaId] || []), chapterNumber]
  }));
};
```

**Recomendación**: Usar Opción 1 por simplicidad. Asumir que los capítulos se leen en orden.

## Implementación Técnica

### 1. Modificar Reader.jsx

#### Agregar Estado
```javascript
const [isSaving, setIsSaving] = useState(false);
const [justSaved, setJustSaved] = useState(false);
```

#### Función de Guardado
```javascript
const handleSaveProgress = async () => {
  // Verificar si está en biblioteca
  const mangaInLibrary = library.find(m => m.id === manga.id);
  
  if (!mangaInLibrary) {
    showToast("⚠️ Añade esta obra a tu biblioteca primero 📚");
    return;
  }
  
  // Verificar si ya fue leído
  const currentChapterNum = parseInt(currentChapter.number);
  if (mangaInLibrary.chaptersRead >= currentChapterNum) {
    showToast("ℹ️ Ya marcaste este capítulo como leído ✓");
    return;
  }
  
  // Guardar progreso
  setIsSaving(true);
  
  try {
    // Calcular cuántos capítulos incrementar
    const chaptersToAdd = currentChapterNum - (mangaInLibrary.chaptersRead || 0);
    
    updateProgress(manga.id, chaptersToAdd);
    
    // Feedback visual
    setJustSaved(true);
    showToast("✨ Progreso guardado! +1 capítulo devorado 🥑");
    
    // Confetti opcional
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.8 }
    });
    
    // Resetear después de 2 segundos
    setTimeout(() => {
      setJustSaved(false);
    }, 2000);
    
  } catch (error) {
    console.error('Error guardando progreso:', error);
    showToast("❌ Error al guardar. Intenta de nuevo.");
  } finally {
    setIsSaving(false);
  }
};
```

#### Agregar Botón en el JSX
```javascript
<div className="flex items-center justify-center gap-2 sm:gap-4">
  {/* Botón Anterior */}
  <button
    onClick={handlePrevChapter}
    disabled={currentChapterIndex === 0}
    className="..."
  >
    <ChevronLeft size={20} />
    <span className="hidden sm:inline">Anterior</span>
  </button>

  {/* Botón Menú */}
  <button
    onClick={onClose}
    className="..."
  >
    <BookOpen size={20} />
    <span className="hidden sm:inline">Menú</span>
  </button>

  {/* NUEVO: Botón Guardar Progreso */}
  <button
    onClick={handleSaveProgress}
    disabled={isSaving || justSaved}
    className={`
      px-3 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-bold text-xs sm:text-sm
      flex items-center gap-1 sm:gap-2 transition-all shadow-md
      ${justSaved 
        ? 'bg-green-600 text-white' 
        : isSaving
          ? 'bg-potaxie-green/70 text-white cursor-wait'
          : 'bg-potaxie-green hover:bg-green-600 text-white active:scale-95'
      }
      ${(isSaving || justSaved) && 'cursor-not-allowed'}
    `}
  >
    {isSaving ? (
      <>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Save size={16} className="sm:w-5 sm:h-5" />
        </motion.div>
        <span className="hidden sm:inline">Guardando...</span>
      </>
    ) : justSaved ? (
      <>
        <Check size={16} className="sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">¡Guardado!</span>
      </>
    ) : (
      <>
        <Save size={16} className="sm:w-5 sm:h-5" />
        <span className="hidden sm:inline">Guardar</span>
      </>
    )}
  </button>

  {/* Botón Siguiente */}
  <button
    onClick={handleNextChapter}
    disabled={currentChapterIndex === chapters.length - 1}
    className="..."
  >
    <span className="hidden sm:inline">Siguiente</span>
    <ChevronRight size={20} />
  </button>
</div>
```

### 2. Imports Necesarios
```javascript
import { Save, Check } from 'lucide-react';
import confetti from 'canvas-confetti';
```

## Responsive Design

### Breakpoints

**Mobile (< 640px)**:
- Solo iconos
- Botones más pequeños: `px-3 py-2`
- Iconos: `size={16}`
- Gap entre botones: `gap-2`

**Tablet (640px - 1024px)**:
- Iconos + texto
- Botones medianos: `px-4 py-2.5`
- Iconos: `size={18}`
- Gap: `gap-3`

**Desktop (> 1024px)**:
- Iconos + texto completo
- Botones grandes: `px-6 py-3`
- Iconos: `size={20}`
- Gap: `gap-4`

## Mejoras Opcionales

### 1. Auto-guardado al Avanzar
```javascript
const handleNextChapter = () => {
  // Guardar progreso automáticamente antes de avanzar
  handleSaveProgress();
  
  // Luego avanzar al siguiente capítulo
  if (currentChapterIndex < chapters.length - 1) {
    setCurrentChapterIndex(currentChapterIndex + 1);
  }
};
```

### 2. Indicador Visual de Capítulos Leídos
```javascript
// En la lista de capítulos, mostrar checkmark verde
{chapters.map((chapter, index) => {
  const isRead = manga?.chaptersRead >= parseInt(chapter.number);
  
  return (
    <button
      key={index}
      className={`... ${isRead ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
    >
      {isRead && <Check size={14} className="text-green-600" />}
      {chapter.title}
    </button>
  );
})}
```

### 3. Confirmación antes de Guardar
```javascript
const handleSaveProgress = () => {
  // Mostrar modal de confirmación
  if (window.confirm('¿Marcar este capítulo como leído?')) {
    // Guardar...
  }
};
```

### 4. Atajo de Teclado
```javascript
useEffect(() => {
  const handleKeyPress = (e) => {
    // Ctrl/Cmd + S para guardar
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      handleSaveProgress();
    }
  };
  
  window.addEventListener('keydown', handleKeyPress);
  return () => window.removeEventListener('keydown', handleKeyPress);
}, []);
```

## Testing Checklist

- [ ] Botón aparece correctamente en desktop
- [ ] Botón aparece correctamente en mobile
- [ ] Click guarda el progreso correctamente
- [ ] Toast aparece con el mensaje correcto
- [ ] Animación de confetti funciona
- [ ] Estado "Guardando" se muestra correctamente
- [ ] Estado "Guardado" dura 2 segundos
- [ ] No se puede guardar si no está en biblioteca
- [ ] No se puede guardar si ya fue leído
- [ ] Responsive funciona en todos los tamaños
- [ ] Iconos se muestran correctamente
- [ ] Transiciones son suaves
- [ ] No hay errores en consola

## Archivos a Modificar

1. **`src/components/Reader.jsx`**
   - Agregar estados (isSaving, justSaved)
   - Agregar función handleSaveProgress
   - Agregar botón en la barra de navegación
   - Agregar imports (Save, Check, confetti)

2. **`package.json`** (si no está instalado)
   - Verificar que `canvas-confetti` esté instalado
   - Si no: `npm install canvas-confetti`

## Estimación de Tiempo

- **Implementación básica**: 1-2 horas
- **Responsive design**: 30 minutos
- **Testing**: 30 minutos
- **Mejoras opcionales**: 1-2 horas

**Total**: 2-5 horas

## Próximos Pasos

1. ¿Te gusta este diseño?
2. ¿Quieres agregar alguna de las mejoras opcionales?
3. ¿Prefieres auto-guardado al avanzar de capítulo?
4. ¿Quieres que empiece con la implementación?
