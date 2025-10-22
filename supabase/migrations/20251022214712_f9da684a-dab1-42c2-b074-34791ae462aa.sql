-- Create providers table
CREATE TABLE public.providers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code_short TEXT NOT NULL UNIQUE CHECK (length(code_short) <= 6 AND code_short ~ '^[A-Z0-9]+$'),
  name TEXT NOT NULL,
  fiscales_json JSONB,
  terms_json JSONB,
  contacto_json JSONB,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for searching
CREATE INDEX idx_providers_name ON public.providers(name);
CREATE INDEX idx_providers_code ON public.providers(code_short);
CREATE INDEX idx_providers_activo ON public.providers(activo);

-- Enable RLS
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Everyone can view providers"
  ON public.providers FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert providers"
  ON public.providers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update providers"
  ON public.providers FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete providers"
  ON public.providers FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Create trigger for updated_at
CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();