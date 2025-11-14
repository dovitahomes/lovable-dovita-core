-- Sprint 2: Estado de Pago en Ministraciones y Vista Client (CORREGIDO v4)

-- 1. Agregar invoice_id a gantt_ministrations
ALTER TABLE public.gantt_ministrations
ADD COLUMN IF NOT EXISTS invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL;

-- 2. Crear índice para mejorar performance
CREATE INDEX IF NOT EXISTS idx_gantt_ministrations_invoice_id ON public.gantt_ministrations(invoice_id);

-- 3. Eliminar vista existente si hay conflicto de columnas
DROP VIEW IF EXISTS public.v_client_ministrations CASCADE;

-- 4. Crear vista v_client_ministrations con estado de pago
CREATE VIEW public.v_client_ministrations AS
SELECT
  gm.id,
  gm.gantt_id,
  gm.date,
  gm.label,
  gm.percent,
  gm.accumulated_percent,
  gm.alcance,
  gm.invoice_id,
  gp.project_id,
  -- Calcular estado de pago
  CASE
    WHEN gm.invoice_id IS NULL THEN 'pendiente'::text
    WHEN i.paid = true THEN 'pagado'::text
    WHEN gm.date < CURRENT_DATE AND (i.paid IS NULL OR i.paid = false) THEN 'vencido'::text
    ELSE 'pendiente'::text
  END AS payment_status,
  -- Información de la factura si existe
  i.total_amount AS invoice_amount,
  i.issued_at AS invoice_date,
  i.uuid AS invoice_uuid,
  -- Información del proyecto
  p.project_name,
  c.name AS client_name
FROM public.gantt_ministrations gm
INNER JOIN public.gantt_plans gp ON gp.id = gm.gantt_id
INNER JOIN public.projects p ON p.id = gp.project_id
INNER JOIN public.clients c ON c.id = p.client_id
LEFT JOIN public.invoices i ON i.id = gm.invoice_id
WHERE gp.shared_with_construction = true
  AND gp.type = 'ejecutivo';

-- 5. RLS policies para v_client_ministrations
ALTER VIEW public.v_client_ministrations SET (security_invoker = on);

-- Policy para clientes: solo ven ministraciones de sus proyectos
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'gantt_ministrations' 
    AND policyname = 'client_view_ministrations'
  ) THEN
    CREATE POLICY client_view_ministrations ON public.gantt_ministrations
      FOR SELECT
      USING (
        current_user_has_role('cliente'::text) AND
        gantt_id IN (
          SELECT gp.id 
          FROM public.gantt_plans gp
          INNER JOIN public.projects p ON p.id = gp.project_id
          WHERE p.client_id = get_client_id_from_auth()
            AND gp.shared_with_construction = true
        )
      );
  END IF;
END $$;

-- Policy para colaboradores: ven ministraciones de proyectos donde colaboran
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'gantt_ministrations' 
    AND policyname = 'collaborator_view_ministrations'
  ) THEN
    CREATE POLICY collaborator_view_ministrations ON public.gantt_ministrations
      FOR SELECT
      USING (
        gantt_id IN (
          SELECT gp.id 
          FROM public.gantt_plans gp
          WHERE user_can_access_project(auth.uid(), gp.project_id)
            AND user_has_module_permission(auth.uid(), 'cronograma'::text, 'view'::text)
        )
      );
  END IF;
END $$;

-- Policy para admins
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'gantt_ministrations' 
    AND policyname = 'admin_all_ministrations'
  ) THEN
    CREATE POLICY admin_all_ministrations ON public.gantt_ministrations
      FOR ALL
      USING (current_user_has_role('admin'::text))
      WITH CHECK (current_user_has_role('admin'::text));
  END IF;
END $$;

-- 6. Habilitar RLS en gantt_ministrations
ALTER TABLE public.gantt_ministrations ENABLE ROW LEVEL SECURITY;

-- 7. Comentarios para documentación
COMMENT ON COLUMN public.gantt_ministrations.invoice_id IS 'Referencia a la factura asociada con esta ministración. Permite rastrear el estado de pago.';
COMMENT ON VIEW public.v_client_ministrations IS 'Vista para el portal del cliente que muestra ministraciones con su estado de pago calculado automáticamente.';
