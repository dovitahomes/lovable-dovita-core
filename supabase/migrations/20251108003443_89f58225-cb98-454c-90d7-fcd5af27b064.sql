-- Normalizar admin_set_user_roles: eliminar sobrecargas y crear función canónica

-- 1. Borrar cualquier variante previa
DROP FUNCTION IF EXISTS public.admin_set_user_roles(text[], uuid);
DROP FUNCTION IF EXISTS public.admin_set_user_roles(uuid, text[]);

-- 2. Definir la firma única y canónica (nombres que usa el front)
CREATE OR REPLACE FUNCTION public.admin_set_user_roles(
  target_user_id uuid,
  roles text[]
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_role text;
BEGIN
  -- Garantizar que quien llama sea admin (usa tu helper existente)
  IF NOT public.current_user_has_role('admin') THEN
    RAISE EXCEPTION 'Solo administradores pueden gestionar roles';
  END IF;

  -- Limpiar roles/permisos previos
  DELETE FROM public.user_roles        WHERE user_id = target_user_id;
  DELETE FROM public.user_permissions  WHERE user_id = target_user_id;

  -- Asignar nuevos roles + sembrar permisos derivados
  FOREACH v_role IN ARRAY roles LOOP
    INSERT INTO public.user_roles (user_id, role_name, granted_by)
    VALUES (target_user_id, v_role, auth.uid())
    ON CONFLICT DO NOTHING;

    PERFORM public.seed_role_permissions(target_user_id, v_role);
  END LOOP;
END;
$$;

-- 3. Permisos de ejecución
REVOKE ALL ON FUNCTION public.admin_set_user_roles(uuid, text[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_set_user_roles(uuid, text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_user_roles(uuid, text[]) TO service_role;

-- 4. Recargar la caché de PostgREST (indispensable)
NOTIFY pgrst, 'reload schema';