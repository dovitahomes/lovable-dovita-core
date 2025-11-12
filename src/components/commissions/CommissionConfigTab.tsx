import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Info } from "lucide-react";

export function CommissionConfigTab() {
  const queryClient = useQueryClient();
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
      setArchitecturePercent(config.collaborator_architecture_percent.toString());
      setConstructionPercent(config.collaborator_construction_percent.toString());
    }
  }, [config]);

  const updateConfigMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("commission_config")
        .update({
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
    <div className="space-y-6">
      {/* Alert informativo sobre comisiones de alianzas */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Comisiones de Alianzas:</strong> Cada alianza tiene su propio porcentaje de comisión específico.
          Gestiona los porcentajes individuales desde{" "}
          <a href="/herramientas/alianzas" className="underline hover:text-primary">
            Herramientas → Alianzas
          </a>
          .
        </AlertDescription>
      </Alert>

      {/* Card de comisiones de colaboradores */}
      <Card>
        <CardHeader>
          <CardTitle>Comisiones de Colaboradores</CardTitle>
          <CardDescription>
            Porcentajes globales por tipo de proyecto para colaboradores internos
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
            <p className="text-sm text-muted-foreground">
              Porcentaje aplicado a proyectos de arquitectura
            </p>
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
            <p className="text-sm text-muted-foreground">
              Porcentaje aplicado a proyectos de construcción
            </p>
          </div>
        </CardContent>
      </Card>

      <div>
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
