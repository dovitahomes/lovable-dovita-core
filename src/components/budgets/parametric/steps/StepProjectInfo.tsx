import { UseFormReturn } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, FileText } from "lucide-react";

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
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 rounded-lg" />
        <Skeleton className="h-16 rounded-lg" />
        <Skeleton className="h-32 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Información del Proyecto</h3>
        <p className="text-muted-foreground">
          Selecciona el proyecto y configura las opciones básicas del presupuesto
        </p>
      </div>

      <Form {...form}>
        <div className="space-y-6">
          {/* Project Selection */}
          <Card>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="project_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Proyecto <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Seleccionar proyecto" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-background/95 backdrop-blur-sm border-border z-50">
                        {projects && projects.length > 0 ? (
                          projects.map((project: any) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.clients?.name || 'Sin cliente'} - {project.project_name || 'Proyecto'}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="none" disabled>
                            No hay proyectos activos
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* IVA Configuration */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <FormField
                control={form.control}
                name="iva_enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4 bg-muted/50">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base font-semibold">
                        Incluir IVA (16%)
                      </FormLabel>
                      <div className="text-sm text-muted-foreground">
                        Agrega automáticamente el 16% de IVA al total del presupuesto
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardContent className="pt-6">
              <FormField
                control={form.control}
                name="notas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Notas u Observaciones
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Agrega notas, observaciones o condiciones especiales..."
                        rows={4}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        </div>
      </Form>
    </div>
  );
}
