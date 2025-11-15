-- MIGRACIÓN DEFINITIVA V3: Eliminar todas las versiones y crear log_crm_activity_v3 con IF statements

-- 1. Eliminar TODOS los triggers existentes en TODAS las tablas CRM
DROP TRIGGER IF EXISTS trg_log_lead_activity ON public.leads;
DROP TRIGGER IF EXISTS trg_log_account_activity ON public._deprecated_accounts;
DROP TRIGGER IF EXISTS trg_log_contact_activity ON public._deprecated_contacts;
DROP TRIGGER IF EXISTS trg_log_opportunity_activity ON public.opportunities;
DROP TRIGGER IF EXISTS trg_log_task_activity ON public.tasks;

-- 2. Eliminar TODAS las versiones de la función con CASCADE
DROP FUNCTION IF EXISTS public.log_crm_activity() CASCADE;
DROP FUNCTION IF EXISTS public.log_crm_activity_v2() CASCADE;
DROP FUNCTION IF EXISTS public.log_crm_activity_v3() CASCADE;

-- 3. Crear función DEFINITIVA log_crm_activity_v3() usando IF statements
CREATE OR REPLACE FUNCTION public.log_crm_activity_v3()
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
    WHEN '_deprecated_accounts' THEN 'account'
    WHEN '_deprecated_contacts' THEN 'contact'
    WHEN 'opportunities' THEN 'opportunity'
    WHEN 'tasks' THEN 'task'
    ELSE 'unknown'
  END;
  
  -- Get user ID
  user_id := COALESCE(auth.uid(), NEW.created_by, NEW.updated_by);
  
  -- Get entity name usando IF statements (NO CASE) para evitar error "field name"
  IF TG_TABLE_NAME = 'leads' THEN
    entity_name := NEW.nombre_completo;
  ELSIF TG_TABLE_NAME = '_deprecated_accounts' THEN
    entity_name := NEW.name;
  ELSIF TG_TABLE_NAME = '_deprecated_contacts' THEN
    entity_name := NEW.name;
  ELSIF TG_TABLE_NAME = 'opportunities' THEN
    entity_name := NEW.subject;
  ELSIF TG_TABLE_NAME = 'tasks' THEN
    entity_name := NEW.subject;
  ELSE
    entity_name := NEW.id::TEXT;
  END IF;
  
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

-- 4. Recrear TODOS los triggers apuntando a log_crm_activity_v3()
CREATE TRIGGER trg_log_lead_activity
  AFTER INSERT OR UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.log_crm_activity_v3();

CREATE TRIGGER trg_log_account_activity
  AFTER INSERT OR UPDATE ON public._deprecated_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_crm_activity_v3();

CREATE TRIGGER trg_log_contact_activity
  AFTER INSERT OR UPDATE ON public._deprecated_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_crm_activity_v3();

CREATE TRIGGER trg_log_opportunity_activity
  AFTER INSERT OR UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.log_crm_activity_v3();

-- 5. Invalidar cache de PostgREST
NOTIFY pgrst, 'reload schema';

-- 6. Comentario explicativo
COMMENT ON FUNCTION public.log_crm_activity_v3() IS 'V3 DEFINITIVA: Registra actividades CRM usando IF statements (NO CASE) para evitar error "field name". Campos: leads.nombre_completo, _deprecated_accounts.name, _deprecated_contacts.name, opportunities.subject, tasks.subject';