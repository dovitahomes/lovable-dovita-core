import type { Project } from '@/contexts/ProjectContext';

/**
 * Determina si el proyecto está en fase de diseño
 */
export const isInDesignPhase = (project: Project | null): boolean => {
  if (!project) return false;
  return project.projectStage === 'design';
};

/**
 * Determina si el proyecto está en fase de construcción
 */
export const isInConstructionPhase = (project: Project | null): boolean => {
  if (!project) return false;
  return project.projectStage === 'construction';
};

/**
 * Obtiene la imagen hero del proyecto
 * Prioriza: última imagen JPG de diseño > renders > heroImage default
 */
export const getProjectHeroImage = (project: Project | null): string => {
  if (!project) return '';
  
  // Buscar documentos de diseño tipo imagen (JPG)
  const designImages = project.documents
    .filter(doc => doc.category === 'diseno' && doc.type === 'image')
    .sort((a, b) => {
      // Ordenar por fecha descendente (más reciente primero)
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateB.getTime() - dateA.getTime();
    });
  
  // Si hay imágenes de diseño, usar la más reciente
  if (designImages.length > 0) {
    // Las imágenes en documents no tienen URL, solo name, así que usamos heroImage o renders
    // En un sistema real, esto vendría del backend con URLs completas
  }
  
  // Fallback a la imagen hero del proyecto
  return project.heroImage;
};

/**
 * Determina si mostrar fotos de construcción
 * Solo se muestran en fase de construcción
 */
export const shouldShowConstructionPhotos = (project: Project | null): boolean => {
  return isInConstructionPhase(project);
};

/**
 * Obtiene el título del cronograma según la fase del proyecto
 */
export const getScheduleTitle = (project: Project | null): string => {
  if (!project) return 'Cronograma';
  
  if (isInDesignPhase(project)) {
    return 'Cronograma de Diseño';
  }
  
  return 'Cronograma de Construcción';
};

/**
 * Obtiene el subtítulo del cronograma según la fase del proyecto
 */
export const getScheduleSubtitle = (project: Project | null): string => {
  if (!project) return 'Seguimiento de fases';
  
  if (isInDesignPhase(project)) {
    return 'Seguimiento de fases de diseño';
  }
  
  return 'Seguimiento de fases y avance temporal';
};
