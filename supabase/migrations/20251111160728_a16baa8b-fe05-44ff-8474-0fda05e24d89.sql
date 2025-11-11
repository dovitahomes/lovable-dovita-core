-- =====================================================
-- MEJORAS DE SEGURIDAD RLS - SET SEARCH_PATH
-- =====================================================
-- Agregar SET search_path a todas las funciones para prevenir
-- ataques de inyección de path. Esto es una mejora de seguridad
-- que no afecta la funcionalidad existente.

-- Función: is_collaborator
CREATE OR REPLACE FUNCTION public.is_collaborator()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role_name IN ('admin', 'colaborador', 'contador')
  );
$$;

-- Función: get_client_id_from_auth
CREATE OR REPLACE FUNCTION public.get_client_id_from_auth()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.clients
  WHERE email = auth.jwt()->>'email'
  LIMIT 1;
$$;

-- Función: ensure_profile
CREATE OR REPLACE FUNCTION public.ensure_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    auth.uid(),
    (select email from auth.users where id = auth.uid()),
    coalesce((select raw_user_meta_data->>'full_name' from auth.users where id = auth.uid()), '')
  )
  on conflict (id) do nothing;
end;
$$;

-- Función: user_has_role
CREATE OR REPLACE FUNCTION public.user_has_role(p_user_id uuid, p_role_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role_name = p_role_name
  );
$$;

