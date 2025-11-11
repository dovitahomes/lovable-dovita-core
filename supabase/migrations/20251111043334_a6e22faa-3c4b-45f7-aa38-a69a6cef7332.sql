-- FASE 1: Eliminación completa de Accounts y Contacts

-- 1.1 Eliminar foreign keys de leads
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_account_id_fkey;
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_contact_id_fkey;

-- 1.2 Eliminar columnas account_id y contact_id de leads
ALTER TABLE leads DROP COLUMN IF EXISTS account_id;
ALTER TABLE leads DROP COLUMN IF EXISTS contact_id;

-- 1.3 Deprecar tablas accounts y contacts (renombrar para backup)
ALTER TABLE accounts RENAME TO _deprecated_accounts;
ALTER TABLE contacts RENAME TO _deprecated_contacts;

-- 1.4 Agregar comentarios de deprecación
COMMENT ON TABLE _deprecated_accounts IS 'DEPRECATED: Eliminado del CRM. Data histórica únicamente. No usar.';
COMMENT ON TABLE _deprecated_contacts IS 'DEPRECATED: Eliminado del CRM. Data histórica únicamente. No usar.';

-- 1.5 (Opcional) Expandir tabla clients con campos útiles de accounts
ALTER TABLE clients ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS billing_address_json JSONB DEFAULT '{}'::jsonb;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS shipping_address_json JSONB DEFAULT '{}'::jsonb;

-- Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_clients_industry ON clients(industry) WHERE industry IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clients_tax_id ON clients(tax_id) WHERE tax_id IS NOT NULL;