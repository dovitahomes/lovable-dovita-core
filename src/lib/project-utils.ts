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
    return 'Seguimiento detallado del proceso de diseño';
  }
  
  return 'Seguimiento detallado del proceso de construcción';
};

/**
 * Calcula el progreso general del proyecto basándose en sus fases
 * Cada fase vale (100 / número_de_fases)%
 * El progreso se calcula sumando: fases completadas + (fase_actual.progress * valor_fase / 100)
 */
export const calculateProjectProgress = (project: Project | null): number => {
  if (!project || !project.phases || project.phases.length === 0) return 0;
  
  const phases = project.phases;
  const phaseValue = 100 / phases.length; // Valor de cada fase
  
  let totalProgress = 0;
  
  phases.forEach(phase => {
    // Cada fase aporta su progreso multiplicado por su valor proporcional
    totalProgress += (phase.progress * phaseValue) / 100;
  });
  
  return Math.round(totalProgress);
};

/**
 * Obtiene la fase actual del proyecto
 * Prioriza: la fase en progreso más reciente (progress > 0 y < 100)
 * Si hay varias en progreso, toma la más reciente (última en el array)
 */
export const getCurrentPhase = (project: Project | null): { name: string; progress: number } | null => {
  if (!project || !project.phases || project.phases.length === 0) {
    return null;
  }
  
  // Buscar fases en progreso (progress > 0 y < 100)
  const inProgressPhases = project.phases.filter(
    phase => phase.progress > 0 && phase.progress < 100
  );
  
  // Si hay fases en progreso, tomar la última (más reciente)
  if (inProgressPhases.length > 0) {
    const currentPhase = inProgressPhases[inProgressPhases.length - 1];
    return {
      name: currentPhase.name,
      progress: currentPhase.progress
    };
  }
  
  // Si no hay fases en progreso, buscar la primera pendiente
  const pendingPhase = project.phases.find(phase => phase.progress === 0);
  if (pendingPhase) {
    return {
      name: pendingPhase.name,
      progress: 0
    };
  }
  
  // Si todas están completas, mostrar la última
  const lastPhase = project.phases[project.phases.length - 1];
  return {
    name: lastPhase.name,
    progress: lastPhase.progress
  };
};
