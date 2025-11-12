import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Invoice {
  id: string;
  uuid_cfdi: string | null;
  tipo: 'ingreso' | 'egreso';
  emisor_id: string | null;
  receptor_id: string | null;
  project_id: string | null;
  total_amount: number;
  subtotal: number | null;
  iva_amount: number | null;
  issued_at: string;
  paid: boolean;
  folio: string | null;
  xml_path: string | null;
  pdf_path: string | null;
  cfdi_metadata: any;
  metodo_pago: 'PUE' | 'PPD';
  created_at: string;
  updated_at: string;
}

export function useInvoices(filters?: {
  tipo?: 'ingreso' | 'egreso';
  paid?: boolean;
  startDate?: string;
  endDate?: string;
}) {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select(`
          *,
          emisor:providers(id, name, code_short),
          receptor:clients(id, name, email)
        `)
        .order('issued_at', { ascending: false });

      if (filters?.tipo) {
        query = query.eq('tipo', filters.tipo);
      }
      if (filters?.paid !== undefined) {
        query = query.eq('paid', filters.paid);
      }
      if (filters?.startDate) {
        query = query.gte('issued_at', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('issued_at', filters.endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as any[];
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useInvoiceStats() {
  return useQuery({
    queryKey: ['invoice-stats'],
    queryFn: async () => {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('tipo, total_amount, paid, issued_at');

      if (error) throw error;

      const now = new Date();
      
      // Cuentas por cobrar (AR - Accounts Receivable)
      const totalCobrar = (invoices || [])
        .filter(inv => inv.tipo === 'ingreso' && !inv.paid)
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      // Cuentas por pagar (AP - Accounts Payable)
      const totalPagar = (invoices || [])
        .filter(inv => inv.tipo === 'egreso' && !inv.paid)
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      // Facturado del mes
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const facturadoMes = (invoices || [])
        .filter(inv => inv.issued_at && new Date(inv.issued_at) >= firstDayOfMonth)
        .reduce((sum, inv) => sum + (inv.total_amount || 0), 0);

      // Contadores
      const totalPendientes = (invoices || []).filter(inv => !inv.paid).length;
      const totalPagadas = (invoices || []).filter(inv => inv.paid).length;

      return {
        totalCobrar,
        totalPagar,
        facturadoMes,
        totalPendientes,
        totalPagadas,
        totalFacturas: invoices?.length || 0,
      };
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase
        .from('invoices')
        .insert([data]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      toast.success("Factura registrada exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al registrar factura: " + error.message);
    },
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase
        .from('invoices')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      toast.success("Factura actualizada");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });
}

export function useMarkInvoiceAsPaid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const { error } = await supabase
        .from('invoices')
        .update({ paid: true })
        .eq('id', invoiceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice-stats'] });
      queryClient.invalidateQueries({ queryKey: ['bank-reconciliation'] });
      toast.success("Factura marcada como pagada");
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    },
  });
}
