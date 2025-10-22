-- Create user permissions table for granular access control
CREATE TABLE public.user_module_permissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_name TEXT NOT NULL,
  can_view BOOLEAN NOT NULL DEFAULT false,
  can_create BOOLEAN NOT NULL DEFAULT false,
  can_edit BOOLEAN NOT NULL DEFAULT false,
  can_delete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, module_name)
);

ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;

-- Admins can manage permissions
CREATE POLICY "Admins can manage user permissions"
ON public.user_module_permissions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own permissions
CREATE POLICY "Users can view their own permissions"
ON public.user_module_permissions FOR SELECT
USING (auth.uid() = user_id);

-- Update RLS for projects - colaboradores can see assigned projects, clientes their own
DROP POLICY IF EXISTS "Everyone can view projects" ON public.projects;

CREATE POLICY "Users can view projects"
ON public.projects FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  -- Colaboradores see assigned projects
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = projects.id AND pm.user_id = auth.uid()
  ) OR
  -- Clientes see their own projects
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = projects.client_id 
    AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Budget items - hide unit costs from clients
DROP POLICY IF EXISTS "Everyone can view budget items" ON public.budget_items;

CREATE POLICY "Users can view budget items"
ON public.budget_items FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  -- Colaboradores see items from their projects
  EXISTS (
    SELECT 1 FROM public.budgets b
    JOIN public.project_members pm ON pm.project_id = b.project_id
    WHERE b.id = budget_items.budget_id AND pm.user_id = auth.uid()
  ) OR
  -- Clientes see items but will have costs filtered in app layer
  EXISTS (
    SELECT 1 FROM public.budgets b
    JOIN public.projects p ON p.id = b.project_id
    JOIN public.clients c ON c.id = p.client_id
    WHERE b.id = budget_items.budget_id 
    AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND b.cliente_view_enabled = true
  )
);

-- Documents - filter by visibility
DROP POLICY IF EXISTS "Everyone can view documents" ON public.documents;

CREATE POLICY "Users can view documents"
ON public.documents FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  -- Colaboradores see all documents from their projects
  (visibilidad IN ('interno', 'cliente') AND EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = documents.project_id AND pm.user_id = auth.uid()
  )) OR
  -- Clientes only see client-visible documents
  (visibilidad = 'cliente' AND EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.clients c ON c.id = p.client_id
    WHERE p.id = documents.project_id 
    AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ))
);

-- Construction photos - filter by visibility
DROP POLICY IF EXISTS "Everyone can view construction photos" ON public.construction_photos;

CREATE POLICY "Users can view construction photos"
ON public.construction_photos FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  -- Colaboradores see all photos from their projects
  (visibilidad IN ('interno', 'cliente') AND EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = construction_photos.project_id AND pm.user_id = auth.uid()
  )) OR
  -- Clientes only see client-visible photos
  (visibilidad = 'cliente' AND EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.clients c ON c.id = p.client_id
    WHERE p.id = construction_photos.project_id 
    AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ))
);

-- Purchase orders - only internal staff
DROP POLICY IF EXISTS "Everyone can view purchase orders" ON public.purchase_orders;

CREATE POLICY "Staff can view purchase orders"
ON public.purchase_orders FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = purchase_orders.project_id AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Staff can manage purchase orders"
ON public.purchase_orders FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = purchase_orders.project_id AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Staff can update purchase orders"
ON public.purchase_orders FOR UPDATE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = purchase_orders.project_id AND pm.user_id = auth.uid()
  )
);

CREATE POLICY "Staff can delete purchase orders"
ON public.purchase_orders FOR DELETE
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = purchase_orders.project_id AND pm.user_id = auth.uid()
  )
);

-- Transactions - only staff and contador
DROP POLICY IF EXISTS "Everyone can view transactions" ON public.transactions;

CREATE POLICY "Staff can view transactions"
ON public.transactions FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'contador'::app_role) OR
  (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = transactions.project_id AND pm.user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Authenticated users can manage transactions" ON public.transactions;

CREATE POLICY "Staff can manage transactions"
ON public.transactions FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'contador'::app_role)
);

-- Invoices - only staff and contador
DROP POLICY IF EXISTS "Everyone can view invoices" ON public.invoices;
DROP POLICY IF EXISTS "Authenticated users can manage invoices" ON public.invoices;

CREATE POLICY "Staff can view invoices"
ON public.invoices FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'contador'::app_role)
);

CREATE POLICY "Staff can manage invoices"
ON public.invoices FOR ALL
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'contador'::app_role)
);

-- Clients table - users can view
DROP POLICY IF EXISTS "Everyone can view clients" ON public.clients;

CREATE POLICY "Users can view clients"
ON public.clients FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'colaborador'::app_role) OR
  -- Clients can see their own record
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Project members - users can see their assignments
DROP POLICY IF EXISTS "Everyone can view project members" ON public.project_members;

CREATE POLICY "Users can view project members"
ON public.project_members FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = project_members.project_id AND pm.user_id = auth.uid()
  )
);

-- Budgets - users can see budgets from their projects
DROP POLICY IF EXISTS "Everyone can view budgets" ON public.budgets;

CREATE POLICY "Users can view budgets"
ON public.budgets FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  -- Colaboradores see budgets from their projects
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = budgets.project_id AND pm.user_id = auth.uid()
  ) OR
  -- Clientes see client-enabled budgets
  (cliente_view_enabled = true AND EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.clients c ON c.id = p.client_id
    WHERE p.id = budgets.project_id 
    AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ))
);

-- Leads - only staff
DROP POLICY IF EXISTS "Everyone can view leads" ON public.leads;

CREATE POLICY "Staff can view leads"
ON public.leads FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'colaborador'::app_role)
);

-- Providers - only staff  
DROP POLICY IF EXISTS "Everyone can view providers" ON public.providers;

CREATE POLICY "Staff can view providers"
ON public.providers FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  has_role(auth.uid(), 'colaborador'::app_role)
);

-- Users table - admins and own record
DROP POLICY IF EXISTS "Everyone can view users" ON public.users;

CREATE POLICY "Users can view user records"
ON public.users FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  profile_id = auth.uid()
);

-- Wishlists - users can see wishlists from their projects
DROP POLICY IF EXISTS "Everyone can view wishlists" ON public.wishlists;

CREATE POLICY "Users can view wishlists"
ON public.wishlists FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = wishlists.project_id AND pm.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.clients c ON c.id = p.client_id
    WHERE p.id = wishlists.project_id 
    AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Gantt plans - users can see plans from their projects
DROP POLICY IF EXISTS "Everyone can view gantt plans" ON public.gantt_plans;

CREATE POLICY "Users can view gantt plans"
ON public.gantt_plans FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role) OR
  EXISTS (
    SELECT 1 FROM public.project_members pm
    WHERE pm.project_id = gantt_plans.project_id AND pm.user_id = auth.uid()
  ) OR
  (shared_with_construction = true AND EXISTS (
    SELECT 1 FROM public.projects p
    JOIN public.clients c ON c.id = p.client_id
    WHERE p.id = gantt_plans.project_id 
    AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  ))
);

-- Create trigger for user_module_permissions
CREATE TRIGGER update_user_module_permissions_updated_at
BEFORE UPDATE ON public.user_module_permissions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();