-- ========================================
-- BLOQUE 2: CRM Module Tables
-- ========================================
-- Creates: accounts, contacts, opportunities, tasks, crm_activities, units, crm_attachments
-- RLS: Same pattern as leads (admin all, module permissions for collaborators)

-- 1. ACCOUNTS (Companies/Organizations)
CREATE TABLE IF NOT EXISTS public.accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  account_type TEXT CHECK (account_type IN ('prospecto', 'cliente', 'proveedor', 'socio')) DEFAULT 'prospecto',
  industry TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  billing_address_json JSONB DEFAULT '{}',
  shipping_address_json JSONB DEFAULT '{}',
  tax_id TEXT, -- RFC or tax ID
  notes TEXT,
  sucursal_id UUID REFERENCES public.sucursales(id) ON DELETE SET NULL,
  owner_id UUID, -- assigned user
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_owner ON public.accounts(owner_id);
CREATE INDEX idx_accounts_type ON public.accounts(account_type);
CREATE INDEX idx_accounts_name ON public.accounts(name);

-- RLS for accounts
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_accounts ON public.accounts FOR ALL
  USING (current_user_has_role('admin'))
  WITH CHECK (current_user_has_role('admin'));

CREATE POLICY collaborator_view_accounts ON public.accounts FOR SELECT
  USING (user_has_module_permission(auth.uid(), 'crm', 'view'));

CREATE POLICY collaborator_create_accounts ON public.accounts FOR INSERT
  WITH CHECK (user_has_module_permission(auth.uid(), 'crm', 'create'));

CREATE POLICY collaborator_update_accounts ON public.accounts FOR UPDATE
  USING (user_has_module_permission(auth.uid(), 'crm', 'edit'))
  WITH CHECK (user_has_module_permission(auth.uid(), 'crm', 'edit'));

CREATE POLICY collaborator_delete_accounts ON public.accounts FOR DELETE
  USING (user_has_module_permission(auth.uid(), 'crm', 'delete'));

-- 2. CONTACTS (People associated with Accounts)
CREATE TABLE IF NOT EXISTS public.contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES public.accounts(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  job_title TEXT,
  email TEXT,
  phone TEXT,
  mobile TEXT,
  birthdate DATE,
  notes TEXT,
  owner_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contacts_account ON public.contacts(account_id);
CREATE INDEX idx_contacts_name ON public.contacts(first_name, last_name);
CREATE INDEX idx_contacts_email ON public.contacts(email);

-- RLS for contacts
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_contacts ON public.contacts FOR ALL
  USING (current_user_has_role('admin'))
  WITH CHECK (current_user_has_role('admin'));

CREATE POLICY collaborator_view_contacts ON public.contacts FOR SELECT
  USING (user_has_module_permission(auth.uid(), 'crm', 'view'));

CREATE POLICY collaborator_create_contacts ON public.contacts FOR INSERT
  WITH CHECK (user_has_module_permission(auth.uid(), 'crm', 'create'));

CREATE POLICY collaborator_update_contacts ON public.contacts FOR UPDATE
  USING (user_has_module_permission(auth.uid(), 'crm', 'edit'))
  WITH CHECK (user_has_module_permission(auth.uid(), 'crm', 'edit'));

CREATE POLICY collaborator_delete_contacts ON public.contacts FOR DELETE
  USING (user_has_module_permission(auth.uid(), 'crm', 'delete'));

-- 3. OPPORTUNITIES (Sales opportunities)
CREATE TABLE IF NOT EXISTS public.opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folio TEXT UNIQUE NOT NULL, -- Auto-generated OPP-YYYYMM-XXX
  name TEXT NOT NULL,
  account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  stage TEXT CHECK (stage IN ('prospecto', 'calificado', 'propuesta', 'negociacion', 'ganado', 'perdido')) DEFAULT 'prospecto',
  amount NUMERIC(15, 2),
  probability INTEGER CHECK (probability >= 0 AND probability <= 100) DEFAULT 0,
  expected_close_date DATE,
  closed_date DATE,
  notes TEXT,
  loss_reason TEXT,
  owner_id UUID,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_opportunities_account ON public.opportunities(account_id);
CREATE INDEX idx_opportunities_stage ON public.opportunities(stage);
CREATE INDEX idx_opportunities_folio ON public.opportunities(folio);
CREATE INDEX idx_opportunities_close_date ON public.opportunities(expected_close_date);

-- RLS for opportunities
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_opportunities ON public.opportunities FOR ALL
  USING (current_user_has_role('admin'))
  WITH CHECK (current_user_has_role('admin'));

CREATE POLICY collaborator_view_opportunities ON public.opportunities FOR SELECT
  USING (user_has_module_permission(auth.uid(), 'crm', 'view'));

CREATE POLICY collaborator_create_opportunities ON public.opportunities FOR INSERT
  WITH CHECK (user_has_module_permission(auth.uid(), 'crm', 'create'));

CREATE POLICY collaborator_update_opportunities ON public.opportunities FOR UPDATE
  USING (user_has_module_permission(auth.uid(), 'crm', 'edit'))
  WITH CHECK (user_has_module_permission(auth.uid(), 'crm', 'edit'));

CREATE POLICY collaborator_delete_opportunities ON public.opportunities FOR DELETE
  USING (user_has_module_permission(auth.uid(), 'crm', 'delete'));

-- 4. UNITS (Inventory/Units for opportunities)
CREATE TABLE IF NOT EXISTS public.units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_number TEXT NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  unit_type TEXT CHECK (unit_type IN ('casa', 'departamento', 'local', 'terreno', 'otro')) DEFAULT 'casa',
  area_m2 NUMERIC(10, 2),
  bedrooms INTEGER,
  bathrooms NUMERIC(3, 1),
  price NUMERIC(15, 2),
  status TEXT CHECK (status IN ('disponible', 'reservado', 'vendido', 'bloqueado')) DEFAULT 'disponible',
  floor_number INTEGER,
  parking_spaces INTEGER DEFAULT 0,
  amenities_json JSONB DEFAULT '{}',
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(project_id, unit_number)
);

