-- Create enum for person type
CREATE TYPE public.person_type AS ENUM ('fisica', 'moral');

-- Create enum for project status
CREATE TYPE public.project_status AS ENUM ('activo', 'cerrado', 'archivado');

-- Create enum for lead status
CREATE TYPE public.lead_status AS ENUM ('nuevo', 'contactado', 'calificado', 'convertido', 'perdido');

-- Create users table (extends profile functionality for business users)
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  sucursal_id UUID REFERENCES public.sucursales(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- Create clients table
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  person_type public.person_type NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  fiscal_json JSONB,
  address_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  sucursal_id UUID REFERENCES public.sucursales(id) ON DELETE SET NULL,
  status public.project_status NOT NULL DEFAULT 'activo',
  ubicacion_json JSONB,
  terreno_m2 NUMERIC,
  notas TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project_members table
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role_en_proyecto TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create leads table
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  contacto_json JSONB,
  origen TEXT,
  sucursal_id UUID REFERENCES public.sucursales(id) ON DELETE SET NULL,
  notas TEXT,
  status public.lead_status NOT NULL DEFAULT 'nuevo',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX idx_users_sucursal ON public.users(sucursal_id);
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_projects_client ON public.projects(client_id);
CREATE INDEX idx_projects_sucursal ON public.projects(sucursal_id);
CREATE INDEX idx_projects_status ON public.projects(status);
CREATE INDEX idx_project_members_project ON public.project_members(project_id);
CREATE INDEX idx_project_members_user ON public.project_members(user_id);
CREATE INDEX idx_leads_client ON public.leads(client_id);
CREATE INDEX idx_leads_sucursal ON public.leads(sucursal_id);
CREATE INDEX idx_leads_status ON public.leads(status);

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();