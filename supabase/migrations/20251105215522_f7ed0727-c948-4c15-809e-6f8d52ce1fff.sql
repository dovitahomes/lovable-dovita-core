-- ==========================================
-- VISTAS PARA PORTAL DE CLIENTES
-- ==========================================

-- 1) v_client_projects: proyectos con nombre "amigable"
CREATE OR REPLACE VIEW public.v_client_projects AS
SELECT
  p.id            AS project_id,
  p.client_id     AS client_id,
  'PRJ-' || SUBSTRING(p.id::text, 1, 8) AS project_code,
  COALESCE(c.name, 'Proyecto sin nombre') AS project_name,
  COALESCE(p.status::text, 'activo') AS status,
  p.created_at,
  p.ubicacion_json,
  p.terreno_m2
FROM public.projects p
LEFT JOIN public.clients c ON c.id = p.client_id;

-- 2) v_client_project_summary: resumen con fechas, avance y totales
CREATE OR REPLACE VIEW public.v_client_project_summary AS
WITH budget_totals AS (
  SELECT
    b.project_id,
    COALESCE(SUM(bi.total), 0)::numeric(18,2) AS total_amount
  FROM public.budgets b
  LEFT JOIN public.budget_items bi ON bi.budget_id = b.id
  WHERE b.type = 'ejecutivo' AND b.status = 'publicado'
  GROUP BY b.project_id
),
gantt_dates AS (
  SELECT
    gp.project_id,
    MIN(gi.start_date) AS start_date,
    MAX(gi.end_date)   AS estimated_end_date
  FROM public.gantt_plans gp
  LEFT JOIN public.gantt_items gi ON gi.gantt_id = gp.id
  WHERE gp.type = 'ejecutivo'
  GROUP BY gp.project_id
),
payments AS (
  SELECT
    t.project_id,
    SUM(CASE WHEN t.type = 'ingreso' THEN t.amount ELSE 0 END)::numeric(18,2) AS total_paid,
    MAX(CASE WHEN t.type = 'ingreso' THEN t.created_at END) AS last_payment_at
  FROM public.transactions t
  WHERE t.project_id IS NOT NULL
  GROUP BY t.project_id
)
SELECT
  p.id AS project_id,
  COALESCE(c.name, 'Proyecto sin nombre') AS project_name,
  COALESCE(g.start_date, p.created_at::date) AS start_date,
  g.estimated_end_date,
  0::numeric(5,2) AS progress_percent, -- TODO: calcular desde gantt o construction
  COALESCE(bt.total_amount, 0)::numeric(18,2) AS total_amount,
  COALESCE(pay.total_paid, 0)::numeric(18,2) AS total_paid,
  GREATEST(COALESCE(bt.total_amount, 0) - COALESCE(pay.total_paid, 0), 0)::numeric(18,2) AS total_pending,
  pay.last_payment_at,
  p.status
FROM public.projects p
LEFT JOIN public.clients c ON c.id = p.client_id
LEFT JOIN budget_totals bt ON bt.project_id = p.id
LEFT JOIN gantt_dates g ON g.project_id = p.id
LEFT JOIN payments pay ON pay.project_id = p.id;

-- 3) v_client_documents: documentos visibles para cliente
CREATE OR REPLACE VIEW public.v_client_documents AS
SELECT
  d.id         AS doc_id,
  d.project_id,
  d.nombre     AS name,
  d.file_url   AS storage_path,
  d.file_type  AS mime_type,
  d.file_size,
  d.created_at AS uploaded_at,
  COALESCE(d.visibilidad, 'cliente') AS visibility,
  d.tipo_carpeta AS category,
  d.etiqueta AS label
FROM public.documents d
WHERE COALESCE(d.visibilidad, 'cliente') = 'cliente';

-- 4) v_client_photos: fotos de construcción visibles para cliente
CREATE OR REPLACE VIEW public.v_client_photos AS
SELECT
  p.id            AS photo_id,
  p.project_id,
  p.file_url      AS storage_path,
  p.descripcion   AS caption,
  p.fecha_foto    AS taken_at,
  COALESCE(p.visibilidad, 'cliente') AS visibility,
  p.latitude,
  p.longitude,
  'Construcción'::text AS phase_name -- TODO: link to design_phases when available
FROM public.construction_photos p
WHERE COALESCE(p.visibilidad, 'cliente') = 'cliente';

