-- Create enum for gantt plan types
CREATE TYPE gantt_type AS ENUM ('parametrico', 'ejecutivo');

-- Create gantt_plans table
CREATE TABLE public.gantt_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  type gantt_type NOT NULL,
  shared_with_construction BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gantt_items table
CREATE TABLE public.gantt_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gantt_id UUID NOT NULL REFERENCES public.gantt_plans(id) ON DELETE CASCADE,
  major_id UUID NOT NULL REFERENCES public.tu_nodes(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create gantt_ministrations table
CREATE TABLE public.gantt_ministrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  gantt_id UUID NOT NULL REFERENCES public.gantt_plans(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  label TEXT NOT NULL,
  alcance TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_gantt_plans_project ON public.gantt_plans(project_id);
CREATE INDEX idx_gantt_items_gantt ON public.gantt_items(gantt_id);
CREATE INDEX idx_gantt_ministrations_gantt ON public.gantt_ministrations(gantt_id);

-- Enable RLS
ALTER TABLE public.gantt_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gantt_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gantt_ministrations ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for gantt_plans
CREATE POLICY "Everyone can view gantt plans"
  ON public.gantt_plans FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert gantt plans"
  ON public.gantt_plans FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update gantt plans"
  ON public.gantt_plans FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete gantt plans"
  ON public.gantt_plans FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create RLS policies for gantt_items
CREATE POLICY "Everyone can view gantt items"
  ON public.gantt_items FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert gantt items"
  ON public.gantt_items FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update gantt items"
  ON public.gantt_items FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete gantt items"
  ON public.gantt_items FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create RLS policies for gantt_ministrations
CREATE POLICY "Everyone can view gantt ministrations"
  ON public.gantt_ministrations FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert gantt ministrations"
  ON public.gantt_ministrations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update gantt ministrations"
  ON public.gantt_ministrations FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete gantt ministrations"
  ON public.gantt_ministrations FOR DELETE
  USING (auth.uid() IS NOT NULL);