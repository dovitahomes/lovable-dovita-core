-- ========================================
-- Tabla bank_transactions: Movimientos bancarios
-- ========================================

create table if not exists public.bank_transactions (
  id uuid primary key default gen_random_uuid(),
  bank_account_id uuid references public.bank_accounts(id) on delete cascade,
  date date not null,
  description text,
  amount numeric(14,2) not null,
  type text check (type in ('ingreso','egreso')) not null,
  reference text,
  reconciled boolean default false,
  reconciled_with uuid references public.invoices(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ========================================
-- Tabla payment_batch_items: Items de lotes de pago
-- ========================================

create table if not exists public.payment_batch_items (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references public.pay_batches(id) on delete cascade,
  invoice_id uuid references public.invoices(id) on delete cascade,
  amount numeric(14,2) not null,
  created_at timestamptz default now(),
  unique(batch_id, invoice_id)
);

-- ========================================
-- Vista v_bank_reconciliation: Conciliación bancaria automática
-- ========================================

create or replace view public.v_bank_reconciliation as
select 
  t.id as transaction_id,
  t.bank_account_id,
  ba.numero_cuenta,
  b.nombre as bank_name,
  t.date,
  t.description,
  t.amount,
  t.type,
  t.reference,
  t.reconciled,
  i.id as invoice_id,
  i.uuid as uuid_cfdi,
  i.total_amount as invoice_total,
  i.emisor_id,
  p.name as supplier_name,
  abs(t.amount - i.total_amount) as diff,
  case 
    when abs(t.amount - i.total_amount) < 1 then true 
    else false 
  end as reconciled_exact
from public.bank_transactions t
left join public.bank_accounts ba on t.bank_account_id = ba.id
left join public.banks b on ba.bank_id = b.id
left join public.invoices i on 
  abs(t.amount - i.total_amount) < 1 
  and t.type = 'egreso' 
  and i.tipo = 'egreso'
  and not i.paid
left join public.providers p on i.emisor_id = p.id
order by t.date desc;

-- ========================================
-- Vista v_payment_batch_summary: Resumen de lotes de pago
-- ========================================

create or replace view public.v_payment_batch_summary as
select
  pb.id as batch_id,
  pb.title,
  pb.status,
  pb.scheduled_date,
  pb.bank_account_id,
  ba.numero_cuenta,
  b.nombre as bank_name,
  count(distinct pbi.invoice_id) as invoice_count,
  coalesce(sum(pbi.amount), 0) as total_amount,
  pb.created_at
from public.pay_batches pb
left join public.bank_accounts ba on pb.bank_account_id = ba.id
left join public.banks b on ba.bank_id = b.id
left join public.payment_batch_items pbi on pb.id = pbi.batch_id
group by pb.id, pb.title, pb.status, pb.scheduled_date, pb.bank_account_id, ba.numero_cuenta, b.nombre, pb.created_at;

-- ========================================
-- Trigger para actualizar updated_at
-- ========================================

create trigger update_bank_transactions_updated_at
  before update on public.bank_transactions
  for each row
  execute function public.update_updated_at_column();

-- ========================================
-- RLS: Solo documentar, no implementar aún
-- Contadores y finanzas → acceso total
-- Colaboradores → solo lectura
-- Clientes → sin acceso
-- ========================================

comment on table public.bank_transactions is 'Movimientos bancarios. RLS pendiente: contadores/finanzas FULL, colaboradores READ, clientes NO ACCESS';
comment on table public.payment_batch_items is 'Items de lotes de pago. RLS pendiente: contadores/finanzas FULL';
comment on view public.v_bank_reconciliation is 'Vista de conciliación bancaria automática por monto';
comment on view public.v_payment_batch_summary is 'Resumen de lotes de pago con totales';