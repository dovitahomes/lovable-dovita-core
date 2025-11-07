-- Eliminar políticas problemáticas que causan recursión infinita
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON user_roles;
DROP POLICY IF EXISTS "Users can view their own permissions" ON user_permissions;
DROP POLICY IF EXISTS "Admins can manage permissions" ON user_permissions;

-- Crear políticas simples sin recursión para user_roles
-- Los admins pueden ver y modificar roles (sin llamar a current_user_has_role)
CREATE POLICY "Enable read access for all authenticated users"
  ON user_roles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for service role only"
  ON user_roles FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Enable update for service role only"
  ON user_roles FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Enable delete for service role only"
  ON user_roles FOR DELETE
  TO service_role
  USING (true);

-- Crear políticas simples para user_permissions
CREATE POLICY "Enable read access for all authenticated users"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Enable insert for service role only"
  ON user_permissions FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "Enable update for service role only"
  ON user_permissions FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "Enable delete for service role only"
  ON user_permissions FOR DELETE
  TO service_role
  USING (true);

-- Refrescar schema cache
NOTIFY pgrst, 'reload schema';