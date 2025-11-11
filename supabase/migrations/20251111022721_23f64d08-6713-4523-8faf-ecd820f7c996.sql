-- FASE 1b: Agregar campos y migrar datos (requiere commit previo de nuevos enum values)

-- 1. Agregar nuevos campos a leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS amount NUMERIC;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS probability INTEGER DEFAULT 10 CHECK (probability >= 0 AND probability <= 100);
ALTER TABLE leads ADD COLUMN IF NOT EXISTS expected_close_date DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS closed_date TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES accounts(id) ON DELETE SET NULL;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL;

-- 2. Comentarios para documentación
COMMENT ON COLUMN leads.amount IS 'Monto estimado de la oportunidad (cuando el lead avanza a stages de oportunidad)';
COMMENT ON COLUMN leads.probability IS 'Probabilidad de cierre (0-100%). Se usa cuando el lead está en stages de propuesta/negociacion';
COMMENT ON COLUMN leads.expected_close_date IS 'Fecha esperada de cierre de la oportunidad';
COMMENT ON COLUMN leads.closed_date IS 'Fecha real de cierre (cuando status = ganado o perdido)';
COMMENT ON COLUMN leads.account_id IS 'Cuenta CRM asociada (opcional)';
COMMENT ON COLUMN leads.contact_id IS 'Contacto CRM asociado (opcional)';

-- 3. Migrar datos existentes de opportunities a leads
-- Solo migrar opportunities que NO fueron creadas desde leads (para evitar duplicados)
INSERT INTO leads (
  nombre_completo,
  email,
  telefono,
  status,
  amount,
  probability,
  expected_close_date,
  closed_date,
  account_id,
  contact_id,
  created_at,
  updated_at,
  notas
)
SELECT 
  o.name,
  (SELECT email FROM contacts WHERE id = o.contact_id LIMIT 1) as email,
  (SELECT phone FROM contacts WHERE id = o.contact_id LIMIT 1) as telefono,
  CASE o.stage
    WHEN 'prospecto' THEN 'nuevo'::lead_status
    WHEN 'calificado' THEN 'calificado'::lead_status
    WHEN 'propuesta' THEN 'propuesta'::lead_status
    WHEN 'negociacion' THEN 'negociacion'::lead_status
    WHEN 'ganado' THEN 'ganado'::lead_status
    WHEN 'perdido' THEN 'perdido'::lead_status
    ELSE 'nuevo'::lead_status
  END,
  o.amount,
  o.probability,
  o.expected_close_date,
  o.closed_date,
  o.account_id,
  o.contact_id,
  o.created_at,
  o.updated_at,
  o.notes
FROM opportunities o
WHERE NOT EXISTS (
  SELECT 1 FROM leads l 
  WHERE l.email = (SELECT email FROM contacts WHERE id = o.contact_id LIMIT 1)
  AND l.created_at::date = o.created_at::date
)
ON CONFLICT DO NOTHING;

-- 4. Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_leads_account_id ON leads(account_id);
CREATE INDEX IF NOT EXISTS idx_leads_contact_id ON leads(contact_id);
CREATE INDEX IF NOT EXISTS idx_leads_amount ON leads(amount) WHERE amount IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_expected_close_date ON leads(expected_close_date) WHERE expected_close_date IS NOT NULL;