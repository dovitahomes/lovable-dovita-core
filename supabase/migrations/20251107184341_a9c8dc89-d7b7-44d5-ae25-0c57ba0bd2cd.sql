-- ============================================
-- Health-check y sincronización de profiles
-- ============================================

-- 1. Crear tabla user_metadata si no existe
CREATE TABLE IF NOT EXISTS public.user_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  sucursal_id UUID REFERENCES public.sucursales(id) ON DELETE SET NULL,
  fecha_nacimiento DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.user_metadata ENABLE ROW LEVEL SECURITY;

-- RLS: Admins ven todo, usuarios ven solo su metadata
CREATE POLICY "admin_all_user_metadata" ON public.user_metadata
  FOR ALL USING (current_user_has_role('admin'));

CREATE POLICY "users_view_own_metadata" ON public.user_metadata
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_update_own_metadata" ON public.user_metadata
  FOR UPDATE USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_user_metadata_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_metadata_updated_at
  BEFORE UPDATE ON public.user_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_user_metadata_updated_at();

-- 2. RPC seguro para sincronizar profile (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.sync_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT DEFAULT ''
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
  v_existed boolean;
BEGIN
  -- Solo admins pueden sincronizar
  IF NOT current_user_has_role('admin') THEN
    RAISE EXCEPTION 'Solo administradores pueden sincronizar perfiles';
  END IF;

  -- Verificar si ya existe el profile
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = p_user_id
  ) INTO v_existed;

  -- Upsert del profile
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (p_user_id, p_email, COALESCE(NULLIF(p_full_name, ''), p_email))
  ON CONFLICT (id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), profiles.full_name, EXCLUDED.email),
    updated_at = NOW();

  -- Retornar resultado
  v_result := jsonb_build_object(
    'user_id', p_user_id,
    'action', CASE WHEN v_existed THEN 'updated' ELSE 'created' END,
    'success', true
  );

  RETURN v_result;
END;
$$;

COMMENT ON FUNCTION public.sync_user_profile IS 'Sincroniza profile desde auth.users. Solo admins. SECURITY DEFINER para evitar recursión RLS.';

-- 3. Vista extendida con info de metadata
CREATE OR REPLACE VIEW public.vw_users_extended AS
SELECT
  p.id,
  p.email,
  p.full_name,
  p.phone,
  p.created_at,
  p.updated_at,
  COALESCE(
    ARRAY_AGG(ur.role_name ORDER BY ur.role_name) FILTER (WHERE ur.role_name IS NOT NULL),
    ARRAY[]::text[]
  ) AS roles,
  um.sucursal_id,
  s.nombre AS sucursal_nombre,
  um.fecha_nacimiento
FROM public.profiles p
LEFT JOIN public.user_roles ur ON ur.user_id = p.id
LEFT JOIN public.user_metadata um ON um.user_id = p.id
LEFT JOIN public.sucursales s ON s.id = um.sucursal_id
GROUP BY p.id, p.email, p.full_name, p.phone, p.created_at, p.updated_at, 
         um.sucursal_id, s.nombre, um.fecha_nacimiento;

COMMENT ON VIEW public.vw_users_extended IS 'Vista extendida de usuarios con roles y metadata. Respeta RLS de profiles.';

-- Grant necesario
GRANT SELECT ON public.vw_users_extended TO authenticated;