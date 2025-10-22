-- Create documents table
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE NOT NULL,
  nombre TEXT NOT NULL,
  tipo_carpeta TEXT NOT NULL, -- Cliente, Predio, Licencias, Wishlist, Presupuesto, Contratos, Otro
  etiqueta TEXT,
  visibilidad TEXT NOT NULL CHECK (visibilidad IN ('cliente', 'interno', 'admin')),
  firmado BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for better performance
CREATE INDEX idx_documents_project ON public.documents(project_id);
CREATE INDEX idx_documents_tipo ON public.documents(tipo_carpeta);
CREATE INDEX idx_documents_visibilidad ON public.documents(visibilidad);

-- Add trigger for updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for project documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('documentos', 'documentos', false);

-- Storage policies for documents bucket
CREATE POLICY "Users can upload documents to their projects"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documentos'
);

CREATE POLICY "Users can view documents they have access to"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documentos');

CREATE POLICY "Users can delete their uploaded documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos'
  AND auth.uid() = owner
);

CREATE POLICY "Admins can delete any document"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documentos'
  AND public.has_role(auth.uid(), 'admin')
);