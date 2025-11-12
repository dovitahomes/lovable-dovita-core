import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Loader2, Save, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepProjectInfo } from "./steps/StepProjectInfo";
import { StepSubpartidaSelection } from "./steps/StepSubpartidaSelection";
import { StepItemsConfig } from "./steps/StepItemsConfig";
import { StepPreview } from "./steps/StepPreview";

const budgetSchema = z.object({
  project_id: z.string().min(1, "Proyecto requerido"),
  iva_enabled: z.boolean().default(true),
  cliente_view_enabled: z.boolean().default(false),
  shared_with_construction: z.boolean().default(false),
  notas: z.string().optional(),
});

export interface ExecutiveBudgetItem {
  mayor_id: string;
  partida_id: string;
  subpartida_id: string;
  descripcion: string;
  unidad: string;
  cant_real: number;
  desperdicio_pct: number;
  costo_unit: number;
  honorarios_pct: number;
  proveedor_alias: string;
  order_index: number;
}

export interface TUNode {
  id: string;
  code: string;
  name: string;
  type: string;
  parent_id: string | null;
}

interface ExecutiveBudgetWizardProps {
  open: boolean;
  onClose: () => void;
  budgetId?: string;
}

const STEPS = [
  { id: 1, name: "Proyecto", icon: "📋" },
  { id: 2, name: "Subpartidas", icon: "🏗️" },
  { id: 3, name: "Items", icon: "📝" },
  { id: 4, name: "Preview", icon: "👁️" },
];

