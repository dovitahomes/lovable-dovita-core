-- Design Phases table
CREATE TABLE IF NOT EXISTS public.design_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_key TEXT NOT NULL,
  phase_name TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendiente',
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT valid_status CHECK (status IN ('pendiente', 'en_proceso', 'terminada'))
);

-- Design Change Logs table
CREATE TABLE IF NOT EXISTS public.design_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.design_phases(id) ON DELETE SET NULL,
  meeting_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  requested_by TEXT,
  changes_json JSONB NOT NULL,
  signed BOOLEAN NOT NULL DEFAULT false,
  signature_url TEXT,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Design Deliverables table
CREATE TABLE IF NOT EXISTS public.design_deliverables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES public.design_phases(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  description TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add updated_at triggers
DROP TRIGGER IF EXISTS update_design_phases_updated_at ON public.design_phases;
CREATE TRIGGER update_design_phases_updated_at
  BEFORE UPDATE ON public.design_phases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_design_change_logs_updated_at ON public.design_change_logs;
CREATE TRIGGER update_design_change_logs_updated_at
  BEFORE UPDATE ON public.design_change_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_design_phases_project_id ON public.design_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_design_change_logs_project_id ON public.design_change_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_design_deliverables_project_id ON public.design_deliverables(project_id);

-- Ensure design-deliverables bucket exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('design-deliverables', 'design-deliverables', false)
ON CONFLICT (id) DO NOTHING;