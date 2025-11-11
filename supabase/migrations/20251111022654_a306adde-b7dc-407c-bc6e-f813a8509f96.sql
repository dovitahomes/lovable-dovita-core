-- FASE 1a: Agregar nuevos valores al enum lead_status
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'propuesta';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'negociacion';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'ganado';