CREATE INDEX idx_units_project ON public.units(project_id);
CREATE INDEX idx_units_status ON public.units(status);
CREATE INDEX idx_units_type ON public.units(unit_type);

-- RLS for units
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_units ON public.units FOR ALL
  USING (current_user_has_role('admin'))
  WITH CHECK (current_user_has_role('admin'));

CREATE POLICY collaborator_view_units ON public.units FOR SELECT
  USING (user_has_module_permission(auth.uid(), 'crm', 'view'));

CREATE POLICY collaborator_create_units ON public.units FOR INSERT
  WITH CHECK (user_has_module_permission(auth.uid(), 'crm', 'create'));

CREATE POLICY collaborator_update_units ON public.units FOR UPDATE
  USING (user_has_module_permission(auth.uid(), 'crm', 'edit'))
  WITH CHECK (user_has_module_permission(auth.uid(), 'crm', 'edit'));

CREATE POLICY collaborator_delete_units ON public.units FOR DELETE
  USING (user_has_module_permission(auth.uid(), 'crm', 'delete'));

-- 5. OPPORTUNITY_UNITS (Many-to-many relationship)
CREATE TABLE IF NOT EXISTS public.opportunity_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id UUID NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(opportunity_id, unit_id)
);

CREATE INDEX idx_opportunity_units_opp ON public.opportunity_units(opportunity_id);
CREATE INDEX idx_opportunity_units_unit ON public.opportunity_units(unit_id);

-- RLS for opportunity_units
ALTER TABLE public.opportunity_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_opportunity_units ON public.opportunity_units FOR ALL
  USING (current_user_has_role('admin'))
  WITH CHECK (current_user_has_role('admin'));

CREATE POLICY collaborator_view_opportunity_units ON public.opportunity_units FOR SELECT
  USING (user_has_module_permission(auth.uid(), 'crm', 'view'));

CREATE POLICY collaborator_manage_opportunity_units ON public.opportunity_units FOR ALL
  USING (user_has_module_permission(auth.uid(), 'crm', 'edit'))
  WITH CHECK (user_has_module_permission(auth.uid(), 'crm', 'edit'));

