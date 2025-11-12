import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Eye, Share2, FileText } from "lucide-react";

interface StepProjectInfoProps {
  form: UseFormReturn<any>;
}

export function StepProjectInfo({ form }: StepProjectInfoProps) {
  const { data: projects, isLoading } = useQuery({
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

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Información del Proyecto</h3>
        <p className="text-muted-foreground">
          Configura los datos básicos del presupuesto ejecutivo
        </p>
      </div>

      {/* Project Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-5 w-5" />
            Proyecto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Label>Selecciona el proyecto *</Label>
          <Select
            value={form.watch('project_id')}
            onValueChange={(value) => form.setValue('project_id', value)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue placeholder="Seleccionar proyecto" />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex flex-col">
                    <span className="font-semibold">{p.clients?.name}</span>
                    <span className="text-xs text-muted-foreground">{p.project_name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Configuration Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuración</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* IVA */}
          <div className="flex items-center space-x-3 p-3 rounded-lg border bg-muted/50 hover:bg-muted/70 transition-colors">
            <Checkbox
              id="iva_enabled"
              checked={form.watch('iva_enabled')}
              onCheckedChange={(checked) => form.setValue('iva_enabled', checked as boolean)}
            />
            <label
              htmlFor="iva_enabled"
              className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
            >
              Incluir IVA (16%)
            </label>
          </div>

          {/* Vista Cliente */}
          <div className="flex items-start space-x-3 p-3 rounded-lg border bg-muted/50 hover:bg-muted/70 transition-colors">
            <Checkbox
              id="cliente_view_enabled"
              checked={form.watch('cliente_view_enabled')}
              onCheckedChange={(checked) => form.setValue('cliente_view_enabled', checked as boolean)}
            />
            <div className="flex-1 space-y-1">
              <label
                htmlFor="cliente_view_enabled"
                className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                <Eye className="h-4 w-4" />
                Vista Cliente
              </label>
              <p className="text-xs text-muted-foreground">
                Oculta costos unitarios, desperdicio y honorarios. Solo muestra precios finales.
              </p>
            </div>
          </div>

          {/* Compartir con Construcción */}
          <div className="flex items-start space-x-3 p-3 rounded-lg border bg-muted/50 hover:bg-muted/70 transition-colors">
            <Checkbox
              id="shared_with_construction"
              checked={form.watch('shared_with_construction')}
              onCheckedChange={(checked) => form.setValue('shared_with_construction', checked as boolean)}
            />
            <div className="flex-1 space-y-1">
              <label
                htmlFor="shared_with_construction"
                className="flex items-center gap-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                <Share2 className="h-4 w-4" />
                Compartir con Construcción
              </label>
              <p className="text-xs text-muted-foreground">
                El presupuesto estará disponible en el módulo de Construcción para el equipo asignado.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="h-5 w-5" />
            Notas (Opcional)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Escribe notas adicionales sobre el presupuesto..."
            value={form.watch('notas') || ''}
            onChange={(e) => form.setValue('notas', e.target.value)}
            className="min-h-[100px] resize-none"
          />
        </CardContent>
      </Card>
    </div>
  );
}
