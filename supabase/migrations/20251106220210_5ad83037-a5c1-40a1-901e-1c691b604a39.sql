-- Actualizar seed_role_permissions para incluir módulos administrativos completos
CREATE OR REPLACE FUNCTION public.seed_role_permissions(p_user_id uuid, p_role_name text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Eliminar permisos existentes para evitar duplicados
  DELETE FROM public.user_permissions WHERE user_id = p_user_id;
  
  -- Sembrar según rol
  IF p_role_name = 'admin' THEN
    INSERT INTO public.user_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
    VALUES
      -- Principal
      (p_user_id, 'dashboard', true, true, true, true),
      
      -- CRM
      (p_user_id, 'leads', true, true, true, true),
      (p_user_id, 'clientes', true, true, true, true),
      
      -- Proyectos
      (p_user_id, 'proyectos', true, true, true, true),
      (p_user_id, 'diseno', true, true, true, true),
      (p_user_id, 'presupuestos', true, true, true, true),
      (p_user_id, 'cronograma', true, true, true, true),
      (p_user_id, 'construccion', true, true, true, true),
      
      -- Abastecimiento
      (p_user_id, 'proveedores', true, true, true, true),
      (p_user_id, 'ordenes_compra', true, true, true, true),
      (p_user_id, 'lotes_pago', true, true, true, true),
      
      -- Finanzas
      (p_user_id, 'finanzas', true, true, true, true),
      (p_user_id, 'contabilidad', true, true, true, true),
      (p_user_id, 'comisiones', true, true, true, true),
      
      -- Gestión / Herramientas
      (p_user_id, 'usuarios', true, true, true, true),
      (p_user_id, 'accesos', true, true, true, true),
      (p_user_id, 'identidades', true, true, true, true),
      (p_user_id, 'contenido_corporativo', true, true, true, true),
      (p_user_id, 'sucursales', true, true, true, true),
      (p_user_id, 'centro_reglas', true, true, true, true),
      (p_user_id, 'herramientas', true, true, true, true)
    ON CONFLICT (user_id, module_name) DO NOTHING;
    
  ELSIF p_role_name = 'colaborador' THEN
    INSERT INTO public.user_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
    VALUES
      (p_user_id, 'dashboard', true, false, false, false),
      (p_user_id, 'leads', true, true, true, false),
      (p_user_id, 'clientes', true, true, true, false),
      (p_user_id, 'proyectos', true, true, true, false),
      (p_user_id, 'diseno', true, true, true, false),
      (p_user_id, 'presupuestos', true, true, true, false),
      (p_user_id, 'cronograma', true, true, true, false),
      (p_user_id, 'construccion', true, true, true, false),
      (p_user_id, 'proveedores', true, true, true, false),
      (p_user_id, 'ordenes_compra', true, true, true, false)
    ON CONFLICT (user_id, module_name) DO NOTHING;
    
  ELSIF p_role_name = 'contador' THEN
    INSERT INTO public.user_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
    VALUES
      (p_user_id, 'dashboard', true, false, false, false),
      (p_user_id, 'finanzas', true, true, true, false),
      (p_user_id, 'contabilidad', true, true, true, false),
      (p_user_id, 'lotes_pago', true, true, true, false)
    ON CONFLICT (user_id, module_name) DO NOTHING;
    
  ELSIF p_role_name = 'cliente' THEN
    INSERT INTO public.user_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
    VALUES
      (p_user_id, 'client_portal', true, false, false, false)
    ON CONFLICT (user_id, module_name) DO NOTHING;
  END IF;
END;
$function$;