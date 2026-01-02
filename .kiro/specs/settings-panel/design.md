# Design Document: Settings Panel

## Overview

Este documento describe el diseño técnico para consolidar las opciones de configuración de la aplicación (Backup de Datos, Personalizar Colores, Modo Navideño) en un panel de ajustes unificado. El panel seguirá el patrón de navegación de página completa utilizado por el Oráculo y la Biblioteca, proporcionando una experiencia de usuario coherente y profesional.

## Architecture

### Component Structure

```
App.jsx
├── Navbar.jsx
│   └── Settings Button (nuevo)
├── SettingsPanel.jsx (nuevo componente)
│   ├── SettingsHeader
│   ├── SettingsGrid
│   │   ├── SettingsCard (Backup)
│   │   ├── SettingsCard (Colores)
│   │   └── SettingsCard (Navidad)
│   └── Modals (existentes)
│       ├── BackupModal
│       ├── ColorThemeModal
│       └── ChristmasToggle (inline)
```

### Navigation Flow

```
Usuario → Navbar → Settings Button → SettingsPanel (página completa)
                                    ↓
                    SettingsCard → Modal específico → Volver a SettingsPanel
```

### State Management

El panel de ajustes utilizará el sistema de navegación de páginas existente en `App.jsx`:

```javascript
// Estado existente en App.jsx
const [page, setPage] = useState('home');

// Nuevo valor para settings
// page puede ser: 'home' | 'library' | 'oracle' | 'settings'
```

## Components and Interfaces

### 1. SettingsPanel Component

**Ubicación**: `src/components/SettingsPanel.jsx`

**Props**:
```typescript
interface SettingsPanelProps {
  // No requiere props, usa contextos globales
}
```

**Estructura**:
```jsx
export const SettingsPanel = () => {
  const [showBackupModal, setShowBackupModal] = useState(false);
  const [showColorTheme, setShowColorTheme] = useState(false);
  const { isChristmasMode, toggleChristmasMode } = useChristmasTheme();
  const { theme } = useTheme();
  const { showToast } = useToast();

  const settingsSections = [
    {
      id: 'backup',
      title: 'Backup de Datos',
      description: 'Exporta e importa tu biblioteca, progreso de lectura y configuraciones',
      icon: Database,
      color: 'from-green-400 to-emerald-500',
      action: () => setShowBackupModal(true)
    },
    {
      id: 'colors',
      title: 'Personalizar Colores',
      description: 'Cambia los colores del tema y personaliza tu experiencia visual',
      icon: Palette,
      color: 'from-purple-400 to-pink-500',
      action: () => setShowColorTheme(true)
    },
    {
      id: 'christmas',
      title: 'Modo Navideño',
      description: 'Activa o desactiva el tema navideño con nieve y decoraciones',
      icon: Snowflake,
      color: 'from-red-400 to-green-500',
      action: () => {
        toggleChristmasMode();
        showToast(isChristmasMode 
          ? '❄️ Modo Navidad desactivado' 
          : '🎄 ¡Modo Navidad activado! ✨'
        );
      }
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <SettingsHeader />
      
      {/* Settings Grid */}
      <SettingsGrid sections={settingsSections} />
      
      {/* Modals */}
      <BackupModal isOpen={showBackupModal} onClose={() => setShowBackupModal(false)} />
      <ColorThemeModal isOpen={showColorTheme} onClose={() => setShowColorTheme(false)} />
    </div>
  );
};
```

### 2. SettingsHeader Component

**Estructura**:
```jsx
const SettingsHeader = () => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="mb-12 text-center"
  >
    <h2 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4 inline-flex items-center gap-3 flex-wrap justify-center">
      <span className="bg-clip-text text-transparent bg-gradient-to-r from-potaxie-green via-purple-500 to-pink-500">
        Ajustes
      </span>
      <span>⚙️✨</span>
    </h2>
    <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">
      Personaliza tu experiencia en El Santuario Potaxie
    </p>
  </motion.div>
);
```

### 3. SettingsGrid Component

**Props**:
```typescript
interface SettingsGridProps {
  sections: SettingsSection[];
}

interface SettingsSection {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string; // Tailwind gradient classes
  action: () => void;
}
```

**Estructura**:
```jsx
const SettingsGrid = ({ sections }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {sections.map((section, index) => (
      <SettingsCard 
        key={section.id} 
        section={section} 
        index={index} 
      />
    ))}
  </div>
);
```

### 4. SettingsCard Component

