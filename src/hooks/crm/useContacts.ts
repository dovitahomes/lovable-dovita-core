import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CACHE_CONFIG } from "@/lib/queryConfig";

export interface Contact {
  id: string;
  account_id?: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  birthdate?: string;
  notes?: string;
  owner_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  accounts?: { name: string };
}

export function useContacts(search: string = "", accountId?: string) {
  return useQuery({
    queryKey: ['contacts', search, accountId],
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('*, accounts(name)')
        .order('updated_at', { ascending: false });
      
      if (search) {
        query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`);
      }
      
      if (accountId) {
        query = query.eq('account_id', accountId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Contact[];
    },
    ...CACHE_CONFIG.active,
  });
}

export function useContactById(id: string | null) {
  return useQuery({
    queryKey: ['contact', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from('contacts')
        .select('*, accounts(name)')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data as Contact;
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Contact>) => {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          ...data,
          created_by: userId
        } as any)
        .select()
        .single();
      
      if (error) throw error;
      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success("Contacto creado exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al crear contacto: " + error.message);
    }
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Contact> }) => {
      const { error } = await supabase
        .from('contacts')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success("Contacto actualizado exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al actualizar contacto: " + error.message);
    }
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast.success("Contacto eliminado exitosamente");
    },
    onError: (error: any) => {
      toast.error("Error al eliminar contacto: " + error.message);
    }
  });
}