-- 6. TASKS (Follow-up tasks)
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject TEXT NOT NULL,
  description TEXT,
  due_date DATE,
  priority TEXT CHECK (priority IN ('baja', 'media', 'alta', 'urgente')) DEFAULT 'media',
  status TEXT CHECK (status IN ('pendiente', 'en_progreso', 'completada', 'cancelada')) DEFAULT 'pendiente',
  assigned_to UUID, -- user
  related_to_type TEXT CHECK (related_to_type IN ('lead', 'account', 'contact', 'opportunity')),
  related_to_id UUID,
  completed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tasks_assigned ON public.tasks(assigned_to);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_due_date ON public.tasks(due_date);
CREATE INDEX idx_tasks_related ON public.tasks(related_to_type, related_to_id);

-- RLS for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_tasks ON public.tasks FOR ALL
  USING (current_user_has_role('admin'))
  WITH CHECK (current_user_has_role('admin'));

CREATE POLICY collaborator_view_tasks ON public.tasks FOR SELECT
  USING (user_has_module_permission(auth.uid(), 'crm', 'view') OR assigned_to = auth.uid());

CREATE POLICY collaborator_create_tasks ON public.tasks FOR INSERT
  WITH CHECK (user_has_module_permission(auth.uid(), 'crm', 'create'));

CREATE POLICY collaborator_update_tasks ON public.tasks FOR UPDATE
  USING (user_has_module_permission(auth.uid(), 'crm', 'edit') OR assigned_to = auth.uid())
  WITH CHECK (user_has_module_permission(auth.uid(), 'crm', 'edit') OR assigned_to = auth.uid());

CREATE POLICY collaborator_delete_tasks ON public.tasks FOR DELETE
  USING (user_has_module_permission(auth.uid(), 'crm', 'delete'));

-- 7. CRM_ACTIVITIES (Activity log for audit)
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL CHECK (activity_type IN ('created', 'updated', 'deleted', 'status_changed', 'note_added', 'email_sent', 'call_made', 'meeting_held')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'account', 'contact', 'opportunity', 'task')),
  entity_id UUID NOT NULL,
  description TEXT NOT NULL,
  metadata_json JSONB DEFAULT '{}',
  performed_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crm_activities_entity ON public.crm_activities(entity_type, entity_id);
CREATE INDEX idx_crm_activities_user ON public.crm_activities(performed_by);
CREATE INDEX idx_crm_activities_created ON public.crm_activities(created_at DESC);

-- RLS for crm_activities
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_crm_activities ON public.crm_activities FOR ALL
  USING (current_user_has_role('admin'))
  WITH CHECK (current_user_has_role('admin'));

CREATE POLICY collaborator_view_crm_activities ON public.crm_activities FOR SELECT
  USING (user_has_module_permission(auth.uid(), 'crm', 'view'));

CREATE POLICY system_insert_crm_activities ON public.crm_activities FOR INSERT
  WITH CHECK (true); -- Allow inserts from triggers

-- 8. CRM_ATTACHMENTS (File attachments for CRM entities)
CREATE TABLE IF NOT EXISTS public.crm_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('lead', 'account', 'contact', 'opportunity', 'task')),
  entity_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL, -- Relative path in bucket
  file_type TEXT,
  file_size INTEGER,
  notes TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_crm_attachments_entity ON public.crm_attachments(entity_type, entity_id);

-- RLS for crm_attachments
ALTER TABLE public.crm_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_all_crm_attachments ON public.crm_attachments FOR ALL
  USING (current_user_has_role('admin'))
  WITH CHECK (current_user_has_role('admin'));

CREATE POLICY collaborator_view_crm_attachments ON public.crm_attachments FOR SELECT
  USING (user_has_module_permission(auth.uid(), 'crm', 'view'));

CREATE POLICY collaborator_manage_crm_attachments ON public.crm_attachments FOR INSERT
  WITH CHECK (user_has_module_permission(auth.uid(), 'crm', 'create'));

CREATE POLICY collaborator_delete_crm_attachments ON public.crm_attachments FOR DELETE
  USING (user_has_module_permission(auth.uid(), 'crm', 'delete'));