**Props**:
```typescript
interface SettingsCardProps {
  section: SettingsSection;
  index: number;
}
```

**Estructura**:
```jsx
const SettingsCard = ({ section, index }) => {
  const Icon = section.icon;
  
  return (
    <motion.button
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.03, y: -5 }}
      whileTap={{ scale: 0.98 }}
      onClick={section.action}
      className="group relative bg-white dark:bg-gray-800 rounded-3xl p-8 
                 border-2 border-gray-100 dark:border-gray-700 
                 hover:border-transparent hover:shadow-2xl 
                 transition-all duration-300 text-left overflow-hidden"
    >
      {/* Gradient Background on Hover */}
      <div className={`absolute inset-0 bg-gradient-to-br ${section.color} 
                       opacity-0 group-hover:opacity-10 transition-opacity duration-300`} 
      />
      
      {/* Icon */}
      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${section.color} 
                       flex items-center justify-center mb-6 
                       group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="text-white" size={32} />
      </div>
      
      {/* Content */}
      <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-3 
                     group-hover:text-transparent group-hover:bg-clip-text 
                     group-hover:bg-gradient-to-r group-hover:${section.color} 
                     transition-all duration-300">
        {section.title}
      </h3>
      
      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
        {section.description}
      </p>
      
      {/* Arrow Indicator */}
      <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 
                      transform translate-x-2 group-hover:translate-x-0 
                      transition-all duration-300">
        <ChevronRight className="text-gray-400" size={24} />
      </div>
    </motion.button>
  );
};
```

### 5. Navbar Modifications

**Cambios en `src/components/Navbar.jsx`**:

```jsx
// Importar nuevo icono
import { Settings } from 'lucide-react';

// Eliminar estados de modales individuales
// REMOVER: const [showColorTheme, setShowColorTheme] = useState(false);
// REMOVER: const [showBackupModal, setShowBackupModal] = useState(false);

// Eliminar botones individuales y agregar botón de Settings
<button
  onClick={() => setPage('settings')}
  className="p-1 xs:p-1.5 sm:p-2 rounded-full hover:bg-gray-100 
             dark:hover:bg-gray-800 transition-colors text-potaxie-green"
  title="Ajustes"
>
  <Settings size={14} className="xs:w-4 xs:h-4 sm:w-5 sm:h-5" />
</button>

// REMOVER: Botón de Backup (Database)
// REMOVER: Botón de Personalizar Colores (Palette)
// REMOVER: Botón de Modo Navideño (snowflake/tree)

// REMOVER: Modales en Navbar
// REMOVER: <ColorThemeModal isOpen={showColorTheme} onClose={...} />
// REMOVER: <BackupModal isOpen={showBackupModal} onClose={...} />
```

### 6. App.jsx Modifications

**Cambios en `src/App.jsx`**:

```jsx
// Importar nuevo componente
import { SettingsPanel } from './components/SettingsPanel';

// Actualizar PAGES_ORDER
const PAGES_ORDER = ['home', 'library', 'oracle', 'settings'];

// Agregar caso en el switch de páginas
{page === 'settings' && <SettingsPanel />}
```

## Data Models

### Settings Section Model

```typescript
interface SettingsSection {
  id: string;              // Identificador único: 'backup' | 'colors' | 'christmas'
  title: string;           // Título mostrado: "Backup de Datos"
  description: string;     // Descripción breve del propósito
  icon: LucideIcon;        // Componente de icono de lucide-react
  color: string;           // Clases de gradiente Tailwind: "from-green-400 to-emerald-500"
  action: () => void;      // Función a ejecutar al hacer clic
}
```

### Navigation State

