-- Step 1: Enable RLS on critical tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_module_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.construction_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_messages ENABLE ROW LEVEL SECURITY;

-- Step 2: Create RLS policies for user_roles and user_module_permissions
-- Policy for users to view their own roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for admins to view all roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy for admins to manage all roles
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy for users to view their own permissions
DROP POLICY IF EXISTS "Users can view own permissions" ON public.user_module_permissions;
CREATE POLICY "Users can view own permissions"
  ON public.user_module_permissions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy for admins to view all permissions
DROP POLICY IF EXISTS "Admins can view all permissions" ON public.user_module_permissions;
CREATE POLICY "Admins can view all permissions"
  ON public.user_module_permissions
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Policy for admins to manage all permissions
DROP POLICY IF EXISTS "Admins can manage all permissions" ON public.user_module_permissions;
CREATE POLICY "Admins can manage all permissions"
  ON public.user_module_permissions
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Step 3: Assign 'colaborador' role to all existing users without a role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'colaborador'::public.app_role
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = p.id
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Also check if any users in clients table should have 'cliente' role
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'cliente'::public.app_role
FROM public.profiles p
INNER JOIN public.clients c ON c.email = p.email
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = p.id AND ur.role = 'cliente'::public.app_role
)
ON CONFLICT (user_id, role) DO NOTHING;