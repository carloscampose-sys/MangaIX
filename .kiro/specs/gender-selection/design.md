# Design Document: Gender Selection Flow

## Overview

La pantalla de selección de género es un componente intermedio en el flujo de bienvenida del Santuario Potaxie. Aparece después de que el usuario ingresa su nombre y presiona "Entrar al Santuario", permitiéndole seleccionar su género antes de acceder al contenido principal. El componente mantiene la estética visual del Santuario con la paleta de colores consistente (verde potaxie, dorado, crema, menta) y utiliza animaciones suaves para una experiencia fluida.

## Architecture

### Component Hierarchy

```
App.jsx
├── WelcomeScreen (mostrar si no hay userName)
├── GenderSelectionScreen (mostrar si hay userName pero no userGender)
├── LoadingScreen (mostrar durante transición)
└── MainApp (mostrar si hay userName y userGender)
```

### State Management

El flujo de estados en `App.jsx`:

1. **Initial State**: `isInitialLoading = true`, `userName = null`, `userGender = null`
2. **After WelcomeScreen**: `userName = "Ana"`, `userGender = null` → Mostrar GenderSelectionScreen
3. **After GenderSelectionScreen**: `userName = "Ana"`, `userGender = "Femenino"` → Mostrar LoadingScreen
4. **After LoadingScreen**: `isInitialLoading = false` → Mostrar MainApp

### Data Flow

```
localStorage
├── userName (guardado por WelcomeScreen)
└── userGender (guardado por GenderSelectionScreen)

App.jsx
├── Lee userName y userGender de localStorage en useEffect
├── Determina qué pantalla mostrar
└── Pasa callbacks a GenderSelectionScreen
```

## Components and Interfaces

### GenderSelectionScreen Component

**Props:**
```typescript
interface GenderSelectionScreenProps {
  userName: string;           // Nombre del usuario (para personalización)
  onGenderSelect: (gender: string) => void;  // Callback cuando se confirma género
}
```

**Gender Options:**
```typescript
interface GenderOption {
  id: string;           // 'masculino' | 'femenino' | 'otro'
  label: string;        // "Masculino" | "Femenino" | "Otro"
  emoji: string;        // Emoji representativo
  color: string;        // Clase Tailwind para color
}
```

**Internal State:**
```typescript
const [selectedGender, setSelectedGender] = useState<string | null>(null);
const [error, setError] = useState<string>('');
const [isConfirming, setIsConfirming] = useState<boolean>(false);
```

### Visual Design

**Paleta de Colores (Consistente con WelcomeScreen):**
- Fondo: Gradiente `from-potaxie-mint to-potaxie-cream-white`
- Texto principal: `text-potaxie-text-light`
- Botones: Gradiente `from-potaxie-green to-potaxie-green-pastel`
- Opciones seleccionadas: Colores diferenciados por género

**Opciones de Género:**

1. **Masculino**
   - Emoji: 👨
   - Color: `bg-blue-500` (cuando está seleccionado)
   - Icono: Opcional

2. **Femenino**
   - Emoji: 👩
   - Color: `bg-pink-500` (cuando está seleccionado)
   - Icono: Opcional

3. **Otro**
   - Emoji: 🌈
   - Color: `bg-purple-500` (cuando está seleccionado)
   - Icono: Opcional

**Layout:**
- Modal glass con `rounded-lg` y `shadow-xl`
- Título: "¿Cuál es tu género, Potaxina?"
- Tres botones de género en grid o flex
- Botón de confirmación al pie
- Mensaje de error si no hay selección

## Data Models

### Gender Selection Data

```typescript
interface GenderSelection {
  gender: 'masculino' | 'femenino' | 'otro';
  selectedAt: string;  // ISO timestamp
}
```

### localStorage Schema

