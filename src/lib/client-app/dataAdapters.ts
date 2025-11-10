import type { Project, Document, Phase } from '@/contexts/client-app/ProjectContext';

// Temporary type definitions until they're added to supabase/types
type ClientProject = any;
type ClientProjectSummary = any;
type ClientDocument = any;
type ClientPhoto = any;

/**
 * Transforma un proyecto de Supabase al formato completo de Project
 */
export function transformProjectToUI(
  project: ClientProject,
  summary?: ClientProjectSummary | null,
  documents?: ClientDocument[],
  photos?: ClientPhoto[]
): Project {
  const defaultHeroImage = 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80';
  
  return {
    id: project.project_id,
    clientName: project.client_name || 'Cliente',
    name: project.project_name || `Casa ${project.client_name || 'Cliente'}`,
    location: project.ubicacion_json?.direccion || project.ubicacion_json?.ciudad || 'Sin ubicación',
    progress: summary?.progress_percent || 0,
    currentPhase: determineCurrentPhase(summary?.progress_percent || 0, project.project_status),
    projectStage: determineProjectStage(project.project_status),
    totalAmount: summary?.total_amount || 0,
    totalPaid: summary?.total_paid || 0,
    totalPending: summary?.total_pending || 0,
    startDate: summary?.start_date || project.created_at?.split('T')[0] || '',
    estimatedEndDate: summary?.estimated_end_date || '',
    heroImage: photos && photos.length > 0 ? photos[0].storage_path : defaultHeroImage,
    renders: transformPhotosToRenders(photos || []),
    team: generateDefaultTeam(),
    documents: transformDocuments(documents || []),
    phases: generatePhasesFromProgress(summary?.progress_percent || 0),
  };
}

/**
 * Transforma documentos de Supabase al formato de UI
 */
export function transformDocuments(docs: ClientDocument[]): Document[] {
  return docs.map(d => ({
    id: parseInt(d.doc_id.slice(0, 8), 16), // Convertir UUID a número
    name: d.name,
    size: formatFileSize(d.file_size),
    date: formatDate(d.uploaded_at),
    type: determineDocType(d.mime_type),
    category: mapCategory(d.category),
  }));
}

/**
 * Transforma fotos de construcción a formato de renders
 */
export function transformPhotosToRenders(photos: ClientPhoto[]) {
  return photos.slice(0, 10).map((photo, index) => ({
    id: parseInt(photo.photo_id.slice(0, 8), 16),
    url: photo.storage_path,
    title: photo.caption || `Foto ${index + 1}`,
    phase: photo.phase_name || 'Construcción',
    date: formatDate(photo.taken_at),
  }));
}

/**
 * Genera fases desde el porcentaje de progreso
 */
export function generatePhasesFromProgress(progress: number): Phase[] {
  const phases = [
    { name: 'Diseño', threshold: 20 },
    { name: 'Cimentación', threshold: 40 },
    { name: 'Estructura', threshold: 60 },
    { name: 'Acabados', threshold: 80 },
    { name: 'Entrega', threshold: 100 },
  ];

  return phases.map((phase, index) => ({
    id: index + 1,
    name: phase.name,
    status: progress >= phase.threshold 
      ? 'completed' 
      : progress >= (phases[index - 1]?.threshold || 0) 
        ? 'in-progress' 
        : 'pending',
    progress: Math.min(100, Math.max(0, (progress - (phases[index - 1]?.threshold || 0)) / (phase.threshold - (phases[index - 1]?.threshold || 0)) * 100)),
    startDate: '', // TODO: obtener de gantt_items
    endDate: '', // TODO: obtener de gantt_items
  }));
}

/**
 * Genera equipo por defecto (mientras se implementa project_members)
 */
function generateDefaultTeam() {
  return [
    {
      id: 1,
      name: "Arq. Equipo Dovita",
      role: "Arquitecto Líder",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Dovita",
      phone: "+52 442 123 4567",
      email: "contacto@dovita.mx"
    }
  ];
}

/**
 * Determina la fase actual basada en el progreso
 */
function determineCurrentPhase(progress: number, status: string): string {
  if (status === 'pausado') return 'Proyecto Pausado';
  if (status === 'finalizado') return 'Proyecto Finalizado';
  
  if (progress < 20) return 'Diseño';
  if (progress < 40) return 'Cimentación';
  if (progress < 60) return 'Estructura';
  if (progress < 80) return 'Acabados';
  return 'Entrega';
}

/**
 * Determina el stage del proyecto (diseño o construcción)
 */
function determineProjectStage(status: string): 'design' | 'construction' {
  const designStatuses = ['diseno', 'planificacion'];
  return designStatuses.includes(status) ? 'design' : 'construction';
}

/**
 * Determina el tipo de documento basado en mime type
 */
function determineDocType(mimeType: string): 'pdf' | 'image' {
  return mimeType.includes('image') ? 'image' : 'pdf';
}

/**
 * Formatea el tamaño de archivo
 */
function formatFileSize(bytes: number): string {
  if (bytes >= 1000000) {
    return `${(bytes / 1000000).toFixed(1)} MB`;
  }
  return `${(bytes / 1000).toFixed(0)} KB`;
}

/**
 * Formatea fecha al formato esperado: "1 Mar 2024"
 */
function formatDate(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleDateString('es-MX', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
}

/**
 * Mapea categorías de BD a categorías de UI
 */
function mapCategory(dbCategory: string): 'cliente' | 'proyecto' | 'legal' | 'diseno' | 'construccion' {
  const mapping: Record<string, 'cliente' | 'proyecto' | 'legal' | 'diseno' | 'construccion'> = {
    'documentos_cliente': 'cliente',
    'identificaciones': 'cliente',
    'planos': 'proyecto',
    'especificaciones': 'proyecto',
    'contratos': 'legal',
    'permisos': 'legal',
    'renders': 'diseno',
    'diseno_interior': 'diseno',
    'bitacora': 'construccion',
    'avances': 'construccion',
  };
  
  return mapping[dbCategory] || 'proyecto';
}

/**
 * Formatea monto a moneda MXN
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Calcula el porcentaje
 */
export function calculatePercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 100);
}

/**
 * Obtiene la imagen hero del proyecto
 * Prioriza: última imagen JPG de diseño > renders > heroImage default
 */
export function getProjectHeroImage(project: Project | null): string {
  if (!project) return '';
  
  // 1. Buscar documentos de diseño tipo imagen (JPG, PNG, etc.)
  const designImages = project.documents
    .filter(doc => doc.category === 'diseno' && doc.type === 'image' && doc.url)
    .sort((a, b) => {
      // Ordenar por fecha descendente (más reciente primero)
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  
  // Si hay imágenes de diseño con URL, usar la más reciente
  if (designImages.length > 0 && designImages[0].url) {
    return designImages[0].url;
  }
  
  // 2. Si no hay imágenes de diseño, usar renders
  if (project.renders && project.renders.length > 0) {
    return project.renders[0].url;
  }
  
  // 3. Fallback a la imagen hero por defecto
  return project.heroImage;
}
