-- Create enums
CREATE TYPE transaction_type AS ENUM ('ingreso', 'egreso');
CREATE TYPE invoice_type AS ENUM ('ingreso', 'egreso');
CREATE TYPE payment_method AS ENUM ('PUE', 'PPD');
CREATE TYPE currency_type AS ENUM ('MXN', 'USD', 'EUR');

-- Create banks table
CREATE TABLE public.banks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bank_accounts table
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_id UUID NOT NULL REFERENCES public.banks(id),
  numero_cuenta TEXT NOT NULL UNIQUE,
  tipo_cuenta TEXT,
  moneda currency_type NOT NULL DEFAULT 'MXN',
  saldo_actual NUMERIC DEFAULT 0,
  activa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoices (CFDI) table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  emisor_id UUID REFERENCES public.providers(id),
  receptor_id UUID REFERENCES public.clients(id),
  tipo invoice_type NOT NULL,
  metodo_pago payment_method NOT NULL,
  folio TEXT,
  uuid TEXT UNIQUE,
  issued_at DATE NOT NULL,
  total_amount NUMERIC NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT false,
  meta_json JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES public.bank_accounts(id),
  type transaction_type NOT NULL,
  project_id UUID REFERENCES public.projects(id),
  provider_id UUID REFERENCES public.providers(id),
  client_id UUID REFERENCES public.clients(id),
  purchase_order_id UUID REFERENCES public.purchase_orders(id),
  amount NUMERIC NOT NULL,
  currency currency_type NOT NULL DEFAULT 'MXN',
  date DATE NOT NULL,
  cfdi_id UUID REFERENCES public.invoices(id),
  concept TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create invoice_payments table (complementos de pago)
CREATE TABLE public.invoice_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES public.transactions(id),
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create finance config table
CREATE TABLE public.finance_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  oc_grouping_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default config
INSERT INTO public.finance_config (oc_grouping_enabled) VALUES (true);

-- Create indexes
CREATE INDEX idx_bank_accounts_bank ON public.bank_accounts(bank_id);
CREATE INDEX idx_transactions_account ON public.transactions(account_id);
CREATE INDEX idx_transactions_type ON public.transactions(type);
CREATE INDEX idx_transactions_date ON public.transactions(date);
CREATE INDEX idx_transactions_project ON public.transactions(project_id);
CREATE INDEX idx_invoices_emisor ON public.invoices(emisor_id);
CREATE INDEX idx_invoices_receptor ON public.invoices(receptor_id);
CREATE INDEX idx_invoices_paid ON public.invoices(paid);
CREATE INDEX idx_invoice_payments_invoice ON public.invoice_payments(invoice_id);

-- Enable RLS
ALTER TABLE public.banks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Everyone can view banks" ON public.banks FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage banks" ON public.banks FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Everyone can view bank accounts" ON public.bank_accounts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage bank accounts" ON public.bank_accounts FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Everyone can view invoices" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage invoices" ON public.invoices FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Everyone can view transactions" ON public.transactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage transactions" ON public.transactions FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Everyone can view invoice payments" ON public.invoice_payments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can manage invoice payments" ON public.invoice_payments FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Everyone can view finance config" ON public.finance_config FOR SELECT USING (true);
CREATE POLICY "Admins can manage finance config" ON public.finance_config FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers
CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON public.bank_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get provider balance
CREATE OR REPLACE FUNCTION public.get_provider_balance(p_provider_id UUID)
RETURNS TABLE(
  total_invoiced NUMERIC,
  total_paid NUMERIC,
  balance NUMERIC
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(SUM(i.total_amount), 0) as total_invoiced,
    COALESCE(SUM(t.amount), 0) as total_paid,
    COALESCE(SUM(i.total_amount), 0) - COALESCE(SUM(t.amount), 0) as balance
  FROM public.invoices i
  LEFT JOIN public.transactions t ON t.cfdi_id = i.id
  WHERE i.emisor_id = p_provider_id
    AND i.tipo = 'egreso';
END;
$$;