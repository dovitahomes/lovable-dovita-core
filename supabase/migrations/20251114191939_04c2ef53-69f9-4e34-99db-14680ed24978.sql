
-- Create function to calculate project progress
CREATE OR REPLACE FUNCTION public.calculate_project_progress(p_project_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_gantt_progress NUMERIC := 0;
  v_design_progress NUMERIC := 0;
  v_ministration_progress NUMERIC := 0;
  v_has_gantt BOOLEAN := false;
  v_has_design BOOLEAN := false;
  v_has_ministrations BOOLEAN := false;
  v_total_weight NUMERIC := 0;
  v_weighted_sum NUMERIC := 0;
  v_final_progress NUMERIC := 0;
BEGIN
  -- Check if project has Gantt plan (40% weight)
  SELECT EXISTS (
    SELECT 1 FROM public.gantt_plans 
    WHERE project_id = p_project_id
  ) INTO v_has_gantt;
  
  IF v_has_gantt THEN
    -- Calculate Gantt progress based on completed stages
    SELECT COALESCE(
      CASE 
        WHEN COUNT(*) > 0 THEN 
          (COUNT(*) FILTER (WHERE cs.progress >= 100) * 100.0 / COUNT(*))
        ELSE 0
      END, 0
    ) INTO v_gantt_progress
    FROM public.construction_stages cs
    WHERE cs.project_id = p_project_id;
    
    v_total_weight := v_total_weight + 40;
    v_weighted_sum := v_weighted_sum + (v_gantt_progress * 0.4);
  END IF;
  
  -- Check if project has design phases (30% weight)
  SELECT EXISTS (
    SELECT 1 FROM public.design_phases 
    WHERE project_id = p_project_id
  ) INTO v_has_design;
  
  IF v_has_design THEN
    -- Calculate design progress based on completed phases
    SELECT COALESCE(
      CASE 
        WHEN COUNT(*) > 0 THEN 
          (COUNT(*) FILTER (WHERE progress_pct >= 100) * 100.0 / COUNT(*))
        ELSE 0
      END, 0
    ) INTO v_design_progress
    FROM public.design_phases
    WHERE project_id = p_project_id;
    
    v_total_weight := v_total_weight + 30;
    v_weighted_sum := v_weighted_sum + (v_design_progress * 0.3);
  END IF;
  
  -- Check if project has ministrations (30% weight)
  SELECT EXISTS (
    SELECT 1 
    FROM public.gantt_ministrations gm
    JOIN public.gantt_plans gp ON gp.id = gm.gantt_id
    WHERE gp.project_id = p_project_id
  ) INTO v_has_ministrations;
  
  IF v_has_ministrations THEN
    -- Calculate ministrations progress based on paid invoices
    SELECT COALESCE(
      CASE 
        WHEN COUNT(*) > 0 THEN 
          (COUNT(*) FILTER (WHERE i.paid = true) * 100.0 / COUNT(*))
        ELSE 0
      END, 0
    ) INTO v_ministration_progress
    FROM public.gantt_ministrations gm
    JOIN public.gantt_plans gp ON gp.id = gm.gantt_id
    LEFT JOIN public.invoices i ON i.id = gm.invoice_id
    WHERE gp.project_id = p_project_id;
    
    v_total_weight := v_total_weight + 30;
    v_weighted_sum := v_weighted_sum + (v_ministration_progress * 0.3);
  END IF;
  
  -- Calculate final progress (adjust weights if components missing)
  IF v_total_weight > 0 THEN
    v_final_progress := (v_weighted_sum / v_total_weight) * 100;
  ELSE
    v_final_progress := 0;
  END IF;
  
  RETURN ROUND(v_final_progress, 1);
END;
$$;

COMMENT ON FUNCTION public.calculate_project_progress(UUID) IS 'Calcula progreso del proyecto: 40% Gantt + 30% Diseño + 30% Ministraciones. Ajusta pesos si faltan componentes.';
