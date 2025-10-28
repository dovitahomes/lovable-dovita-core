# Portal del Cliente - Guía de Uso

## Descripción General

El Portal del Cliente es una interfaz optimizada para dispositivos móviles que permite a los clientes visualizar el progreso de sus proyectos, revisar información financiera, ver fotos de obra, agendar citas y comunicarse con el equipo del proyecto.

## Características Principales

### 1. **Navegación Móvil**

En dispositivos móviles (≤768px), el portal utiliza una barra de navegación inferior fija con 5 secciones:

- 🏠 **Inicio**: Información general y resumen de presupuesto
- 💰 **Finanzas**: Estado financiero y desglose de gastos
- 🖼️ **Avances**: Galería de fotos del progreso de obra
- 📅 **Citas**: Calendario de eventos y reuniones
- 💬 **Chat**: Comunicación directa con el equipo

### 2. **Resumen del Proyecto**

**Ruta**: Inicio

Muestra:
- Estado actual del proyecto
- Área del terreno (si aplica)
- Notas del proyecto
- Resumen de presupuesto por partida (sin mostrar costos unitarios)

**Características de accesibilidad**:
- Encabezados semánticos (H1, H2)
- Tooltips con información adicional
- Diseño responsive de 1 columna en móvil, 2 en desktop

### 3. **Resumen Financiero**

**Ruta**: Finanzas

Visualiza:
- Total de depósitos recibidos
- Total de gastos en materiales
- Saldo actual del proyecto
- Desglose detallado por Mayor con porcentajes

**Características**:
- Tarjetas con indicadores visuales de color
- Tabla con scroll horizontal en móvil
- Manejo de errores con botón "Reintentar"
- Estados vacíos informativos

### 4. **Documentos**

**Ruta**: Documentos (disponible en navegación desktop)

Funciones:
- Listado de documentos compartidos por el equipo
- Visualización del tipo de carpeta y fecha
- Botón directo para abrir/descargar documentos

**Características**:
- Nombres truncados con tooltip completo
- Estado vacío cuando no hay documentos
- Manejo de errores

### 5. **Galería de Avances**

**Ruta**: Avances

Permite:
- Ver fotos del progreso de obra
- Grid responsive (2 columnas en móvil, 4 en desktop)
- Visor de fotos con gestos táctiles

**Gestos Soportados**:
- **Tap**: Ver foto en pantalla completa
- **Swipe izquierda/derecha**: Navegar entre fotos
- **Teclas de flecha**: Navegación con teclado
- **Esc**: Cerrar visor

**Información mostrada**:
- Descripción de la foto
- Fecha de captura
- Ubicación GPS (si está disponible)
- Contador de posición (ej: 3 / 12)

### 6. **Calendario de Citas**

**Ruta**: Citas

Funciones:
- Ver eventos programados
- Agendar nuevas citas
- Vista semanal en móvil, mensual en desktop
- Navegación por semanas/meses

**Crear Nueva Cita**:
1. Tap en botón "Nueva Cita"
2. Completar:
   - Título (requerido)
   - Fecha y hora (requerido)
   - Notas (opcional)
3. Tap en "Agendar"

**Características de accesibilidad**:
- Labels asociados a inputs
- Foco automático en campo de título
- Diálogo simplificado para móvil
- Estados vacíos con CTA claro

### 7. **Chat del Proyecto**

**Ruta**: Chat

Permite:
- Enviar mensajes al equipo
- Ver historial de conversaciones
- Actualizaciones en tiempo real

**Uso**:
1. Escribir mensaje en el campo de texto
2. Presionar **Enter** para enviar (o **Shift+Enter** para nueva línea)
3. O tap en botón "Enviar"

**Características**:
- Auto-scroll al último mensaje
- Burbujas de chat diferenciadas (propias vs. ajenas)
- Indicador de estado de envío
- Scroll automático en nuevos mensajes
- Estados vacíos con invitación a iniciar conversación

## Atajos de Teclado

- **Esc**: Cierra modales/diálogos
- **Enter**: Envía mensaje en chat (sin Shift)
- **←/→**: Navega entre fotos en el visor
- **Tab**: Navegación entre elementos

## Accesibilidad

El portal cumple con las siguientes prácticas de accesibilidad:

✅ Encabezados semánticos (H1, H2, H3)
✅ Labels asociados a todos los inputs
✅ Atributos ARIA apropiados
✅ Navegación por teclado completa
✅ Focus management en modales
✅ Tooltips descriptivos
✅ Estados vacíos informativos
✅ Mensajes de error claros con CTA

## Rendimiento

**Optimizaciones implementadas**:
- Cache de datos con TanStack Query (staleTime: 15s)
- Prefetch ligero al cambiar tabs
- Virtualización en listas largas (cuando aplique)
- Lazy loading de imágenes
- Suscripciones en tiempo real optimizadas

## Manejo de Errores

Cada vista incluye:
- Mensajes de error amigables
- Botones "Reintentar" para recuperación
- Estados de carga con spinners
- Fallbacks visuales informativos

## Soporte de Dispositivos

- ✅ **Móvil**: Optimizado para pantallas <768px
- ✅ **Tablet**: Diseño adaptativo 768px-1200px
- ✅ **Desktop**: Vista completa >1200px

## Capturas de Pantalla

*Nota: Agregar capturas de pantalla de cada sección del portal para referencia visual*

## Preguntas Frecuentes

**Q: ¿Por qué no veo costos unitarios en el presupuesto?**
A: Por política de transparencia, los clientes ven totales por partida sin desglose de costos unitarios, desperdicio o honorarios.

**Q: ¿Cómo actualizo la información?**
A: La información se actualiza automáticamente cada 15 segundos. También puedes usar el botón "Reintentar" en caso de error.

**Q: ¿Puedo agendar citas fuera del horario laboral?**
A: Sí, puedes agendar citas en cualquier horario. El equipo confirmará la disponibilidad por chat.

**Q: ¿Las fotos se sincronizan en tiempo real?**
A: Las fotos nuevas aparecen cuando el equipo las marca como "Visible para Cliente" y actualizas la vista.

## Soporte Técnico

Para reportar problemas o solicitar ayuda, comunícate con el equipo a través del chat integrado en el portal.
