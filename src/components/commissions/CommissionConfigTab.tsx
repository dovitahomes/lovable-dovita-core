import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export function CommissionConfigTab() {
  const queryClient = useQueryClient();
  const [alliancePercent, setAlliancePercent] = useState("5.0");
  const [architecturePercent, setArchitecturePercent] = useState("3.0");
  const [constructionPercent, setConstructionPercent] = useState("2.0");

  const { data: config } = useQuery({
    queryKey: ["commission-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commission_config")
        .select("*")
        .single();

      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (config) {
      setAlliancePercent(config.alliance_percent.toString());
      setArchitecturePercent(config.collaborator_architecture_percent.toString());
      setConstructionPercent(config.collaborator_construction_percent.toString());
    }
  }, [config]);

  const updateConfigMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("commission_config")
        .update({
          alliance_percent: parseFloat(alliancePercent),
          collaborator_architecture_percent: parseFloat(architecturePercent),
          collaborator_construction_percent: parseFloat(constructionPercent),
        })
        .eq("id", config?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["commission-config"] });
      toast.success("Configuración actualizada");
    },
    onError: () => {
      toast.error("Error al actualizar configuración");
    },
  });

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Comisiones de Alianzas</CardTitle>
          <CardDescription>
            Porcentaje aplicado a presupuestos generados por alianzas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="alliance-percent">Porcentaje (%)</Label>
            <Input
              id="alliance-percent"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={alliancePercent}
              onChange={(e) => setAlliancePercent(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Este porcentaje se aplica sobre el monto total del presupuesto publicado
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comisiones de Colaboradores</CardTitle>
          <CardDescription>
            Porcentajes por tipo de proyecto
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="architecture-percent">Proyecto Arquitectónico (%)</Label>
            <Input
              id="architecture-percent"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={architecturePercent}
              onChange={(e) => setArchitecturePercent(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="construction-percent">Proyecto de Construcción (%)</Label>
            <Input
              id="construction-percent"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={constructionPercent}
              onChange={(e) => setConstructionPercent(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <div className="md:col-span-2">
        <Button
          onClick={() => updateConfigMutation.mutate()}
          disabled={updateConfigMutation.isPending}
        >
          Guardar Configuración
        </Button>
      </div>
    </div>
  );
}
