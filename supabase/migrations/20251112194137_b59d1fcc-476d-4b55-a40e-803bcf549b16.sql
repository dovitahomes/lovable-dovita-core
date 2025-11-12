-- ============================================
-- Fase 5: Integración Bidireccional Alianzas ↔ Comisiones
-- ============================================

-- 1. Agregar columna referencia_alianza_id a budgets
ALTER TABLE budgets 
ADD COLUMN IF NOT EXISTS referencia_alianza_id UUID REFERENCES alianzas(id) ON DELETE SET NULL;

-- 2. Crear índice para performance
CREATE INDEX IF NOT EXISTS idx_budgets_referencia_alianza 
ON budgets(referencia_alianza_id) 
WHERE referencia_alianza_id IS NOT NULL;

-- 3. Crear función que auto-genera comisión al publicar presupuesto
CREATE OR REPLACE FUNCTION auto_generate_alliance_commission()
RETURNS TRIGGER AS $$
DECLARE
  v_alianza_comision NUMERIC;
  v_budget_total NUMERIC;
  v_calculated_amount NUMERIC;
BEGIN
  -- Solo ejecutar si el presupuesto se está publicando Y tiene referencia_alianza_id
  IF NEW.status = 'publicado' 
     AND OLD.status != 'publicado' 
     AND NEW.referencia_alianza_id IS NOT NULL THEN
    
    -- Obtener porcentaje de comisión de la alianza y validar que esté activa
    SELECT comision_porcentaje INTO v_alianza_comision
    FROM alianzas
    WHERE id = NEW.referencia_alianza_id 
      AND activa = true;
    
    -- Si la alianza no está activa o no existe, no generar comisión
    IF v_alianza_comision IS NULL THEN
      RAISE NOTICE 'No se generó comisión: alianza inactiva o no encontrada';
      RETURN NEW;
    END IF;
    
    -- Calcular total del presupuesto (sumar todos los items)
    SELECT COALESCE(SUM(total), 0) INTO v_budget_total
    FROM budget_items
    WHERE budget_id = NEW.id;
    
    -- Si no hay items o el total es 0, no generar comisión
    IF v_budget_total <= 0 THEN
      RAISE NOTICE 'No se generó comisión: presupuesto sin items o total = 0';
      RETURN NEW;
    END IF;
    
    -- Calcular monto de comisión
    v_calculated_amount := v_budget_total * (v_alianza_comision / 100);
    
    -- Insertar comisión automáticamente
    INSERT INTO commissions (
      tipo,
      deal_ref,
      sujeto_id,
      base_amount,
      percent,
      calculated_amount,
      status,
      notes
    ) VALUES (
      'alianza',
      NEW.id,
      NEW.referencia_alianza_id,
      v_budget_total,
      v_alianza_comision,
      v_calculated_amount,
      'calculada',
      'Comisión generada automáticamente al publicar presupuesto'
    );
    
    RAISE NOTICE 'Comisión generada: $% (% del presupuesto de $%)', 
      v_calculated_amount, v_alianza_comision, v_budget_total;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Crear trigger que ejecuta la función
DROP TRIGGER IF EXISTS trigger_auto_generate_alliance_commission ON budgets;
CREATE TRIGGER trigger_auto_generate_alliance_commission
  AFTER UPDATE ON budgets
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_alliance_commission();

-- 5. Agregar comentarios de documentación
COMMENT ON COLUMN budgets.referencia_alianza_id IS 
  'FK a alianzas - indica si este presupuesto fue referido por una alianza comercial';

COMMENT ON FUNCTION auto_generate_alliance_commission() IS 
  'Trigger function que auto-genera comisión cuando un presupuesto es publicado y tiene referencia_alianza_id';

COMMENT ON TRIGGER trigger_auto_generate_alliance_commission ON budgets IS 
  'Auto-genera comisión de alianza al publicar presupuesto con referencia_alianza_id';