```typescript
type PageType = 'home' | 'library' | 'oracle' | 'settings';

interface NavigationState {
  currentPage: PageType;
  direction: number;  // 1 para adelante, -1 para atrás
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Settings Button Navigation

*For any* user interaction with the settings button in the navbar, clicking it should navigate to the settings page and update the page state to 'settings'

**Validates: Requirements 1.2, 2.1**

### Property 2: Settings Card Actions

*For any* settings card (Backup, Colors, Christmas), clicking it should trigger its associated action (open modal or toggle state) without navigating away from the settings page

**Validates: Requirements 4.1, 4.2, 4.3, 4.4**

### Property 3: Modal Return Behavior

*For any* modal opened from the settings panel, closing the modal should return the user to the settings panel view without changing the page state

**Validates: Requirements 4.5**

### Property 4: Navbar Button Removal

*For any* render of the navbar component, it should not display individual buttons for Backup (Database icon), Color Theme (Palette icon), or Christmas Mode (snowflake/tree emoji)

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 5: Responsive Layout Adaptation

*For any* viewport width, the settings grid should display in single column (mobile), two columns (tablet), or three columns (desktop) based on the breakpoint

**Validates: Requirements 6.1, 6.2, 6.3**

### Property 6: Theme Integration

*For any* theme state (light, dark, christmas), the settings panel should render with appropriate colors and styles matching the current theme

**Validates: Requirements 9.1, 9.2, 9.3, 9.4**

### Property 7: Keyboard Navigation

*For any* settings card, pressing Tab should move focus to the next card, and pressing Enter on a focused card should trigger its action

**Validates: Requirements 7.2**

### Property 8: Animation Completion

*For any* settings panel animation (open, close, hover), the animation should complete within 300ms to maintain responsiveness

**Validates: Requirements 8.1, 8.2, 8.5**

## Error Handling

### Navigation Errors

**Scenario**: Usuario intenta navegar a settings pero el componente no está montado

**Handling**:
```javascript
// En App.jsx, verificar que el componente existe antes de renderizar
{page === 'settings' && SettingsPanel && <SettingsPanel />}

// Fallback si el componente no existe
{page === 'settings' && !SettingsPanel && (
  <div className="text-center py-20">
    <p>Error: Panel de ajustes no disponible</p>
    <button onClick={() => setPage('home')}>Volver al inicio</button>
  </div>
)}
```

### Modal State Errors

**Scenario**: Modal se queda abierto después de navegar fuera de settings

**Handling**:
```javascript
// En SettingsPanel, limpiar estados al desmontar
useEffect(() => {
  return () => {
    setShowBackupModal(false);
    setShowColorTheme(false);
  };
}, []);
```

### Theme Context Errors

**Scenario**: Contexto de tema no está disponible

**Handling**:
```javascript
// En SettingsPanel, verificar contextos antes de usar
const { theme } = useTheme() || { theme: 'light' };
const { isChristmasMode, toggleChristmasMode } = useChristmasTheme() || {
  isChristmasMode: false,
  toggleChristmasMode: () => console.warn('Christmas context not available')
};
```

### Responsive Breakpoint Errors

**Scenario**: Grid no se adapta correctamente en tamaños intermedios

**Handling**:
```javascript
// Usar breakpoints de Tailwind con fallbacks
className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"

