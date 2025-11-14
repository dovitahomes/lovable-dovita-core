
-- Add progress_override column to projects table
ALTER TABLE public.projects
ADD COLUMN progress_override NUMERIC CHECK (progress_override >= 0 AND progress_override <= 100);

COMMENT ON COLUMN public.projects.progress_override IS 'Porcentaje de progreso manual. Si está set, sobrescribe el cálculo automático.';
