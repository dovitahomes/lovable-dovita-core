import { useOutletContext } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";

interface OutletContext {
  projectId: string | null;
}

export default function Presupuesto() {
  const { projectId } = useOutletContext<OutletContext>();

  const { data: budget, isLoading } = useQuery({
    queryKey: ["client-budget", projectId],
    queryFn: async () => {
      if (!projectId) return null;
      const { data, error } = await supabase
        .from("budgets")
        .select(`
          *,
          budget_items(*)
        `)
        .eq("project_id", projectId)
        .eq("type", "ejecutivo")
        .eq("status", "publicado")
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  if (!projectId) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-muted-foreground">No hay proyecto seleccionado</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-1">Presupuesto</h2>
        <p className="text-sm text-muted-foreground">Detalle del presupuesto de tu proyecto</p>
      </div>

      {budget ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              Presupuesto Ejecutivo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="font-medium">Partidas del Presupuesto</span>
                <span className="text-xl font-bold text-primary">
                  {budget.budget_items?.length || 0} partidas
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {budget.budget_items?.length || 0} partidas incluidas
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-8 text-center">
            <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">
              El presupuesto de tu proyecto aún no está disponible
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
