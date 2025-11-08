import { supabase } from "@/integrations/supabase/client";

export type ProjectHealth = 'on-time' | 'at-risk' | 'delayed';

interface ProjectHealthData {
  status: ProjectHealth;
  ganttDelayDays: number;
  budgetOverrunPercent: number;
  missingDocs: number;
  details: string;
}

/**
 * Calcula la "salud" de un proyecto basándose en:
 * - Retraso en el Gantt (días)
 * - Sobrecosto en presupuesto (%)
 * - Documentos obligatorios pendientes (#)
 */
export async function getProjectHealth(projectId: string): Promise<ProjectHealthData> {
  // 1. Calcular retraso del Gantt
  const ganttDelayDays = await calculateGanttDelay(projectId);
  
  // 2. Calcular sobrecosto del presupuesto
  const budgetOverrunPercent = await calculateBudgetOverrun(projectId);
  
  // 3. Contar documentos obligatorios pendientes
  const missingDocs = await countMissingRequiredDocs(projectId);

  // Determinar estado de salud
  let status: ProjectHealth;
  let details: string;

  if (ganttDelayDays > 7 || budgetOverrunPercent > 10 || missingDocs > 5) {
    status = 'delayed';
    details = buildDelayedDetails(ganttDelayDays, budgetOverrunPercent, missingDocs);
  } else if (ganttDelayDays > 3 || budgetOverrunPercent > 5 || missingDocs > 2) {
    status = 'at-risk';
    details = buildAtRiskDetails(ganttDelayDays, budgetOverrunPercent, missingDocs);
  } else {
    status = 'on-time';
    details = 'Proyecto en buen estado';
  }

  return {
    status,
    ganttDelayDays,
    budgetOverrunPercent,
    missingDocs,
    details,
  };
}

async function calculateGanttDelay(projectId: string): Promise<number> {
  try {
    // Obtener la fecha de fin planeada más reciente de las etapas de construcción
    const { data: stages } = await supabase
      .from('construction_stages')
      .select('end_date')
      .eq('project_id', projectId)
      .order('end_date', { ascending: false })
      .limit(1);

    if (!stages || stages.length === 0) return 0;

    const plannedEndDate = new Date(stages[0].end_date);
    const today = new Date();
    
    // Si la fecha planeada ya pasó, calcular días de retraso
    if (today > plannedEndDate) {
      const diffTime = Math.abs(today.getTime() - plannedEndDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    }

    return 0;
  } catch (error) {
    console.error('Error calculating gantt delay:', error);
    return 0;
  }
}

async function calculateBudgetOverrun(projectId: string): Promise<number> {
  try {
    // Obtener presupuesto total del presupuesto ejecutivo publicado
    const { data: budget } = await supabase
      .from('budgets')
      .select(`
        id,
        budget_items (
          total
        )
      `)
      .eq('project_id', projectId)
      .eq('type', 'ejecutivo')
      .eq('status', 'publicado')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!budget) return 0;

    const budgetedTotal = (budget.budget_items as any[])?.reduce(
      (sum, item) => sum + (item.total || 0),
      0
    ) || 0;

    if (budgetedTotal === 0) return 0;

    // Simplificar: solo contar qty_ordenada como proxy del gasto
    const { data: orders } = await supabase
      .from('purchase_orders')
      .select('qty_ordenada')
      .eq('project_id', projectId);

    // Estimación simplificada del gasto basada en cantidad ordenada
    const orderedQty = orders?.reduce((sum, order) => sum + (order.qty_ordenada || 0), 0) || 0;
    const spentTotal = budgetedTotal > 0 ? (orderedQty / 100) * budgetedTotal : 0;

    // Calcular porcentaje de sobrecosto
    const overrunPercent = ((spentTotal - budgetedTotal) / budgetedTotal) * 100;
    
    return Math.max(0, Math.round(overrunPercent));
  } catch (error) {
    console.error('Error calculating budget overrun:', error);
    return 0;
  }
}

async function countMissingRequiredDocs(projectId: string): Promise<number> {
  try {
    const { data: docs } = await supabase
      .from('required_documents')
      .select('id, subido')
      .eq('project_id', projectId)
      .eq('obligatorio', true);

    if (!docs) return 0;

    const missing = docs.filter(doc => !doc.subido).length;
    return missing;
  } catch (error) {
    console.error('Error counting missing docs:', error);
    return 0;
  }
}

