-- Add contador role to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'contador';

-- Create function to parse CFDI XML and extract metadata
-- Note: This is a placeholder - in production you'd use a proper XML parser
CREATE OR REPLACE FUNCTION public.extract_cfdi_metadata(xml_content TEXT)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  metadata JSONB;
BEGIN
  -- This is a simplified placeholder
  -- In production, you would parse the actual XML structure
  metadata := jsonb_build_object(
    'version', '4.0',
    'serie', NULL,
    'folio_number', NULL,
    'fecha_emision', NULL,
    'tipo_comprobante', NULL,
    'forma_pago', NULL,
    'metodo_pago', NULL,
    'moneda', 'MXN',
    'tipo_cambio', 1,
    'subtotal', 0,
    'descuento', 0,
    'total', 0,
    'impuestos_trasladados', 0,
    'impuestos_retenidos', 0,
    'emisor', jsonb_build_object(
      'rfc', NULL,
      'nombre', NULL,
      'regimen_fiscal', NULL
    ),
    'receptor', jsonb_build_object(
      'rfc', NULL,
      'nombre', NULL,
      'uso_cfdi', NULL,
      'domicilio_fiscal', NULL,
      'regimen_fiscal', NULL
    ),
    'conceptos', jsonb_build_array(),
    'timbre_fiscal', jsonb_build_object(
      'uuid', NULL,
      'fecha_timbrado', NULL,
      'sello_sat', NULL,
      'no_certificado_sat', NULL
    )
  );
  
  RETURN metadata;
END;
$$;

-- Add storage bucket for CFDI files
INSERT INTO storage.buckets (id, name, public)
VALUES ('cfdi', 'cfdi', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for CFDI bucket
CREATE POLICY "Authenticated users can view CFDI files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cfdi' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can upload CFDI files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'cfdi' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete CFDI files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'cfdi' AND auth.uid() IS NOT NULL);

-- Add xml_url field to invoices table
ALTER TABLE public.invoices ADD COLUMN IF NOT EXISTS xml_url TEXT;

-- Function to get accounts receivable (cuentas por cobrar)
CREATE OR REPLACE FUNCTION public.get_accounts_receivable()
RETURNS TABLE(
  client_id UUID,
  client_name TEXT,
  total_invoiced NUMERIC,
  total_paid NUMERIC,
  balance NUMERIC,
  oldest_invoice_date DATE
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.receptor_id as client_id,
    c.name as client_name,
    COALESCE(SUM(i.total_amount), 0) as total_invoiced,
    COALESCE(SUM(
      (SELECT COALESCE(SUM(ip.amount), 0)
       FROM public.invoice_payments ip
       WHERE ip.invoice_id = i.id)
    ), 0) as total_paid,
    COALESCE(SUM(i.total_amount), 0) - COALESCE(SUM(
      (SELECT COALESCE(SUM(ip.amount), 0)
       FROM public.invoice_payments ip
       WHERE ip.invoice_id = i.id)
    ), 0) as balance,
    MIN(i.issued_at) as oldest_invoice_date
  FROM public.invoices i
  LEFT JOIN public.clients c ON c.id = i.receptor_id
  WHERE i.tipo = 'ingreso'
    AND i.paid = false
  GROUP BY i.receptor_id, c.name
  HAVING COALESCE(SUM(i.total_amount), 0) - COALESCE(SUM(
    (SELECT COALESCE(SUM(ip.amount), 0)
     FROM public.invoice_payments ip
     WHERE ip.invoice_id = i.id)
  ), 0) > 0;
END;
$$;

-- Function to get accounts payable (cuentas por pagar)
CREATE OR REPLACE FUNCTION public.get_accounts_payable()
RETURNS TABLE(
  provider_id UUID,
  provider_name TEXT,
  total_invoiced NUMERIC,
  total_paid NUMERIC,
  balance NUMERIC,
  oldest_invoice_date DATE
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    i.emisor_id as provider_id,
    p.name as provider_name,
    COALESCE(SUM(i.total_amount), 0) as total_invoiced,
    COALESCE(SUM(
      (SELECT COALESCE(SUM(ip.amount), 0)
       FROM public.invoice_payments ip
       WHERE ip.invoice_id = i.id)
    ), 0) as total_paid,
    COALESCE(SUM(i.total_amount), 0) - COALESCE(SUM(
      (SELECT COALESCE(SUM(ip.amount), 0)
       FROM public.invoice_payments ip
       WHERE ip.invoice_id = i.id)
    ), 0) as balance,
    MIN(i.issued_at) as oldest_invoice_date
  FROM public.invoices i
  LEFT JOIN public.providers p ON p.id = i.emisor_id
  WHERE i.tipo = 'egreso'
    AND i.paid = false
  GROUP BY i.emisor_id, p.name
  HAVING COALESCE(SUM(i.total_amount), 0) - COALESCE(SUM(
    (SELECT COALESCE(SUM(ip.amount), 0)
     FROM public.invoice_payments ip
     WHERE ip.invoice_id = i.id)
  ), 0) > 0;
END;
$$;