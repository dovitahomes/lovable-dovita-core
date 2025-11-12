-- ============================================
-- FASE 2: CORRECCIÓN ARQUITECTÓNICA - COMISIONES
-- ============================================
-- Objetivo: Eliminar commission_config.alliance_percent global
-- y forzar uso de alianzas.comision_porcentaje específico

-- Paso 1: Actualizar alianzas existentes sin comisión con valor por defecto 5.0
UPDATE alianzas 
SET comision_porcentaje = 5.0 
WHERE comision_porcentaje IS NULL;

-- Paso 2: Hacer comision_porcentaje obligatorio con constraint
ALTER TABLE alianzas 
ALTER COLUMN comision_porcentaje SET NOT NULL;

ALTER TABLE alianzas 
ADD CONSTRAINT check_comision_porcentaje_positive 
CHECK (comision_porcentaje >= 0 AND comision_porcentaje <= 100);

-- Paso 3: Comentar columna alliance_percent (deprecada pero mantenida por compatibilidad)
COMMENT ON COLUMN commission_config.alliance_percent IS 
'DEPRECADO: No usar. Ahora cada alianza tiene su propio comision_porcentaje en tabla alianzas.';

-- Paso 4: Agregar índice para performance en consultas de comisiones por alianza
CREATE INDEX IF NOT EXISTS idx_commissions_alianza 
ON commissions(sujeto_id) 
WHERE tipo = 'alianza';

-- Paso 5: Agregar índice en alianzas activas para filtrado rápido
CREATE INDEX IF NOT EXISTS idx_alianzas_activa 
ON alianzas(activa, comision_porcentaje) 
WHERE activa = true;