// Verificar con media queries si es necesario
const isMobile = window.matchMedia('(max-width: 768px)').matches;
```

## Testing Strategy

### Unit Tests

**Test Suite**: `SettingsPanel.test.jsx`

1. **Rendering Tests**
   - Settings panel renders with correct title
   - All three settings cards are displayed
   - Each card has correct icon, title, and description

2. **Navigation Tests**
   - Settings button in navbar navigates to settings page
   - Page state updates to 'settings' on navigation
   - Back navigation returns to previous page

3. **Action Tests**
   - Backup card opens BackupModal
   - Colors card opens ColorThemeModal
   - Christmas card toggles christmas mode
   - Toast appears after christmas toggle

4. **Modal Tests**
   - Modals open when cards are clicked
   - Modals close when close button is clicked
   - Settings panel remains visible after modal closes

5. **Responsive Tests**
   - Grid displays 1 column on mobile (< 768px)
   - Grid displays 2 columns on tablet (768px - 1024px)
   - Grid displays 3 columns on desktop (> 1024px)

6. **Theme Tests**
   - Settings panel uses light theme colors in light mode
   - Settings panel uses dark theme colors in dark mode
   - Settings panel incorporates christmas theme when active

7. **Accessibility Tests**
   - Settings button has aria-label
   - Settings cards are keyboard navigable
   - Focus management works correctly
   - Proper heading hierarchy (h1, h2, h3)

### Property-Based Tests

**Test Suite**: `SettingsPanel.property.test.jsx`

**Configuration**: Minimum 100 iterations per test using fast-check library

1. **Property Test: Settings Button Navigation**
   ```javascript
   // Feature: settings-panel, Property 1: Settings Button Navigation
   fc.assert(
     fc.property(fc.constantFrom('home', 'library', 'oracle'), (startPage) => {
       // Given: User is on any page
       // When: User clicks settings button
       // Then: Page state should be 'settings'
       const { getByTitle } = render(<App initialPage={startPage} />);
       const settingsButton = getByTitle('Ajustes');
       fireEvent.click(settingsButton);
       expect(getCurrentPage()).toBe('settings');
     }),
     { numRuns: 100 }
   );
   ```

2. **Property Test: Settings Card Actions**
   ```javascript
   // Feature: settings-panel, Property 2: Settings Card Actions
   fc.assert(
     fc.property(
       fc.constantFrom('backup', 'colors', 'christmas'),
       (cardId) => {
         // Given: User is on settings page
         // When: User clicks any settings card
         // Then: Appropriate action should trigger without page change
         const { getByText } = render(<SettingsPanel />);
         const initialPage = getCurrentPage();
         const card = getByText(getCardTitle(cardId));
         fireEvent.click(card);
         expect(getCurrentPage()).toBe(initialPage);
         expect(getActionTriggered(cardId)).toBe(true);
       }
     ),
     { numRuns: 100 }
   );
   ```

3. **Property Test: Modal Return Behavior**
   ```javascript
   // Feature: settings-panel, Property 3: Modal Return Behavior
   fc.assert(
     fc.property(
       fc.constantFrom('backup', 'colors'),
       (modalType) => {
         // Given: User opened a modal from settings
         // When: User closes the modal
         // Then: User should return to settings page
         const { getByText, getByLabelText } = render(<SettingsPanel />);
         fireEvent.click(getByText(getCardTitle(modalType)));
         const closeButton = getByLabelText('Cerrar');
         fireEvent.click(closeButton);
         expect(getCurrentPage()).toBe('settings');
         expect(isModalOpen(modalType)).toBe(false);
       }
     ),
     { numRuns: 100 }
   );
   ```

4. **Property Test: Navbar Button Removal**
   ```javascript
   // Feature: settings-panel, Property 4: Navbar Button Removal
   fc.assert(
     fc.property(fc.constantFrom('home', 'library', 'oracle', 'settings'), (page) => {
       // Given: User is on any page
       // When: Navbar is rendered
       // Then: Individual backup, colors, and christmas buttons should not exist
       const { queryByTitle } = render(<Navbar setPage={() => {}} />);
       expect(queryByTitle('Backup de Datos')).toBeNull();
       expect(queryByTitle('Personalizar Colores')).toBeNull();
       expect(queryByTitle(/Modo Navidad/)).toBeNull();
     }),
     { numRuns: 100 }
   );
   ```

5. **Property Test: Responsive Layout Adaptation**
   ```javascript
   // Feature: settings-panel, Property 5: Responsive Layout Adaptation
   fc.assert(
     fc.property(
       fc.integer({ min: 320, max: 2560 }),
       (viewportWidth) => {
         // Given: Any viewport width
         // When: Settings panel is rendered
         // Then: Grid should have correct number of columns
         global.innerWidth = viewportWidth;
         const { container } = render(<SettingsPanel />);
         const grid = container.querySelector('.grid');
         const expectedCols = viewportWidth < 768 ? 1 : viewportWidth < 1024 ? 2 : 3;
         expect(getGridColumns(grid)).toBe(expectedCols);
       }
     ),
     { numRuns: 100 }
   );
   ```

6. **Property Test: Theme Integration**
   ```javascript
   // Feature: settings-panel, Property 6: Theme Integration
   fc.assert(
     fc.property(
       fc.constantFrom('light', 'dark'),
       fc.boolean(),
       (theme, isChristmas) => {
         // Given: Any theme and christmas mode state
         // When: Settings panel is rendered
         // Then: Panel should use appropriate theme colors
         const { container } = render(
           <ThemeProvider initialTheme={theme}>
             <ChristmasThemeProvider initialMode={isChristmas}>
               <SettingsPanel />
             </ChristmasThemeProvider>
           </ThemeProvider>
         );
         const panel = container.firstChild;
         expect(hasThemeClasses(panel, theme)).toBe(true);
         if (isChristmas) {
           expect(hasChristmasElements(panel)).toBe(true);
         }
       }
     ),
     { numRuns: 100 }
   );
   ```

7. **Property Test: Keyboard Navigation**
   ```javascript
   // Feature: settings-panel, Property 7: Keyboard Navigation
   fc.assert(
     fc.property(
       fc.array(fc.constantFrom('backup', 'colors', 'christmas'), { minLength: 1, maxLength: 3 }),
       (cardSequence) => {
         // Given: User navigates with keyboard
         // When: User presses Tab and Enter
         // Then: Focus should move correctly and actions should trigger
         const { container } = render(<SettingsPanel />);
         const cards = container.querySelectorAll('button');
         
         cards[0].focus();
         expect(document.activeElement).toBe(cards[0]);
         
         // Tab to next card
         fireEvent.keyDown(cards[0], { key: 'Tab' });
         expect(document.activeElement).toBe(cards[1]);
         
         // Enter triggers action
         fireEvent.keyDown(cards[1], { key: 'Enter' });
         expect(getActionTriggered(cardSequence[1])).toBe(true);
       }
     ),
     { numRuns: 100 }
   );
   ```

8. **Property Test: Animation Completion**
   ```javascript
   // Feature: settings-panel, Property 8: Animation Completion
   fc.assert(
     fc.property(
       fc.constantFrom('enter', 'exit', 'hover'),
       async (animationType) => {
         // Given: Any animation type
         // When: Animation is triggered
         // Then: Animation should complete within 300ms
         const startTime = Date.now();
         const { container } = render(<SettingsPanel />);
         
         if (animationType === 'hover') {
           const card = container.querySelector('button');
           fireEvent.mouseEnter(card);
         }
         
         await waitFor(() => {
           const duration = Date.now() - startTime;
           expect(duration).toBeLessThanOrEqual(300);
         });
       }
     ),
     { numRuns: 100 }
   );
   ```

### Integration Tests

1. **Full Navigation Flow**
   - User navigates from home → settings → opens modal → closes modal → returns to home
   - Verify all state transitions are correct

2. **Multi-Modal Interaction**
   - User opens backup modal, closes it, then opens colors modal
   - Verify no state leakage between modals

3. **Theme Switching in Settings**
   - User is on settings page, switches theme
   - Verify settings panel updates immediately

4. **Christmas Mode Toggle**
   - User toggles christmas mode from settings
   - Verify snow effect appears/disappears
   - Verify toast notification appears

### Manual Testing Checklist

- [ ] Settings button appears in navbar on all pages
- [ ] Settings button has correct icon and tooltip
- [ ] Clicking settings button navigates to settings page
- [ ] Settings page displays all three cards
- [ ] Each card has correct icon, title, and description
- [ ] Backup card opens backup modal
- [ ] Colors card opens color theme modal
- [ ] Christmas card toggles christmas mode
- [ ] Toast appears after christmas toggle
- [ ] Modals close correctly
- [ ] Settings page remains after closing modal
- [ ] Individual backup/colors/christmas buttons removed from navbar
- [ ] Grid displays 1 column on mobile
- [ ] Grid displays 2 columns on tablet
- [ ] Grid displays 3 columns on desktop
- [ ] Hover effects work on all cards
- [ ] Keyboard navigation works (Tab, Enter)
- [ ] Focus indicators are visible
- [ ] Settings panel respects light theme
- [ ] Settings panel respects dark theme
- [ ] Settings panel respects christmas theme
- [ ] Animations are smooth and complete within 300ms
- [ ] No console errors or warnings
- [ ] Swipe gestures work on mobile (if applicable)

## Implementation Notes

### Styling Consistency

- Use existing Tailwind classes from Oracle and Library components
- Maintain potaxie-green color scheme: `#A7D08C`
- Use consistent border radius: `rounded-3xl` for cards
- Use consistent shadows: `shadow-2xl` on hover
- Use consistent transitions: `duration-300`

### Animation Patterns

- Use Framer Motion for all animations
- Stagger card animations by 0.1s (index * 0.1)
- Use spring animations for page transitions
- Use opacity + scale for card hover effects
- Use transform for icon scaling

### Accessibility Considerations

- All interactive elements must be keyboard accessible
- Use semantic HTML (button, nav, main)
- Provide aria-labels for icon-only buttons
- Maintain proper heading hierarchy
- Ensure sufficient color contrast (WCAG AA)
- Focus indicators must be visible

### Performance Optimizations

- Lazy load modals (only render when open)
- Use React.memo for SettingsCard if needed
- Debounce hover animations if performance issues
- Use CSS transforms instead of position changes
- Minimize re-renders with proper state management

### Mobile Considerations

- Touch targets minimum 44x44px
- Swipe gestures should not conflict with card interactions
- Modals should be full-screen on mobile
- Text should be readable without zooming
- Spacing should be comfortable for touch

### Browser Compatibility

- Test on Chrome, Firefox, Safari, Edge
- Ensure Framer Motion works on all browsers
- Test backdrop-blur support (fallback if needed)
- Test CSS grid support (should be universal now)
- Test touch events on mobile browsers
