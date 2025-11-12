import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Alianza {
  id: string;
  nombre: string;
  tipo: string;
  comision_porcentaje: number;
  activa: boolean;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  contacto_nombre: string | null;
  contacto_email: string | null;
  contacto_telefono: string | null;
  notas: string | null;
  created_at: string;
  updated_at: string;
}

export function useAlianzas() {
  return useQuery({
    queryKey: ["alianzas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alianzas")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) throw error;
      return data as Alianza[];
    },
  });
}

export function useActiveAlianzas() {
  return useQuery({
    queryKey: ["alianzas", "active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("alianzas")
        .select("*")
        .eq("activa", true)
        .order("nombre", { ascending: true });

      if (error) throw error;
      return data as Alianza[];
    },
  });
}