-- 5) v_client_appointments: agenda del proyecto (stub - calendar_events no tiene visibility ni location)
CREATE OR REPLACE VIEW public.v_client_appointments AS
SELECT
  ce.id        AS appointment_id,
  ce.project_id,
  COALESCE(ce.title, 'Cita') AS title,
  ce.start_at  AS starts_at,
  ce.end_at    AS ends_at,
  NULL::text   AS location, -- TODO: agregar campo location a calendar_events
  ce.notes,
  ce.attendees
FROM public.calendar_events ce
WHERE ce.project_id IS NOT NULL;

-- 6) v_client_ministrations: ministraciones del Gantt Ejecutivo
CREATE OR REPLACE VIEW public.v_client_ministrations AS
SELECT
  gp.project_id,
  gm.order_index AS seq,
  COALESCE(gm.label, 'Ministración ' || gm.order_index::text) AS label,
  COALESCE(gm.percent, 0)::numeric(5,2) AS percent,
  COALESCE(gm.accumulated_percent, 0)::numeric(6,2) AS cumulative_percent,
  gm.alcance AS notes,
  gm.date AS date
FROM public.gantt_ministrations gm
JOIN public.gantt_plans gp ON gp.id = gm.gantt_id
WHERE gp.type = 'ejecutivo';

-- 7) v_client_financial_summary: resumen financiero por proyecto
CREATE OR REPLACE VIEW public.v_client_financial_summary AS
WITH budget_totals AS (
  SELECT
    b.project_id,
    SUM(COALESCE(bi.total, 0))::numeric(18,2) AS total_amount
  FROM public.budgets b
  LEFT JOIN public.budget_items bi ON bi.budget_id = b.id
  WHERE b.type = 'ejecutivo' AND b.status = 'publicado'
  GROUP BY b.project_id
),
payments AS (
  SELECT
    t.project_id,
    SUM(CASE WHEN t.type = 'ingreso' THEN t.amount ELSE 0 END)::numeric(18,2) AS paid_amount,
    MAX(CASE WHEN t.type = 'ingreso' THEN t.created_at END) AS last_payment_at
  FROM public.transactions t
  WHERE t.project_id IS NOT NULL
  GROUP BY t.project_id
),
expenses AS (
  SELECT
    t.project_id,
    SUM(CASE WHEN t.type = 'egreso' THEN t.amount ELSE 0 END)::numeric(18,2) AS spent_amount
  FROM public.transactions t
  WHERE t.project_id IS NOT NULL
  GROUP BY t.project_id
)
SELECT
  p.id AS project_id,
  COALESCE(bt.total_amount, 0)::numeric(18,2) AS total_amount,
  COALESCE(pay.paid_amount, 0)::numeric(18,2) AS paid_amount,
  GREATEST(COALESCE(bt.total_amount, 0) - COALESCE(pay.paid_amount, 0), 0)::numeric(18,2) AS pending_amount,
  COALESCE(exp.spent_amount, 0)::numeric(18,2) AS spent_amount,
  pay.last_payment_at
FROM public.projects p
LEFT JOIN budget_totals bt ON bt.project_id = p.id
LEFT JOIN payments pay ON pay.project_id = p.id
LEFT JOIN expenses exp ON exp.project_id = p.id;

-- 8) v_client_budget_categories: categorías de presupuesto por mayor
CREATE OR REPLACE VIEW public.v_client_budget_categories AS
WITH budget_by_mayor AS (
  SELECT
    b.project_id,
    bi.mayor_id,
    tn.name AS mayor_name,
    SUM(COALESCE(bi.total, 0))::numeric(18,2) AS budgeted
  FROM public.budgets b
  JOIN public.budget_items bi ON bi.budget_id = b.id
  LEFT JOIN public.tu_nodes tn ON tn.id = bi.mayor_id
  WHERE b.type = 'ejecutivo' AND b.status = 'publicado'
  GROUP BY b.project_id, bi.mayor_id, tn.name
),
spent_by_mayor AS (
  SELECT
    po.project_id,
    bi.mayor_id,
    SUM(COALESCE(po.qty_ordenada * bi.precio_unit, 0))::numeric(18,2) AS spent
  FROM public.purchase_orders po
  JOIN public.budget_items bi ON bi.subpartida_id = po.subpartida_id
  WHERE po.estado IN ('ordenado', 'recibido')
  GROUP BY po.project_id, bi.mayor_id
)
SELECT
  bbm.project_id,
  bbm.mayor_id,
  COALESCE(bbm.mayor_name, 'Categoría sin nombre') AS name,
  bbm.budgeted,
  COALESCE(sbm.spent, 0)::numeric(18,2) AS spent
FROM budget_by_mayor bbm
LEFT JOIN spent_by_mayor sbm ON sbm.project_id = bbm.project_id AND sbm.mayor_id = bbm.mayor_id;