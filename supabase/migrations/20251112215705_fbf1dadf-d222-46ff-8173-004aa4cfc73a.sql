-- Create commission_receipts storage bucket for payment receipts
INSERT INTO storage.buckets (id, name, public)
VALUES ('commission_receipts', 'commission_receipts', false);

-- RLS policies for commission_receipts bucket
CREATE POLICY "Admin y comisiones pueden ver comprobantes"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'commission_receipts' AND
  (current_user_has_role('admin') OR user_has_module_permission(auth.uid(), 'comisiones', 'view'))
);

CREATE POLICY "Admin y comisiones pueden subir comprobantes"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'commission_receipts' AND
  (current_user_has_role('admin') OR user_has_module_permission(auth.uid(), 'comisiones', 'create'))
);

CREATE POLICY "Admin puede eliminar comprobantes"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'commission_receipts' AND
  current_user_has_role('admin')
);

-- Add payment details columns to commissions table
ALTER TABLE commissions
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS receipt_url TEXT;

-- Create index for payment queries
CREATE INDEX IF NOT EXISTS idx_commissions_payment_date ON commissions(payment_date);

-- Add comment
COMMENT ON COLUMN commissions.receipt_url IS 'URL of payment receipt/proof stored in commission_receipts bucket';