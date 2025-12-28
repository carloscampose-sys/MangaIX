# Requirements Document: Gender Selection Flow

## Introduction

Este documento define los requisitos para implementar una pantalla de selección de género que aparece después de que el usuario ingresa su nombre en la pantalla de bienvenida "Bienvenida al Santuario Potaxie". La nueva pantalla mantiene la paleta de colores y estética de la pantalla de bienvenida, permitiendo al usuario seleccionar su género antes de acceder al contenido principal.

## Glossary

- **WelcomeScreen**: Pantalla inicial donde el usuario ingresa su nombre
- **GenderSelectionScreen**: Nueva pantalla donde el usuario selecciona su género
- **Gender_Options**: Las tres opciones de género disponibles (Masculino, Femenino, Otro)
- **Potaxie_Palette**: Paleta de colores del Santuario (verde potaxie, dorado, crema, menta)
- **Loading_Animation**: Animación de carga que aparece después de confirmar el género
- **Sanctuary_Aesthetic**: Estética visual consistente del Santuario Potaxie

## Requirements

### Requirement 1: Crear pantalla de selección de género

**User Story:** Como usuario, después de ingresar mi nombre, quiero seleccionar mi género para personalizar mi experiencia en el Santuario Potaxie.

#### Acceptance Criteria

1. WHEN el usuario presiona "Entrar al Santuario" en WelcomeScreen, THE System SHALL mostrar GenderSelectionScreen en lugar de ir directamente a la página principal
2. WHEN GenderSelectionScreen se renderiza, THE System SHALL mostrar tres opciones de género: Masculino, Femenino, Otro
3. WHEN GenderSelectionScreen se renderiza, THE System SHALL mantener la misma paleta de colores que WelcomeScreen (verde potaxie, dorado, crema, menta)
4. WHEN GenderSelectionScreen se renderiza, THE System SHALL mostrar un título indicando que el usuario debe seleccionar su género
5. THE GenderSelectionScreen SHALL usar la misma estructura de glass-modal que WelcomeScreen

### Requirement 2: Permitir selección de género con figuras ilustradas

**User Story:** Como usuario, quiero poder seleccionar mi género de forma clara e intuitiva con figuras ilustradas personalizadas que representen cada opción.

#### Acceptance Criteria

1. WHEN el usuario hace clic en una opción de género, THE System SHALL marcar esa opción como seleccionada
2. WHEN una opción de género está seleccionada, THE System SHALL mostrar un indicador visual diferente (color, borde, o icono)
3. WHEN el usuario selecciona una opción, THE System SHALL permitir cambiar de opción antes de confirmar
4. WHEN el usuario intenta confirmar sin seleccionar un género, THE System SHALL mostrar un mensaje de error
5. THE System SHALL mostrar un botón "Confirmar Género" que solo se habilita cuando hay una selección
6. THE System SHALL usar figuras ilustradas personalizadas (personajes animados) en lugar de emojis simples
7. WHEN se muestran las opciones de género, THE System SHALL mostrar tres figuras ilustradas: un personaje con hoodie (Masculino), un personaje con flores (Femenino), y un personaje con poncho (Otro)
8. THE System SHALL extraer las figuras de la imagen de referencia sin fondo ni texto

### Requirement 3: Persistir selección de género

**User Story:** Como usuario, quiero que mi selección de género se guarde para futuras sesiones.

#### Acceptance Criteria

1. WHEN el usuario confirma su género, THE System SHALL guardar la selección en localStorage
2. WHEN el usuario regresa a la aplicación, THE System SHALL recuperar el género guardado
3. WHEN el usuario tiene un género guardado, THE System SHALL saltarse la pantalla de selección de género
4. THE System SHALL guardar el género con la clave 'userGender' en localStorage

### Requirement 4: Transición a animación de carga

**User Story:** Como usuario, después de confirmar mi género, quiero ver la animación de carga antes de acceder al contenido principal.

#### Acceptance Criteria

1. WHEN el usuario presiona "Confirmar Género", THE System SHALL mostrar la animación de carga (LoadingScreen)
2. WHEN la animación de carga se completa, THE System SHALL mostrar la página principal (home)
3. WHEN se muestra la animación de carga, THE System SHALL mantener la información del usuario (nombre y género)
4. THE System SHALL usar la misma animación de carga existente (LoadingScreen) sin cambios

### Requirement 5: Mantener consistencia visual con animaciones de fondo

**User Story:** Como diseñador, quiero que la pantalla de selección de género mantenga la estética del Santuario Potaxie con animaciones de fondo atractivas.

#### Acceptance Criteria

1. WHEN GenderSelectionScreen se renderiza, THE System SHALL usar la misma paleta de colores que WelcomeScreen
2. WHEN GenderSelectionScreen se renderiza, THE System SHALL usar las mismas fuentes y estilos de texto
3. WHEN GenderSelectionScreen se renderiza, THE System SHALL usar animaciones suaves y transiciones consistentes
4. THE GenderSelectionScreen SHALL tener el mismo fondo degradado que WelcomeScreen
5. THE GenderSelectionScreen SHALL usar los mismos efectos de vidrio (glass-modal) que WelcomeScreen
6. WHEN GenderSelectionScreen se renderiza, THE System SHALL mostrar animaciones de estrellas en el fondo
7. THE System SHALL usar animaciones CSS o una librería de partículas para crear el efecto de estrellas
8. WHEN las estrellas se animan, THE System SHALL mantener un rendimiento fluido sin afectar la interacción del usuario

### Requirement 6: Personalizar saludo según género

**User Story:** Como usuario, quiero que el saludo en la página principal se adapte a mi género seleccionado.

#### Acceptance Criteria

1. WHEN el usuario selecciona "Masculino", THE System SHALL mostrar "Bienvenido" en la página principal
2. WHEN el usuario selecciona "Femenino", THE System SHALL mostrar "Bienvenida" en la página principal
3. WHEN el usuario selecciona "Otro", THE System SHALL mostrar "Bienvenide" en la página principal
4. WHEN el usuario recarga la página, THE System SHALL mantener el saludo personalizado según el género guardado
5. THE System SHALL usar el género guardado en localStorage para determinar el saludo correcto

### Requirement 7: Implementar figuras ilustradas personalizadas

**User Story:** Como diseñador, quiero usar figuras ilustradas personalizadas para cada opción de género que sean visualmente atractivas y consistentes con la estética del Santuario Potaxie.

#### Acceptance Criteria

1. WHEN se preparan los assets, THE System SHALL extraer las tres figuras de la imagen de referencia
2. WHEN se extraen las figuras, THE System SHALL remover el fondo y el texto de cada figura
3. WHEN se extraen las figuras, THE System SHALL guardar cada figura como archivo PNG con transparencia
4. THE System SHALL guardar las figuras en la carpeta `public/` con nombres descriptivos (masculino.png, femenino.png, otro.png)
5. WHEN GenderSelectionScreen se renderiza, THE System SHALL cargar las figuras desde los archivos PNG
6. WHEN el usuario hace hover sobre una figura, THE System SHALL aplicar una animación de escala o brillo
7. WHEN una figura está seleccionada, THE System SHALL aplicar un efecto visual distintivo (borde, sombra, o glow)
8. THE System SHALL mantener la calidad visual de las figuras en diferentes tamaños de pantalla
