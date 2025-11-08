import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CACHE_CONFIG } from "@/lib/queryConfig";

export interface Account {
  id: string;
  name: string;
  account_type: 'prospecto' | 'cliente' | 'proveedor' | 'socio';
  industry?: string;
  website?: string;
  phone?: string;
  email?: string;
  billing_address_json?: any;
  shipping_address_json?: any;
  tax_id?: string;
  notes?: string;
  sucursal_id?: string;
  owner_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export function useAccounts(search: string = "", accountType?: string) {
  return useQuery({
    queryKey: ['accounts', search, accountType],
    queryFn: async () => {
      let query = supabase
        .from('accounts')
        .select('*, sucursales(nombre)')
        .order('updated_at', { ascending: false });
      
      if (search) {
        query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
      }
      
      if (accountType) {
        query = query.eq('account_type', accountType);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Account[];
    },
    ...CACHE_CONFIG.active,
  });
}

export function useAccountById(id: string | null) {
  return useQuery({
    queryKey: ['account', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('accounts')
        .select('*, sucursales(nombre)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Account;
    },
    enabled: !!id,
  });
}

export function useCreateAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Account>) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data: account, error } = await supabase
        .from('accounts')
        .insert({
          ...data,
          created_by: userId
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return account;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success("Cuenta creada exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al crear cuenta: " + error.message);
    }
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Account> }) => {
      const { error } = await supabase
        .from('accounts')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success("Cuenta actualizada exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al actualizar cuenta: " + error.message);
    }
  });
}

export function useDeleteAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('accounts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast.success("Cuenta eliminada exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al eliminar cuenta: " + error.message);
    }
  });
}