-- Función: current_user_has_role
CREATE OR REPLACE FUNCTION public.current_user_has_role(p_role_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.user_has_role(auth.uid(), p_role_name);
$$;

-- Función: has_role
CREATE OR REPLACE FUNCTION public.has_role(p_user_id uuid, p_role_name text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.user_has_role(p_user_id, p_role_name);
$$;

-- Función: get_user_project_ids
CREATE OR REPLACE FUNCTION public.get_user_project_ids(p_user_id uuid)
RETURNS uuid[]
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT ARRAY_AGG(DISTINCT project_id)
  FROM (
    SELECT project_id 
    FROM public.project_collaborators 
    WHERE user_id = p_user_id
    
    UNION
    
    SELECT p.id as project_id
    FROM public.projects p
    JOIN public.clients c ON c.id = p.client_id
    WHERE c.email = (SELECT email FROM auth.users WHERE id = p_user_id)
  ) all_projects;
$$;

-- Función: is_client_user
CREATE OR REPLACE FUNCTION public.is_client_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role_name = 'cliente'
  );
$$;

-- Función: user_can_access_project
CREATE OR REPLACE FUNCTION public.user_can_access_project(p_user_id uuid, p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN public.current_user_has_role('admin') THEN true
    
    WHEN EXISTS (
      SELECT 1 FROM public.project_collaborators 
      WHERE user_id = p_user_id AND project_id = p_project_id
    ) THEN true
    
    WHEN public.current_user_has_role('cliente') 
      AND EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = p_project_id 
          AND client_id = public.get_client_id_from_auth()
      ) THEN true
    
    ELSE false
  END;
$$;

-- Función: user_has_module_permission
CREATE OR REPLACE FUNCTION public.user_has_module_permission(p_user_id uuid, p_module text, p_action text)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT CASE p_action
    WHEN 'view' THEN COALESCE((
      SELECT can_view FROM public.user_permissions 
      WHERE user_id = p_user_id AND module_name = p_module
      LIMIT 1
    ), false)
    
    WHEN 'create' THEN COALESCE((
      SELECT can_create FROM public.user_permissions 
      WHERE user_id = p_user_id AND module_name = p_module
      LIMIT 1
    ), false)
    
    WHEN 'edit' THEN COALESCE((
      SELECT can_edit FROM public.user_permissions 
      WHERE user_id = p_user_id AND module_name = p_module
      LIMIT 1
    ), false)
    
    WHEN 'delete' THEN COALESCE((
      SELECT can_delete FROM public.user_permissions 
      WHERE user_id = p_user_id AND module_name = p_module
      LIMIT 1
    ), false)
    
    ELSE false
  END;
$$;

-- Función: grant_full_chat_history
CREATE OR REPLACE FUNCTION public.grant_full_chat_history(p_project_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.project_chat_participants
  SET show_history_from = NULL
  WHERE project_id = p_project_id
  AND user_id = p_user_id;
END;
$$;

-- Función: remove_from_chat
CREATE OR REPLACE FUNCTION public.remove_from_chat(p_project_id uuid, p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.project_chat_participants
  SET is_active = false
  WHERE project_id = p_project_id
  AND user_id = p_user_id;
END;
$$;

-- Función: mark_message_as_read
CREATE OR REPLACE FUNCTION public.mark_message_as_read(p_message_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.message_read_receipts (message_id, user_id)
  VALUES (p_message_id, auth.uid())
  ON CONFLICT (message_id, user_id) DO NOTHING;
  
  UPDATE public.project_messages
  SET status = 'read'
  WHERE id = p_message_id
  AND status != 'read'
  AND (
    SELECT COUNT(DISTINCT pcp.user_id)
    FROM public.project_chat_participants pcp
    WHERE pcp.project_id = project_messages.project_id
    AND pcp.is_active = true
    AND pcp.user_id != project_messages.sender_id
  ) = (
    SELECT COUNT(DISTINCT mrr.user_id)
    FROM public.message_read_receipts mrr
    WHERE mrr.message_id = p_message_id
    AND mrr.user_id != project_messages.sender_id
  );
END;
$$;

-- Función: get_unread_message_count
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_project_id uuid)
RETURNS integer
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count INTEGER;
  v_show_history_from TIMESTAMPTZ;
BEGIN
  SELECT show_history_from INTO v_show_history_from
  FROM public.project_chat_participants
  WHERE project_id = p_project_id
  AND user_id = auth.uid()
  AND is_active = true;
  
  SELECT COUNT(*)::INTEGER INTO v_count
  FROM public.project_messages pm
  WHERE pm.project_id = p_project_id
  AND pm.sender_id != auth.uid()
  AND (v_show_history_from IS NULL OR pm.created_at >= v_show_history_from)
  AND NOT EXISTS (
    SELECT 1 FROM public.message_read_receipts mrr
    WHERE mrr.message_id = pm.id
    AND mrr.user_id = auth.uid()
  );
  
  RETURN COALESCE(v_count, 0);
END;
$$;

-- Función: sync_user_profile
CREATE OR REPLACE FUNCTION public.sync_user_profile(p_user_id uuid, p_email text, p_full_name text DEFAULT ''::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb;
  v_existed boolean;
BEGIN
  IF NOT public.current_user_has_role('admin') THEN
    RAISE EXCEPTION 'Solo administradores pueden sincronizar perfiles';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_user_id
  ) INTO v_existed;

  INSERT INTO public.profiles (id, email, full_name)
  VALUES (p_user_id, p_email, COALESCE(NULLIF(p_full_name, ''), p_email))
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name, EXCLUDED.email),
    updated_at = NOW();

  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'action', CASE WHEN v_existed THEN 'updated' ELSE 'created' END,
    'success', true
  );

  RETURN v_result;
END;
$$;

-- Función: get_effective_rule
CREATE OR REPLACE FUNCTION public.get_effective_rule(p_key text, p_proyecto_id uuid DEFAULT NULL::uuid, p_sucursal_id uuid DEFAULT NULL::uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rule_set_id UUID;
  v_value JSONB;
BEGIN
  SELECT id INTO v_rule_set_id
  FROM public.business_rule_sets
  WHERE is_default = true
  LIMIT 1;

  IF p_proyecto_id IS NOT NULL THEN
    SELECT value_json INTO v_value
    FROM public.business_rules
    WHERE rule_set_id = v_rule_set_id
      AND key = p_key
      AND scope_type = 'proyecto'
      AND scope_id = p_proyecto_id
      AND active_from <= now()
      AND (active_to IS NULL OR active_to > now())
    LIMIT 1;
    
    IF v_value IS NOT NULL THEN
      RETURN v_value;
    END IF;
  END IF;

  IF p_sucursal_id IS NOT NULL THEN
    SELECT value_json INTO v_value
    FROM public.business_rules
    WHERE rule_set_id = v_rule_set_id
      AND key = p_key
      AND scope_type = 'sucursal'
      AND scope_id = p_sucursal_id
      AND active_from <= now()
      AND (active_to IS NULL OR active_to > now())
    LIMIT 1;
    
    IF v_value IS NOT NULL THEN
      RETURN v_value;
    END IF;
  END IF;

  SELECT value_json INTO v_value
  FROM public.business_rules
  WHERE rule_set_id = v_rule_set_id
    AND key = p_key
    AND scope_type = 'global'
    AND active_from <= now()
    AND (active_to IS NULL OR active_to > now())
  LIMIT 1;

  RETURN v_value;
END;
$$;

COMMENT ON FUNCTION public.is_collaborator IS 'Security hardened: SET search_path prevents path injection';
COMMENT ON FUNCTION public.get_client_id_from_auth IS 'Security hardened: SET search_path prevents path injection';
COMMENT ON FUNCTION public.user_has_role IS 'Security hardened: SET search_path prevents path injection';
COMMENT ON FUNCTION public.current_user_has_role IS 'Security hardened: SET search_path prevents path injection';
COMMENT ON FUNCTION public.user_can_access_project IS 'Security hardened: SET search_path prevents path injection';
COMMENT ON FUNCTION public.user_has_module_permission IS 'Security hardened: SET search_path prevents path injection';