```json
{
  "userName": "Ana",
  "userGender": "femenino"
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Gender Selection Persistence

**For any** gender selection made by the user, after confirming and reloading the page, the same gender should be retrieved from localStorage.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 2: Gender Selection Validation

**For any** attempt to confirm without selecting a gender, the system should display an error message and prevent progression to the next screen.

**Validates: Requirements 2.4**

### Property 3: Gender Selection State Consistency

**For any** gender option clicked, the UI should immediately reflect the selection with a visual indicator, and the internal state should match the displayed selection.

**Validates: Requirements 2.1, 2.2**

### Property 4: Screen Visibility Logic

**For any** combination of userName and userGender values, the correct screen should be displayed:
- If no userName: show WelcomeScreen
- If userName but no userGender: show GenderSelectionScreen
- If both: show MainApp

**Validates: Requirements 1.1, 4.1**

### Property 5: Gender Selection Immutability

**For any** gender selection confirmed and saved, changing the selection in a new session should only occur if the user explicitly selects a different gender and confirms again.

**Validates: Requirements 3.3, 3.4**

### Property 6: Gender-Based Greeting Personalization

**For any** gender selection (Masculino, Femenino, Otro), the greeting displayed in the main page should match the corresponding salutation (Bienvenido, Bienvenida, Bienvenide).

**Validates: Requirements 6.1, 6.2, 6.3, 6.4, 6.5**

## Error Handling

### Error Scenarios

1. **No Gender Selected**
   - Mensaje: "¡Espera, reina! Necesitamos saber tu género para la bendición potaxie 💅"
   - Acción: Mostrar error en rojo, deshabilitar botón de confirmación

2. **localStorage No Disponible**
   - Fallback: Usar estado en memoria (sessionStorage)
   - Mensaje: Silencioso (no mostrar error al usuario)

3. **Datos Corruptos en localStorage**
   - Fallback: Mostrar GenderSelectionScreen nuevamente
   - Acción: Limpiar datos corruptos

### Error Recovery

- El usuario puede cambiar de opción en cualquier momento
- El botón de confirmación se habilita/deshabilita dinámicamente
- Los errores desaparecen cuando el usuario selecciona una opción

## Testing Strategy

### Unit Tests

**Test 1: Render GenderSelectionScreen**
- Verificar que el componente se renderiza correctamente
- Verificar que las tres opciones de género están presentes
- Verificar que el botón de confirmación está deshabilitado inicialmente

**Test 2: Gender Selection**
- Seleccionar cada opción de género
- Verificar que el estado interno se actualiza
- Verificar que el indicador visual cambia

**Test 3: Error Handling**
- Intentar confirmar sin seleccionar género
- Verificar que se muestra el mensaje de error
- Verificar que el botón de confirmación permanece deshabilitado

**Test 4: localStorage Integration**
- Confirmar un género
- Verificar que se guarda en localStorage
- Recargar la página y verificar que se recupera

**Test 5: Screen Visibility**
- Verificar que GenderSelectionScreen aparece cuando hay userName pero no userGender
- Verificar que desaparece cuando se confirma un género

### Property-Based Tests

**Property Test 1: Gender Selection Persistence**
- Generar selecciones aleatorias de género
- Guardar en localStorage
- Recargar y verificar que se recupera correctamente
- Validar que el género recuperado coincide con el guardado

**Property Test 2: Gender Selection Validation**
- Generar intentos de confirmación sin selección
- Verificar que siempre se muestra error
- Verificar que el estado no cambia

**Property Test 3: Gender Selection State Consistency**
- Generar secuencias de clics en opciones de género
- Verificar que el estado interno siempre coincide con la UI
- Verificar que solo una opción está seleccionada a la vez

**Property Test 4: Screen Visibility Logic**
- Generar combinaciones de userName y userGender
- Verificar que la pantalla correcta se muestra
- Validar la lógica de visibilidad en todos los casos

**Property Test 5: Gender Selection Immutability**
- Guardar un género
- Intentar cambiar sin confirmación
- Verificar que el género guardado no cambia
- Confirmar un nuevo género y verificar que se actualiza

**Property Test 6: Gender-Based Greeting Personalization**
- Generar selecciones aleatorias de género
- Guardar en localStorage
- Verificar que el saludo correcto se muestra en la página principal
- Validar que "Masculino" → "Bienvenido", "Femenino" → "Bienvenida", "Otro" → "Bienvenide"

### Test Configuration

- Minimum 100 iterations per property test
- Use `fast-check` or similar library for property-based testing
- Tag format: `Feature: gender-selection, Property N: [property_text]`
- Each property test validates one correctness property
