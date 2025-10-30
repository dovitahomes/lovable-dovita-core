-- Verificar y adaptar bank_accounts existente
-- Solo agregar columnas si no existen
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'bank_accounts' 
                 AND column_name = 'bank_name') THEN
    ALTER TABLE public.bank_accounts ADD COLUMN bank_name TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'bank_accounts' 
                 AND column_name = 'account_alias') THEN
    ALTER TABLE public.bank_accounts ADD COLUMN account_alias TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'bank_accounts' 
                 AND column_name = 'clabe') THEN
    ALTER TABLE public.bank_accounts ADD COLUMN clabe TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_schema = 'public' 
                 AND table_name = 'bank_accounts' 
                 AND column_name = 'currency') THEN
    ALTER TABLE public.bank_accounts ADD COLUMN currency TEXT DEFAULT 'MXN';
  END IF;
END $$;

-- Lotes de pagos (crear solo si no existe)
CREATE TABLE IF NOT EXISTS public.pay_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_account_id UUID REFERENCES public.bank_accounts(id),
  title TEXT,
  scheduled_date DATE,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'borrador' CHECK (status IN ('borrador', 'programado', 'pagado', 'cancelado')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pagos individuales (crear solo si no existe)
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pay_batch_id UUID REFERENCES public.pay_batches(id) ON DELETE CASCADE,
  proveedor_id UUID NOT NULL REFERENCES public.providers(id),
  po_id UUID REFERENCES public.purchase_orders(id),
  amount NUMERIC(18,4) NOT NULL,
  currency TEXT DEFAULT 'MXN' CHECK (currency IN ('MXN', 'USD', 'EUR')),
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado', 'cancelado')),
  transfer_date TIMESTAMPTZ,
  reference TEXT,
  evidence_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pay_batches_status ON public.pay_batches(status);
CREATE INDEX IF NOT EXISTS idx_pay_batches_scheduled ON public.pay_batches(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_payments_batch ON public.payments(pay_batch_id);
CREATE INDEX IF NOT EXISTS idx_payments_proveedor ON public.payments(proveedor_id);
CREATE INDEX IF NOT EXISTS idx_payments_po ON public.payments(po_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- Triggers
DROP TRIGGER IF EXISTS trg_pay_batches_upd ON public.pay_batches;
CREATE TRIGGER trg_pay_batches_upd
  BEFORE UPDATE ON public.pay_batches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_payments_upd ON public.payments;
CREATE TRIGGER trg_payments_upd
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();