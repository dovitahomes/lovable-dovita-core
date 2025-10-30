-- FASE 2: CONSTRUCCIÓN LIMPIA DEL NUEVO SISTEMA
BEGIN;

-- 2.1) Catálogo de roles (fuente de verdad)
CREATE TABLE public.roles (
  role_name TEXT PRIMARY KEY,
  description TEXT
);

INSERT INTO public.roles (role_name, description) VALUES
  ('admin', 'Administrador con acceso total'),
  ('colaborador', 'Colaborador interno con acceso limitado'),
  ('contador', 'Contador con acceso a finanzas'),
  ('cliente', 'Cliente externo con acceso al portal');

-- 2.2) Asignación de roles a usuarios (N:N)
CREATE TABLE public.user_roles (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL REFERENCES public.roles(role_name) ON DELETE RESTRICT,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  granted_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (user_id, role_name)
);

CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_role ON public.user_roles(role_name);

-- 2.3) Permisos granulares por usuario y módulo
CREATE TABLE public.user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT FALSE,
  can_create BOOLEAN NOT NULL DEFAULT FALSE,
  can_edit BOOLEAN NOT NULL DEFAULT FALSE,
  can_delete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, module_name)
);

CREATE INDEX idx_user_permissions_user ON public.user_permissions(user_id);
CREATE INDEX idx_user_permissions_module ON public.user_permissions(module_name);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_permissions_updated
BEFORE UPDATE ON public.user_permissions
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 2.4) Función helper: verificar si usuario tiene rol
CREATE OR REPLACE FUNCTION public.user_has_role(p_user_id UUID, p_role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_user_id AND role_name = p_role_name
  );
$$;

-- 2.5) Función helper: verificar si usuario actual tiene rol
CREATE OR REPLACE FUNCTION public.current_user_has_role(p_role_name TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.user_has_role(auth.uid(), p_role_name);
$$;

-- 2.6) Función de sembrado de permisos por rol
CREATE OR REPLACE FUNCTION public.seed_role_permissions(p_user_id UUID, p_role_name TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Eliminar permisos existentes para evitar duplicados
  DELETE FROM public.user_permissions WHERE user_id = p_user_id;
  
  -- Sembrar según rol
  IF p_role_name = 'admin' THEN
    INSERT INTO public.user_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
    VALUES
      (p_user_id, 'dashboard', true, true, true, true),
      (p_user_id, 'leads', true, true, true, true),
      (p_user_id, 'clientes', true, true, true, true),
      (p_user_id, 'proyectos', true, true, true, true),
      (p_user_id, 'diseno', true, true, true, true),
      (p_user_id, 'presupuestos', true, true, true, true),
      (p_user_id, 'cronograma', true, true, true, true),
      (p_user_id, 'construccion', true, true, true, true),
      (p_user_id, 'proveedores', true, true, true, true),
      (p_user_id, 'finanzas', true, true, true, true),
      (p_user_id, 'contabilidad', true, true, true, true),
      (p_user_id, 'comisiones', true, true, true, true),
      (p_user_id, 'usuarios', true, true, true, true),
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
      (p_user_id, 'proveedores', true, true, true, false)
    ON CONFLICT (user_id, module_name) DO NOTHING;
    
  ELSIF p_role_name = 'contador' THEN
    INSERT INTO public.user_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
    VALUES
      (p_user_id, 'dashboard', true, false, false, false),
      (p_user_id, 'finanzas', true, true, true, false),
      (p_user_id, 'contabilidad', true, true, true, false)
    ON CONFLICT (user_id, module_name) DO NOTHING;
    
  ELSIF p_role_name = 'cliente' THEN
    INSERT INTO public.user_permissions (user_id, module_name, can_view, can_create, can_edit, can_delete)
    VALUES
      (p_user_id, 'client_portal', true, false, false, false)
    ON CONFLICT (user_id, module_name) DO NOTHING;
  END IF;
END;
$$;

-- 2.7) Función de bootstrap principal (llamar tras login)
CREATE OR REPLACE FUNCTION public.bootstrap_user_on_login()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_email TEXT;
  v_full_name TEXT;
  v_has_any_admin BOOLEAN;
  v_user_roles TEXT[];
