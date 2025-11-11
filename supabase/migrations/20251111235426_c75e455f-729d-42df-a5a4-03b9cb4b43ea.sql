-- Fix log_crm_activity() function to prevent "record 'old' has no field 'stage'" error
-- Uses nested IF statements to only access fields that exist in the current table

CREATE OR REPLACE FUNCTION public.log_crm_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  entity_type_val TEXT;
  activity_type_val TEXT;
  description_val TEXT;
  user_id UUID;
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
  
  IF TG_OP = 'INSERT' THEN
    activity_type_val := 'created';
    description_val := 'Creó ' || entity_type_val || ' ' || COALESCE(NEW.name, NEW.nombre_completo, NEW.subject, NEW.id::TEXT);
    
    INSERT INTO public.crm_activities (activity_type, entity_type, entity_id, description, performed_by)
    VALUES (activity_type_val, entity_type_val, NEW.id, description_val, user_id);
    
  ELSIF TG_OP = 'UPDATE' THEN
    -- Use nested IF to only access fields that exist in the current table
    IF TG_TABLE_NAME = 'opportunities' THEN
      -- Only for opportunities: check stage field
      IF OLD.stage IS DISTINCT FROM NEW.stage THEN
        activity_type_val := 'status_changed';
        description_val := 'Cambió stage de "' || OLD.stage || '" a "' || NEW.stage || '"';
      ELSE
        activity_type_val := 'updated';
        description_val := 'Actualizó ' || entity_type_val;
      END IF;
      
    ELSIF TG_TABLE_NAME = 'tasks' THEN
      -- Only for tasks: check status field
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        activity_type_val := 'status_changed';
        description_val := 'Cambió status de "' || OLD.status || '" a "' || NEW.status || '"';
      ELSE
        activity_type_val := 'updated';
        description_val := 'Actualizó ' || entity_type_val;
      END IF;
      
    ELSIF TG_TABLE_NAME = 'leads' THEN
      -- Only for leads: check status field
      IF OLD.status IS DISTINCT FROM NEW.status THEN
        activity_type_val := 'status_changed';
        description_val := 'Cambió status de "' || OLD.status || '" a "' || NEW.status || '"';
      ELSE
        activity_type_val := 'updated';
        description_val := 'Actualizó ' || entity_type_val;
      END IF;
      
    ELSE
      -- For other tables without status tracking
      activity_type_val := 'updated';
      description_val := 'Actualizó ' || entity_type_val;
    END IF;
    
    INSERT INTO public.crm_activities (activity_type, entity_type, entity_id, description, performed_by)
    VALUES (activity_type_val, entity_type_val, NEW.id, description_val, user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.log_crm_activity() IS 'Registra automáticamente actividades en crm_activities cuando se crean o actualizan registros en tablas CRM. Usa IF anidados para evitar acceder a campos inexistentes.';