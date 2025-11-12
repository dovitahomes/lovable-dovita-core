import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight } from "lucide-react";

export default function BudgetWizard() {
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState("");
  const [type, setType] = useState<"parametrico" | "ejecutivo">("parametrico");
  const [ivaEnabled, setIvaEnabled] = useState(true);
  const [referenciaAlianzaId, setReferenciaAlianzaId] = useState<string>("");

  const { data: projects } = useQuery({
    queryKey: ['projects-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, clients(name)')
        .eq('status', 'activo')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { data: alianzas } = useQuery({
    queryKey: ['alianzas-activas'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('alianzas')
        .select('id, nombre, tipo, comision_porcentaje')
        .eq('activa', true)
        .order('nombre');
      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const { data: newBudget, error } = await supabase
        .from('budgets')
        .insert([{
          project_id: projectId,
          type,
          iva_enabled: ivaEnabled,
          status: 'borrador',
          version: 1,
          created_by: user.id,
          referencia_alianza_id: referenciaAlianzaId || null
        }])
        .select()
        .single();

      if (error) throw error;
      return newBudget;
    },
    onSuccess: (budget) => {
      toast.success("Presupuesto creado");
      navigate(`/erp/budgets/${budget.id}`);
    },
    onError: (error: any) => {
      toast.error("Error: " + error.message);
    }
  });

  const handleCreate = () => {
    if (!projectId) {
      toast.error("Selecciona un proyecto");
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => navigate('/erp/budgets')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Volver
        </Button>
        <h1 className="text-3xl font-bold">Nuevo Presupuesto</h1>
      </div>

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Configuración Inicial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label>Proyecto *</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.clients?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tipo de Presupuesto *</Label>
            <Select value={type} onValueChange={(v) => setType(v as "parametrico" | "ejecutivo")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parametrico">Paramétrico</SelectItem>
                <SelectItem value="ejecutivo">Ejecutivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={ivaEnabled}
              onCheckedChange={(checked) => setIvaEnabled(checked as boolean)}
            />
            <label className="text-sm">Incluir IVA (16%)</label>
          </div>

          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="referencia_alianza">¿Fue referido por alguna alianza?</Label>
            <Select value={referenciaAlianzaId} onValueChange={setReferenciaAlianzaId}>
              <SelectTrigger>
                <SelectValue placeholder="Ninguna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Ninguna</SelectItem>
                {alianzas?.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.nombre} ({a.comision_porcentaje}%)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Si seleccionas una alianza, se generará automáticamente una comisión al publicar el presupuesto
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => navigate('/erp/budgets')}>
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              Crear y Continuar <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
