-- PASO 1: Recreación forzada de log_crm_activity() para corregir error "field name"

-- Eliminar función existente con CASCADE para limpiar triggers
DROP FUNCTION IF EXISTS public.log_crm_activity() CASCADE;

-- Recrear función con lógica corregida
CREATE OR REPLACE FUNCTION public.log_crm_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  entity_type_val TEXT;
  activity_type_val TEXT;
  description_val TEXT;
  user_id UUID;
  entity_name TEXT;
BEGIN
  -- Determine entity type from table name
  entity_type_val := CASE TG_TABLE_NAME
    WHEN 'leads' THEN 'lead'
    WHEN 'accounts' THEN 'account'
    WHEN 'contacts' THEN 'contact'
    WHEN 'opportunities' THEN 'opportunity'
    WHEN 'tasks' THEN 'task'
  END;
  
  -- Get user ID
  user_id := COALESCE(auth.uid(), NEW.created_by, NEW.updated_by);
  
  -- Get entity name based on table structure - CRÍTICO: usar nombre_completo para leads
  entity_name := CASE TG_TABLE_NAME
    WHEN 'leads' THEN NEW.nombre_completo
    WHEN 'accounts' THEN NEW.name
    WHEN 'contacts' THEN NEW.name
    WHEN 'opportunities' THEN NEW.subject
    WHEN 'tasks' THEN NEW.subject
    ELSE NEW.id::TEXT
  END;
  
  IF TG_OP = 'INSERT' THEN
    activity_type_val := 'created';
    description_val := 'Creó ' || entity_type_val || ' ' || COALESCE(entity_name, NEW.id::TEXT);
    
    INSERT INTO public.crm_activities (activity_type, entity_type, entity_id, description, performed_by)
    VALUES (activity_type_val, entity_type_val, NEW.id, description_val, user_id);
    
  ELSIF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'opportunities' THEN
      IF OLD.stage IS DISTINCT FROM NEW.stage THEN
        activity_type_val := 'status_changed';
        description_val := 'Cambió stage de "' || OLD.stage || '" a "' || NEW.stage || '"';
      ELSE
        activity_type_val := 'updated';
        description_val := 'Actualizó ' || entity_type_val;
      END IF;
      
    ELSIF TG_TABLE_NAME = 'tasks' THEN
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        activity_type_val := 'status_changed';
        description_val := 'Cambió status de "' || OLD.status || '" a "' || NEW.status || '"';
      ELSE
        activity_type_val := 'updated';
        description_val := 'Actualizó ' || entity_type_val;
      END IF;
      
    ELSIF TG_TABLE_NAME = 'leads' THEN
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        activity_type_val := 'status_changed';
        description_val := 'Cambió status de "' || OLD.status || '" a "' || NEW.status || '"';
      ELSE
        activity_type_val := 'updated';
        description_val := 'Actualizó ' || entity_type_val;
      END IF;
      
    ELSE
      activity_type_val := 'updated';
      description_val := 'Actualizó ' || entity_type_val;
    END IF;
    
    INSERT INTO public.crm_activities (activity_type, entity_type, entity_id, description, performed_by)
    VALUES (activity_type_val, entity_type_val, NEW.id, description_val, user_id);
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recrear triggers en las 4 tablas CRM
CREATE TRIGGER trg_log_lead_activity
  AFTER INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_crm_activity();

CREATE TRIGGER trg_log_account_activity
  AFTER INSERT OR UPDATE ON public._deprecated_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_crm_activity();

CREATE TRIGGER trg_log_contact_activity
  AFTER INSERT OR UPDATE ON public._deprecated_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_crm_activity();

CREATE TRIGGER trg_log_opportunity_activity
  AFTER INSERT OR UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.log_crm_activity();

COMMENT ON FUNCTION public.log_crm_activity() IS 'Registra automáticamente actividades CRM para leads (nombre_completo), accounts/contacts (name), opportunities/tasks (subject)';