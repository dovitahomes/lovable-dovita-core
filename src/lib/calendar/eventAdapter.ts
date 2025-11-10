// FASE 1: Adaptador de Datos
// Transforma datos entre project_events (Supabase) y formato Event (EventManager)

export interface DovitaEvent {
  id: string;
  title: string;
  description?: string | null;
  start_time: string;
  end_time: string;
  event_type: string; // Puede ser cualquier string, validamos en runtime
  visibility: string; // Puede ser cualquier string, validamos en runtime
  location?: string | null;
  status: string; // Puede ser cualquier string, validamos en runtime
  project_id: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  projects?: {
    id: string;
    project_name: string | null;
    client_id: string;
    clients: { name: string } | null;
  };
}

export interface EventManagerEvent {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  color: string;
  category: string; // Usamos event_type aquí
  tags: string[]; // Status y visibility como tags
  projectId: string;
  projectName: string;
  clientName: string;
  location?: string;
  status: string;
  visibility: string;
  event_type: string;
}

// Mapeo de colores consistente por event_type
export const EVENT_TYPE_COLORS = {
  meeting: { 
    name: 'Azul', 
    value: 'blue', 
    bg: 'bg-blue-500', 
    text: 'text-blue-700',
    hsl: 'hsl(221, 83%, 53%)' 
  },
  site_visit: { 
    name: 'Verde', 
    value: 'green', 
    bg: 'bg-green-500', 
    text: 'text-green-700',
    hsl: 'hsl(142, 71%, 45%)' 
  },
  review: { 
    name: 'Púrpura', 
    value: 'purple', 
    bg: 'bg-purple-500', 
    text: 'text-purple-700',
    hsl: 'hsl(271, 81%, 56%)' 
  },
  deadline: { 
    name: 'Naranja', 
    value: 'orange', 
    bg: 'bg-orange-500', 
    text: 'text-orange-700',
    hsl: 'hsl(25, 95%, 53%)' 
  },
  other: { 
    name: 'Rosa', 
    value: 'pink', 
    bg: 'bg-pink-500', 
    text: 'text-pink-700',
    hsl: 'hsl(330, 81%, 60%)' 
  },
} as const;

export const EVENT_TYPE_LABELS = {
  meeting: 'Reunión',
  site_visit: 'Visita de obra',
  review: 'Revisión',
  deadline: 'Fecha límite',
  other: 'Otro',
} as const;

export const STATUS_LABELS = {
  propuesta: 'Propuesta',
  aceptada: 'Aceptada',
  rechazada: 'Rechazada',
  cancelada: 'Cancelada',
} as const;

export const VISIBILITY_LABELS = {
  client: 'Visible para cliente',
  team: 'Solo equipo',
} as const;

/**
 * Transforma un evento de Supabase al formato EventManager
 */
export function toEventManagerFormat(dovitaEvent: DovitaEvent): EventManagerEvent {
  // Validar y normalizar event_type
  const eventType = dovitaEvent.event_type as keyof typeof EVENT_TYPE_COLORS;
  const colorConfig = EVENT_TYPE_COLORS[eventType] || EVENT_TYPE_COLORS.other;
  
  return {
    id: dovitaEvent.id,
    title: dovitaEvent.title,
    description: dovitaEvent.description || undefined,
    startTime: new Date(dovitaEvent.start_time),
    endTime: new Date(dovitaEvent.end_time),
    color: colorConfig.value,
    category: eventType, // event_type como category
    tags: [dovitaEvent.status, dovitaEvent.visibility], // Status y visibility como tags
    projectId: dovitaEvent.project_id,
    projectName: dovitaEvent.projects?.project_name || 'Sin nombre',
    clientName: dovitaEvent.projects?.clients?.name || 'Sin cliente',
    location: dovitaEvent.location || undefined,
    status: dovitaEvent.status,
    visibility: dovitaEvent.visibility,
    event_type: eventType,
  };
}

/**
 * Transforma un array de eventos de Supabase al formato EventManager
 */
export function toEventManagerFormats(dovitaEvents: DovitaEvent[]): EventManagerEvent[] {
  return dovitaEvents.map(toEventManagerFormat);
}

/**
 * Extrae los datos necesarios para actualizar un evento en Supabase
 * NO incluye project_id ya que eso no debe cambiar con drag & drop
 */
export function toSupabaseUpdate(event: Partial<EventManagerEvent>): Partial<DovitaEvent> {
  const update: Partial<DovitaEvent> = {};
  
  if (event.title !== undefined) update.title = event.title;
  if (event.description !== undefined) update.description = event.description;
  if (event.startTime !== undefined) update.start_time = event.startTime.toISOString();
  if (event.endTime !== undefined) update.end_time = event.endTime.toISOString();
  if (event.location !== undefined) update.location = event.location;
  
  // NO actualizamos event_type, visibility, o status en drag & drop
  // Esos solo se actualizan mediante el dialog de edición
  
  return update;
}

/**
 * Obtiene la configuración de color para un event_type
 */
export function getColorByEventType(eventType: keyof typeof EVENT_TYPE_COLORS) {
  return EVENT_TYPE_COLORS[eventType];
}

/**
 * Obtiene la etiqueta en español de un event_type
 */
export function getEventTypeLabel(eventType: keyof typeof EVENT_TYPE_LABELS) {
  return EVENT_TYPE_LABELS[eventType];
}

/**
 * Obtiene la etiqueta en español de un status
 */
export function getStatusLabel(status: keyof typeof STATUS_LABELS) {
  return STATUS_LABELS[status];
}

/**
 * Obtiene la etiqueta en español de visibility
 */
export function getVisibilityLabel(visibility: keyof typeof VISIBILITY_LABELS) {
  return VISIBILITY_LABELS[visibility];
}