-- 9. Create storage bucket for CRM attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('crm-attachments', 'crm-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for crm-attachments bucket
CREATE POLICY "CRM users can view attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'crm-attachments' AND
    user_has_module_permission(auth.uid(), 'crm', 'view')
  );

CREATE POLICY "CRM users can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'crm-attachments' AND
    user_has_module_permission(auth.uid(), 'crm', 'create')
  );

CREATE POLICY "CRM users can delete attachments"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'crm-attachments' AND
    user_has_module_permission(auth.uid(), 'crm', 'delete')
  );

-- 10. Function to auto-generate opportunity folio
CREATE OR REPLACE FUNCTION public.generate_opportunity_folio()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  year_month TEXT;
  next_num INTEGER;
  new_folio TEXT;
BEGIN
  -- Format: OPP-YYYYMM-XXX
  year_month := TO_CHAR(NOW(), 'YYYYMM');
  
  -- Get next number for this month
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(folio FROM 'OPP-[0-9]{6}-([0-9]+)') AS INTEGER)
  ), 0) + 1
  INTO next_num
  FROM public.opportunities
  WHERE folio LIKE 'OPP-' || year_month || '-%';
  
  new_folio := 'OPP-' || year_month || '-' || LPAD(next_num::TEXT, 3, '0');
  NEW.folio := new_folio;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_generate_opportunity_folio
  BEFORE INSERT ON public.opportunities
  FOR EACH ROW
  WHEN (NEW.folio IS NULL OR NEW.folio = '')
  EXECUTE FUNCTION public.generate_opportunity_folio();

-- 11. Function to log CRM activities automatically
CREATE OR REPLACE FUNCTION public.log_crm_activity()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  entity_type_val TEXT;
  activity_type_val TEXT;
  description_val TEXT;
  user_id UUID;
BEGIN
  -- Get entity type from table name
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
    -- Log status changes specifically
    IF (TG_TABLE_NAME = 'opportunities' AND OLD.stage IS DISTINCT FROM NEW.stage) THEN
      activity_type_val := 'status_changed';
      description_val := 'Cambió stage de "' || OLD.stage || '" a "' || NEW.stage || '"';
    ELSIF (TG_TABLE_NAME = 'tasks' AND OLD.status IS DISTINCT FROM NEW.status) THEN
      activity_type_val := 'status_changed';
      description_val := 'Cambió status de "' || OLD.status || '" a "' || NEW.status || '"';
    ELSIF (TG_TABLE_NAME = 'leads' AND OLD.status IS DISTINCT FROM NEW.status) THEN
      activity_type_val := 'status_changed';
      description_val := 'Cambió status de "' || OLD.status || '" a "' || NEW.status || '"';
    ELSE
      activity_type_val := 'updated';
      description_val := 'Actualizó ' || entity_type_val;
    END IF;
    
    INSERT INTO public.crm_activities (activity_type, entity_type, entity_id, description, performed_by)
    VALUES (activity_type_val, entity_type_val, NEW.id, description_val, user_id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for activity logging
CREATE TRIGGER trg_log_account_activity
  AFTER INSERT OR UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_crm_activity();

CREATE TRIGGER trg_log_contact_activity
  AFTER INSERT OR UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.log_crm_activity();

CREATE TRIGGER trg_log_opportunity_activity
  AFTER INSERT OR UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.log_crm_activity();

CREATE TRIGGER trg_log_task_activity
  AFTER INSERT OR UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.log_crm_activity();

-- Also add trigger to leads (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'trg_log_lead_activity'
  ) THEN
    CREATE TRIGGER trg_log_lead_activity
      AFTER INSERT OR UPDATE ON public.leads
      FOR EACH ROW
      EXECUTE FUNCTION public.log_crm_activity();
  END IF;
END $$;

-- 12. Update updated_at timestamps automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers to all CRM tables
CREATE TRIGGER trg_update_accounts_updated_at
  BEFORE UPDATE ON public.accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_update_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_update_opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_update_units_updated_at
  BEFORE UPDATE ON public.units
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();