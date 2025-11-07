-- Otorgar permisos de ejecución a la función admin_set_user_roles
GRANT EXECUTE ON FUNCTION public.admin_set_user_roles(uuid, text[]) TO authenticated, service_role;

-- Recargar el schema cache de PostgREST
NOTIFY pgrst, 'reload schema';