function buildDelayedDetails(ganttDelay: number, budgetOverrun: number, missingDocs: number): string {
  const issues: string[] = [];
  
  if (ganttDelay > 7) {
    issues.push(`${ganttDelay} días de retraso`);
  }
  if (budgetOverrun > 10) {
    issues.push(`${budgetOverrun}% sobre presupuesto`);
  }
  if (missingDocs > 5) {
    issues.push(`${missingDocs} docs pendientes`);
  }

  return issues.join(', ');
}

function buildAtRiskDetails(ganttDelay: number, budgetOverrun: number, missingDocs: number): string {
  const issues: string[] = [];
  
  if (ganttDelay > 3) {
    issues.push(`${ganttDelay} días de retraso`);
  }
  if (budgetOverrun > 5) {
    issues.push(`${budgetOverrun}% sobre presupuesto`);
  }
  if (missingDocs > 2) {
    issues.push(`${missingDocs} docs pendientes`);
  }

  return issues.join(', ');
}

/**
 * Calcula el progreso general del proyecto basado en etapas de construcción
 */
export async function getProjectProgress(projectId: string): Promise<number> {
  try {
    const { data: stages } = await supabase
      .from('construction_stages')
      .select('progress')
      .eq('project_id', projectId);

    if (!stages || stages.length === 0) return 0;

    const avgProgress = stages.reduce((sum, s) => sum + (s.progress || 0), 0) / stages.length;
    return Math.round(avgProgress);
  } catch (error) {
    console.error('Error calculating project progress:', error);
    return 0;
  }
}

/**
 * Calcula días restantes hasta el fin del proyecto
 */
export async function getDaysRemaining(projectId: string): Promise<number | null> {
  try {
    const { data: stages } = await supabase
      .from('construction_stages')
      .select('end_date')
      .eq('project_id', projectId)
      .order('end_date', { ascending: false })
      .limit(1);

    if (!stages || stages.length === 0) return null;

    const endDate = new Date(stages[0].end_date);
    const today = new Date();
    
    const diffTime = endDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.error('Error calculating days remaining:', error);
    return null;
  }
}

// ============================================
// FUNCIONES PARA CLIENT APP
// ============================================

/**
 * Calcula el progreso del proyecto para Client App
 */
export async function calculateProjectProgress(projectId: string): Promise<number> {
  return getProjectProgress(projectId);
}

/**
 * Obtiene la fase actual del proyecto
 */
export async function getCurrentPhase(projectId: string): Promise<string> {
  try {
    const { data: project } = await supabase
      .from('projects')
      .select('status')
      .eq('id', projectId)
      .single();

    return project?.status || 'prospecto';
  } catch (error) {
    console.error('Error getting current phase:', error);
    return 'prospecto';
  }
}

/**
 * Verifica si el proyecto está en fase de diseño (versión síncrona con objeto Project)
 */
export function isInDesignPhase(project: any): boolean {
  if (!project) return false;
  const phase = project.status || project.currentPhase || 'prospecto';
  return phase === 'en_diseno' || phase === 'Diseño';
}

/**
 * Determina si se deben mostrar fotos de construcción (versión síncrona con objeto Project)
 */
export function shouldShowConstructionPhotos(project: any): boolean {
  if (!project) return false;
  const phase = project.status || project.currentPhase || 'prospecto';
  return phase === 'en_construccion' || phase === 'completado' || phase === 'Construcción' || phase === 'Finalizado';
}

/**
 * Obtiene el título del cronograma según la fase
 */
export function getScheduleTitle(phase: string): string {
  const titles: Record<string, string> = {
    en_diseno: 'Cronograma de Diseño',
    presupuestado: 'Cronograma de Proyecto',
    en_construccion: 'Cronograma de Construcción',
    completado: 'Cronograma Final',
  };
  return titles[phase] || 'Cronograma';
}

/**
 * Obtiene el subtítulo del cronograma
 */
export function getScheduleSubtitle(phase: string): string {
  const subtitles: Record<string, string> = {
    en_diseno: 'Planificación y diseño del proyecto',
    presupuestado: 'Planificación general',
    en_construccion: 'Avance de construcción',
    completado: 'Proyecto finalizado',
  };
  return subtitles[phase] || 'Detalles del proyecto';
}

/**
 * Obtiene la imagen hero del proyecto
 */
export async function getProjectHeroImage(projectId: string): Promise<string | null> {
  try {
    const { data: photos } = await supabase
      .from('construction_photos')
      .select('file_url')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!photos || photos.length === 0) return null;

    const { data } = await supabase
      .storage
      .from('project_photos')
      .createSignedUrl(photos[0].file_url, 3600);

    return data?.signedUrl || null;
  } catch (error) {
    console.error('Error getting project hero image:', error);
    return null;
  }
}
