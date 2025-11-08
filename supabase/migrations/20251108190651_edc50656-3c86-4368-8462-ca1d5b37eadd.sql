-- FASE 6: Diseño - Timeline y Bitácora Firmada
-- Agregar campos de progreso y fechas reales a design_phases

ALTER TABLE design_phases
ADD COLUMN IF NOT EXISTS progress_pct INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_start_date DATE,
ADD COLUMN IF NOT EXISTS actual_end_date DATE;

-- Agregar campos de firma a design_change_logs
ALTER TABLE design_change_logs
ADD COLUMN IF NOT EXISTS firmado BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS firma_url TEXT,
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMPTZ;

-- Comentarios
COMMENT ON COLUMN design_phases.progress_pct IS 'Porcentaje de avance real de la fase (0-100)';
COMMENT ON COLUMN design_phases.actual_start_date IS 'Fecha real de inicio de la fase';
COMMENT ON COLUMN design_phases.actual_end_date IS 'Fecha real de finalización de la fase';
COMMENT ON COLUMN design_change_logs.firmado IS 'Indica si el log de cambios fue firmado por el cliente';
COMMENT ON COLUMN design_change_logs.firma_url IS 'Ruta relativa de la firma digital en bucket firmas';
COMMENT ON COLUMN design_change_logs.signed_at IS 'Fecha y hora en que se firmó el log de cambios';