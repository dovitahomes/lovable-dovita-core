-- Fix: Modify audit trigger to skip auditing when user is being deleted
-- This prevents foreign key violations when cascading from auth.users deletion

CREATE OR REPLACE FUNCTION public.audit_user_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  old_roles_array text[];
  new_roles_array text[];
  user_exists boolean;
BEGIN
  -- Check if the user still exists in auth.users
  -- If not, skip auditing (this happens during CASCADE delete)
  IF TG_OP = 'DELETE' THEN
    SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = OLD.user_id) INTO user_exists;
    IF NOT user_exists THEN
      RETURN OLD;
    END IF;
  END IF;

  -- Obtener roles anteriores
  SELECT ARRAY_AGG(role_name) INTO old_roles_array
  FROM user_roles
  WHERE user_id = COALESCE(NEW.user_id, OLD.user_id);

  -- Determinar acción y roles nuevos
  IF TG_OP = 'INSERT' THEN
    new_roles_array := old_roles_array || ARRAY[NEW.role_name];
    
    INSERT INTO user_role_audit (
      user_id, action, old_roles, new_roles, changed_by, ip_address
    ) VALUES (
      NEW.user_id,
      'add_role',
      COALESCE(old_roles_array, ARRAY[]::text[]),
      new_roles_array,
      auth.uid(),
      inet_client_addr()
    );
  ELSIF TG_OP = 'DELETE' THEN
    new_roles_array := ARRAY_REMOVE(old_roles_array, OLD.role_name);
    
    INSERT INTO user_role_audit (
      user_id, action, old_roles, new_roles, changed_by, ip_address
    ) VALUES (
      OLD.user_id,
      'remove_role',
      old_roles_array,
      COALESCE(new_roles_array, ARRAY[]::text[]),
      auth.uid(),
      inet_client_addr()
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;