export function ExecutiveBudgetWizard({ open, onClose, budgetId }: ExecutiveBudgetWizardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSubpartidas, setSelectedSubpartidas] = useState<TUNode[]>([]);
  const [items, setItems] = useState<ExecutiveBudgetItem[]>([]);

  const form = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      project_id: "",
      iva_enabled: true,
      cliente_view_enabled: false,
      shared_with_construction: false,
      notas: "",
    },
  });

  // Fetch existing budget if editing
  const { data: existingBudget } = useQuery({
    queryKey: ['budget', budgetId],
    queryFn: async () => {
      if (!budgetId) return null;
      const { data, error } = await supabase
        .from('budgets')
        .select('*, budget_items(*)')
        .eq('id', budgetId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!budgetId && open,
  });

  // Load existing budget data
  useEffect(() => {
    if (existingBudget && open) {
      form.reset({
        project_id: existingBudget.project_id,
        iva_enabled: existingBudget.iva_enabled,
        cliente_view_enabled: existingBudget.cliente_view_enabled || false,
        shared_with_construction: existingBudget.shared_with_construction || false,
        notas: existingBudget.notas || "",
      });

      // Load items and extract selected subpartidas
      if (existingBudget.budget_items) {
        const loadedItems = existingBudget.budget_items.map((item: any, idx: number) => ({
          mayor_id: item.mayor_id,
          partida_id: item.partida_id,
          subpartida_id: item.subpartida_id,
          descripcion: item.descripcion,
          unidad: item.unidad,
          cant_real: item.cant_real,
          desperdicio_pct: item.desperdicio_pct,
          costo_unit: item.costo_unit,
          honorarios_pct: item.honorarios_pct,
          proveedor_alias: item.proveedor_alias || "",
          order_index: idx,
        }));
        setItems(loadedItems);

        // Extract unique subpartidas
        const uniqueSubpartidaIds = [...new Set(loadedItems.map(i => i.subpartida_id))];
        // Note: We'll need to fetch the actual subpartida nodes to populate selectedSubpartidas
      }
    }
  }, [existingBudget, open, form]);

  const saveMutation = useMutation({
    mutationFn: async ({ publish }: { publish: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const formData = form.getValues();
      let budgetIdToUse = budgetId;

      if (!budgetId) {
        // Create new budget
        const { data: newBudget, error: budgetError } = await supabase
          .from('budgets')
          .insert([{
            project_id: formData.project_id,
            type: 'ejecutivo',
            iva_enabled: formData.iva_enabled,
            cliente_view_enabled: formData.cliente_view_enabled,
            shared_with_construction: formData.shared_with_construction,
            status: publish ? 'publicado' : 'borrador',
            version: 1,
            notas: formData.notas || null,
            created_by: user.id,
            published_at: publish ? new Date().toISOString() : null,
          }])
          .select()
          .single();

        if (budgetError) throw budgetError;
        budgetIdToUse = newBudget.id;
      } else {
        // Update existing budget
        const { error: updateError } = await supabase
          .from('budgets')
          .update({
            iva_enabled: formData.iva_enabled,
            cliente_view_enabled: formData.cliente_view_enabled,
            shared_with_construction: formData.shared_with_construction,
            status: publish ? 'publicado' : 'borrador',
            notas: formData.notas || null,
            published_at: publish ? new Date().toISOString() : null,
          })
          .eq('id', budgetIdToUse);

        if (updateError) throw updateError;

        // Delete existing items
        await supabase.from('budget_items').delete().eq('budget_id', budgetIdToUse);
      }

      // Insert items
      if (items.length > 0) {
        const { error: itemsError } = await supabase
          .from('budget_items')
          .insert(
            items.map((item, idx) => ({
              budget_id: budgetIdToUse,
              mayor_id: item.mayor_id,
              partida_id: item.partida_id,
              subpartida_id: item.subpartida_id,
              descripcion: item.descripcion,
              unidad: item.unidad || 'pieza',
              cant_real: item.cant_real || 1,
              desperdicio_pct: item.desperdicio_pct || 0,
              costo_unit: item.costo_unit || 0,
              honorarios_pct: item.honorarios_pct || 0,
              proveedor_alias: item.proveedor_alias || "",
              order_index: idx,
            }))
          );

        if (itemsError) throw itemsError;

        // Save prices to history for subpartidas
        for (const item of items) {
          if (item.subpartida_id && item.costo_unit > 0) {
            await supabase.rpc('save_price_history', {
              subpartida_id_param: item.subpartida_id,
              precio_param: item.costo_unit,
              unidad_param: item.unidad,
              proveedor_param: item.proveedor_alias
            });
          }
        }
      }

      return budgetIdToUse;
    },
    onSuccess: (newBudgetId) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success("Presupuesto ejecutivo guardado exitosamente");
      handleClose();
      navigate(`/presupuestos/${newBudgetId}`);
    },
    onError: (error: any) => {
      toast.error("Error al guardar: " + error.message);
    },
  });

  const validateStep = (step: number): boolean => {
    if (step === 1) {
      const isValid = form.trigger(['project_id']);
      if (!isValid) {
        toast.error("Por favor completa los campos requeridos");
        return false;
      }
    } else if (step === 2) {
      if (selectedSubpartidas.length === 0) {
        toast.error("Selecciona al menos una subpartida");
        return false;
      }
    } else if (step === 3) {
      if (items.length === 0) {
        toast.error("Agrega al menos un item al presupuesto");
        return false;
      }

      const hasInvalidItems = items.some(
        (item) => !item.subpartida_id || !item.costo_unit || item.cant_real <= 0
      );

      if (hasInvalidItems) {
        toast.error("Completa todos los campos requeridos de los items");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const hasValidationErrors = () => {
    if (!form.getValues().project_id) return true;
    if (selectedSubpartidas.length === 0) return true;
    if (items.length === 0) return true;
    
    const hasInvalidItems = items.some(
      (item) => !item.subpartida_id || !item.costo_unit || item.cant_real <= 0
    );
    return hasInvalidItems;
  };

  const handleClose = () => {
    form.reset();
    setCurrentStep(1);
    setSelectedSubpartidas([]);
    setItems([]);
    onClose();
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {budgetId ? 'Editar' : 'Nuevo'} Presupuesto Ejecutivo
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center justify-center h-10 w-10 rounded-full border-2 transition-all",
                    currentStep >= step.id
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-muted bg-background text-muted-foreground"
                  )}
                >
                  <span className="text-lg">{step.icon}</span>
                </div>
                <div className="hidden md:block">
                  <div className={cn(
                    "text-sm font-medium",
                    currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.name}
                  </div>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={cn(
                    "hidden md:block w-12 h-0.5 mx-2",
                    currentStep > step.id ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="py-6">
          {currentStep === 1 && (
            <StepProjectInfo form={form} />
          )}
          {currentStep === 2 && (
            <StepSubpartidaSelection
              selectedSubpartidas={selectedSubpartidas}
              onSelectedSubpartidasChange={setSelectedSubpartidas}
            />
          )}
          {currentStep === 3 && (
            <StepItemsConfig
              selectedSubpartidas={selectedSubpartidas}
              items={items}
              onItemsChange={setItems}
              clientViewEnabled={form.watch('cliente_view_enabled')}
              onClientViewChange={(enabled) => form.setValue('cliente_view_enabled', enabled)}
            />
          )}
          {currentStep === 4 && (
            <StepPreview
              formData={form.getValues()}
              selectedSubpartidas={selectedSubpartidas}
              items={items}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>
          </div>

          <div className="flex gap-2">
            {currentStep < STEPS.length && (
              <Button
                variant="outline"
                onClick={() => saveMutation.mutate({ publish: false })}
                disabled={saveMutation.isPending || hasValidationErrors()}
              >
                <Save className="h-4 w-4 mr-2" />
                Guardar Borrador
              </Button>
            )}

            {currentStep < STEPS.length ? (
              <Button onClick={handleNext}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => saveMutation.mutate({ publish: false })}
                  disabled={saveMutation.isPending || hasValidationErrors()}
                >
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Borrador
                </Button>
                <Button
                  onClick={() => saveMutation.mutate({ publish: true })}
                  disabled={saveMutation.isPending || hasValidationErrors()}
                >
                  {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <Send className="h-4 w-4 mr-2" />
                  Publicar Presupuesto
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
