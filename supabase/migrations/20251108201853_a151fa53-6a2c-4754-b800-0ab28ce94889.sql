-- FASE UI-0: Tablas para Dashboard Corporativo
-- Tabla: corporate_promotions (Promociones Corporativas)
CREATE TABLE corporate_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  imagen_path TEXT, -- path en bucket documents
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: featured_renders (Render del Mes)
CREATE TABLE featured_renders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mes_ano TEXT NOT NULL, -- '2025-11'
  imagen_path TEXT NOT NULL, -- path en bucket project_photos
  titulo TEXT NOT NULL,
  autor TEXT, -- Nombre del arquitecto/diseñador
  proyecto_id UUID REFERENCES projects(id),
  caption TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: company_manuals (Manuales de Operación)
CREATE TABLE company_manuals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  file_path TEXT NOT NULL, -- path en bucket documents
  categoria TEXT, -- 'ventas', 'construccion', 'diseño', 'general'
  visible_para_roles TEXT[] DEFAULT ARRAY['admin', 'colaborador', 'project_manager', 'vendedor'],
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: employee_calendar_events (Calendario de Empleados)
CREATE TABLE employee_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  titulo TEXT NOT NULL,
  descripcion TEXT,
  fecha_inicio TIMESTAMPTZ NOT NULL,
  fecha_fin TIMESTAMPTZ,
  tipo TEXT DEFAULT 'reunion', -- 'reunion', 'vacaciones', 'curso', 'personal'
  proyecto_id UUID REFERENCES projects(id), -- Opcional
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_corporate_promotions_active ON corporate_promotions(active, fecha_inicio, fecha_fin);
CREATE INDEX idx_featured_renders_active ON featured_renders(active, mes_ano);
CREATE INDEX idx_company_manuals_categoria ON company_manuals(categoria);
CREATE INDEX idx_employee_calendar_events_user ON employee_calendar_events(user_id, fecha_inicio);

-- Enable RLS
ALTER TABLE corporate_promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE featured_renders ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_manuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE employee_calendar_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies: corporate_promotions
CREATE POLICY "Todos pueden ver promociones activas"
  ON corporate_promotions FOR SELECT
  USING (active = true OR auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role_name = 'admin'
  ));

CREATE POLICY "Solo admins pueden insertar promociones"
  ON corporate_promotions FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role_name = 'admin'
  ));

CREATE POLICY "Solo admins pueden actualizar promociones"
  ON corporate_promotions FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role_name = 'admin'
  ));

CREATE POLICY "Solo admins pueden eliminar promociones"
  ON corporate_promotions FOR DELETE
  USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role_name = 'admin'
  ));

-- RLS Policies: featured_renders
CREATE POLICY "Todos pueden ver renders activos"
  ON featured_renders FOR SELECT
  USING (active = true OR auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role_name = 'admin'
  ));

CREATE POLICY "Solo admins pueden insertar renders"
  ON featured_renders FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role_name = 'admin'
  ));

CREATE POLICY "Solo admins pueden actualizar renders"
  ON featured_renders FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role_name = 'admin'
  ));

CREATE POLICY "Solo admins pueden eliminar renders"
  ON featured_renders FOR DELETE
  USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role_name = 'admin'
  ));

-- RLS Policies: company_manuals
CREATE POLICY "Usuarios ven manuales según su rol"
  ON company_manuals FOR SELECT
  USING (
    auth.uid() IN (
      SELECT ur.user_id 
      FROM user_roles ur 
      WHERE ur.role_name = ANY(visible_para_roles)
    )
  );

CREATE POLICY "Solo admins pueden insertar manuales"
  ON company_manuals FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role_name = 'admin'
  ));

CREATE POLICY "Solo admins pueden actualizar manuales"
  ON company_manuals FOR UPDATE
  USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role_name = 'admin'
  ));

CREATE POLICY "Solo admins pueden eliminar manuales"
  ON company_manuals FOR DELETE
  USING (auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role_name = 'admin'
  ));

-- RLS Policies: employee_calendar_events
CREATE POLICY "Usuarios ven solo sus eventos"
  ON employee_calendar_events FOR SELECT
  USING (user_id = auth.uid() OR auth.uid() IN (
    SELECT user_id FROM user_roles WHERE role_name = 'admin'
  ));

CREATE POLICY "Usuarios pueden crear sus propios eventos"
  ON employee_calendar_events FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar sus propios eventos"
  ON employee_calendar_events FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Usuarios pueden eliminar sus propios eventos"
  ON employee_calendar_events FOR DELETE
  USING (user_id = auth.uid());

-- Triggers para updated_at
CREATE TRIGGER update_corporate_promotions_updated_at
  BEFORE UPDATE ON corporate_promotions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_featured_renders_updated_at
  BEFORE UPDATE ON featured_renders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_company_manuals_updated_at
  BEFORE UPDATE ON company_manuals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employee_calendar_events_updated_at
  BEFORE UPDATE ON employee_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();