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
import { ChevronLeft, ChevronRight, CheckCircle, Loader2, Save, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepProjectInfo } from "./steps/StepProjectInfo";
import { StepMayorSelection } from "./steps/StepMayorSelection";
import { StepPartidaConfig } from "./steps/StepPartidaConfig";
import { StepPreview } from "./steps/StepPreview";
import { SaveAsTemplateDialog } from "./SaveAsTemplateDialog";

const budgetSchema = z.object({
  project_id: z.string().min(1, "Proyecto requerido"),
  iva_enabled: z.boolean().default(true),
  notas: z.string().optional(),
});

export interface BudgetItem {
  mayor_id: string;
  partida_id: string;
  descripcion: string;
  unidad: string;
  cant_real: number;
  desperdicio_pct: number;
  costo_unit: number;
  honorarios_pct: number;
  order_index: number;
}

export interface Mayor {
  id: string;
  code: string;
  name: string;
}

interface ParametricBudgetWizardProps {
  open: boolean;
  onClose: () => void;
  budgetId?: string;
}

const STEPS = [
  { id: 1, name: "Proyecto", icon: "📋" },
  { id: 2, name: "Mayores", icon: "📂" },
  { id: 3, name: "Partidas", icon: "📝" },
  { id: 4, name: "Preview", icon: "👁️" },
];

export function ParametricBudgetWizard({ open, onClose, budgetId }: ParametricBudgetWizardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedMayores, setSelectedMayores] = useState<Mayor[]>([]);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);

  const form = useForm<z.infer<typeof budgetSchema>>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      project_id: "",
      iva_enabled: true,
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
        notas: existingBudget.notas || "",
      });

      // Load items and extract mayores
      if (existingBudget.budget_items && existingBudget.budget_items.length > 0) {
        setItems(existingBudget.budget_items);
        // Extract unique mayores from items
        const mayorIds = [...new Set(existingBudget.budget_items.map((i: any) => i.mayor_id))];
        // Load mayor details
        fetchMayoresByIds(mayorIds);
      }
    }
  }, [existingBudget, open]);

  const fetchMayoresByIds = async (mayorIds: string[]) => {
    const { data } = await supabase
      .from('tu_nodes')
      .select('id, code, name')
      .in('id', mayorIds)
      .eq('type', 'mayor');
    if (data) setSelectedMayores(data as Mayor[]);
  };

  const saveMutation = useMutation({
    mutationFn: async ({ publish }: { publish: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuario no autenticado");

      const formData = form.getValues();
      let budgetIdToUse = budgetId;

      if (!budgetIdToUse) {
        // Create new budget
        const { data: newBudget, error: budgetError } = await supabase
          .from('budgets')
          .insert({
            project_id: formData.project_id,
            type: 'parametrico',
            iva_enabled: formData.iva_enabled,
            status: publish ? 'publicado' : 'borrador',
            notas: formData.notas || null,
            created_by: user.id,
            published_at: publish ? new Date().toISOString() : null,
          })
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
              subpartida_id: null,
              descripcion: item.descripcion,
              unidad: item.unidad || 'pieza',
              cant_real: item.cant_real || 1,
              desperdicio_pct: item.desperdicio_pct || 0,
              costo_unit: item.costo_unit || 0,
              honorarios_pct: item.honorarios_pct || 0,
              order_index: idx,
            }))
          );

        if (itemsError) throw itemsError;
      }

      return budgetIdToUse;
    },
    onSuccess: (newBudgetId) => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] });
      toast.success("Presupuesto guardado exitosamente");
      onClose();
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
      if (selectedMayores.length === 0) {
        toast.error("Selecciona al menos un mayor");
        return false;
      }
    } else if (step === 3) {
      if (items.length === 0) {
        toast.error("Agrega al menos una partida");
        return false;
      }
      // Validate all items have required fields
      const hasInvalidItems = items.some(
        item => !item.partida_id || !item.costo_unit || item.cant_real <= 0
      );
      if (hasInvalidItems) {
        toast.error("Completa todos los campos requeridos en las partidas");
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
    if (selectedMayores.length === 0) return true;
    if (items.length === 0) return true;
    
    const hasInvalidItems = items.some(
      (item) => !item.partida_id || !item.costo_unit || item.cant_real <= 0
    );
    return hasInvalidItems;
  };

  const handleClose = () => {
    form.reset();
    setCurrentStep(1);
    setSelectedMayores([]);
    setItems([]);
    onClose();
  };

  const progress = (currentStep / STEPS.length) * 100;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {budgetId ? 'Editar' : 'Nuevo'} Presupuesto Paramétrico
          </DialogTitle>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            {STEPS.map((step, idx) => (
              <div key={step.id} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
                    currentStep === step.id && "bg-primary/10 ring-2 ring-primary",
                    currentStep > step.id && "bg-green-500/10",
                    currentStep < step.id && "bg-muted"
                  )}
                >
                  {currentStep > step.id ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <span className="text-base">{step.icon}</span>
                  )}
                  <span
                    className={cn(
                      "text-sm font-medium",
                      currentStep === step.id && "text-primary",
                      currentStep > step.id && "text-green-600"
                    )}
                  >
                    {step.name}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground mx-1" />
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="py-6">
          {currentStep === 1 && <StepProjectInfo form={form} />}
          {currentStep === 2 && (
            <StepMayorSelection
              selectedMayores={selectedMayores}
              onMayoresChange={setSelectedMayores}
            />
          )}
          {currentStep === 3 && (
            <StepPartidaConfig
              selectedMayores={selectedMayores}
              items={items}
              onItemsChange={setItems}
            />
          )}
          {currentStep === 4 && (
            <StepPreview
              formData={form.getValues()}
              selectedMayores={selectedMayores}
              items={items}
            />
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center pt-4 border-t">
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1 || saveMutation.isPending}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Anterior
            </Button>

            {items.length > 0 && currentStep >= 3 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowSaveTemplate(true)}
                className="text-xs"
              >
                💾 Guardar como Template
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {currentStep === STEPS.length ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => saveMutation.mutate({ publish: false })}
                  disabled={saveMutation.isPending || hasValidationErrors()}
                  title={hasValidationErrors() ? "Completa todos los campos requeridos" : ""}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Guardar Borrador
                </Button>
                <Button
                  type="button"
                  onClick={() => saveMutation.mutate({ publish: true })}
                  disabled={saveMutation.isPending || hasValidationErrors()}
                  title={hasValidationErrors() ? "Completa todos los campos requeridos" : ""}
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Publicar
                </Button>
              </>
            ) : (
              <Button type="button" onClick={handleNext}>
                Siguiente
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Save as Template Dialog */}
        <SaveAsTemplateDialog
          open={showSaveTemplate}
          onClose={() => setShowSaveTemplate(false)}
          items={items}
        />
      </DialogContent>
    </Dialog>
  );
}