BEGIN
  -- Validar que hay sesión
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No hay usuario autenticado';
  END IF;
  
  -- Obtener datos del usuario
  SELECT email, COALESCE(raw_user_meta_data->>'full_name', '')
  INTO v_email, v_full_name
  FROM auth.users
  WHERE id = v_user_id;
  
  -- 1) Asegurar perfil
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (v_user_id, v_email, v_full_name)
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name);
  
  -- 2) Si NO existe ningún admin, hacer admin al primer usuario
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE role_name = 'admin'
  ) INTO v_has_any_admin;
  
  IF NOT v_has_any_admin THEN
    INSERT INTO public.user_roles (user_id, role_name)
    VALUES (v_user_id, 'admin')
    ON CONFLICT DO NOTHING;
  END IF;
  
  -- 3) Si el usuario no tiene roles, asignar 'colaborador' por defecto
  SELECT ARRAY_AGG(role_name) INTO v_user_roles
  FROM public.user_roles
  WHERE user_id = v_user_id;
  
  IF v_user_roles IS NULL OR array_length(v_user_roles, 1) IS NULL THEN
    INSERT INTO public.user_roles (user_id, role_name)
    VALUES (v_user_id, 'colaborador')
    ON CONFLICT DO NOTHING;
    
    v_user_roles := ARRAY['colaborador'];
  END IF;
  
  -- 4) Sembrar permisos para cada rol (idempotente)
  FOR i IN 1..array_length(v_user_roles, 1) LOOP
    PERFORM public.seed_role_permissions(v_user_id, v_user_roles[i]);
  END LOOP;
  
END;
$$;

-- 2.8) Función administrativa: asignar/quitar roles
CREATE OR REPLACE FUNCTION public.admin_set_user_roles(
  p_user_id UUID,
  p_roles TEXT[]
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
BEGIN
  -- Solo admins pueden ejecutar
  IF NOT public.current_user_has_role('admin') THEN
    RAISE EXCEPTION 'Solo administradores pueden gestionar roles';
  END IF;
  
  -- Limpiar roles existentes
  DELETE FROM public.user_roles WHERE user_id = p_user_id;
  DELETE FROM public.user_permissions WHERE user_id = p_user_id;
  
  -- Asignar nuevos roles y sembrar permisos
  FOREACH v_role IN ARRAY p_roles LOOP
    INSERT INTO public.user_roles (user_id, role_name, granted_by)
    VALUES (p_user_id, v_role, auth.uid())
    ON CONFLICT DO NOTHING;
    
    PERFORM public.seed_role_permissions(p_user_id, v_role);
  END LOOP;
END;
$$;

-- 2.9) Vista para UI de gestión
CREATE OR REPLACE VIEW public.vw_users_with_roles AS
SELECT
  p.id,
  p.email,
  COALESCE(p.full_name, '') AS full_name,
  COALESCE(p.phone, '') AS phone,
  COALESCE(
    ARRAY_AGG(ur.role_name ORDER BY ur.role_name) FILTER (WHERE ur.role_name IS NOT NULL),
    ARRAY[]::TEXT[]
  ) AS roles
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
GROUP BY p.id, p.email, p.full_name, p.phone;

-- 2.10) Sembrar admin inicial
DO $$
DECLARE
  v_admin_id UUID;
BEGIN
  SELECT id INTO v_admin_id
  FROM auth.users
  WHERE LOWER(email) = LOWER('e@dovitahomes.com')
  LIMIT 1;
  
  IF v_admin_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_name)
    VALUES (v_admin_id, 'admin')
    ON CONFLICT DO NOTHING;
    
    PERFORM public.seed_role_permissions(v_admin_id, 'admin');
  END IF;
END$$;

COMMIT;