import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Plus, CheckCircle } from "lucide-react";
import { BudgetItem } from "./ParametricBudgetWizard";
import { toast } from "sonner";

interface TemplateSelectorProps {
  open: boolean;
  onClose: () => void;
  mayorId: string;
  onApplyTemplate: (items: BudgetItem[]) => void;
}

export function TemplateSelector({ open, onClose, mayorId, onApplyTemplate }: TemplateSelectorProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const { data: templates, isLoading } = useQuery({
    queryKey: ['budget_templates', 'parametrico'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_templates')
        .select('*')
        .eq('type', 'parametrico')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const handleApply = () => {
    const template = templates?.find((t) => t.id === selectedTemplate);
    if (!template) {
      toast.error("Selecciona un template");
      return;
    }

    const items = template.items as any[];
    const mappedItems: BudgetItem[] = items
      .filter((item) => item.mayor_id === mayorId)
      .map((item, idx) => ({
        mayor_id: item.mayor_id || mayorId,
        partida_id: item.partida_id || "",
        descripcion: item.descripcion || "",
        unidad: item.unidad || "pieza",
        cant_real: item.cant_real || 1,
        desperdicio_pct: item.desperdicio_pct || 0,
        costo_unit: item.costo_unit || 0,
        honorarios_pct: item.honorarios_pct || 15,
        order_index: idx,
      }));

    if (mappedItems.length === 0) {
      toast.error("Este template no contiene partidas para el mayor seleccionado");
      return;
    }

    onApplyTemplate(mappedItems);
    toast.success(`${mappedItems.length} partidas agregadas desde template`);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Templates de Partidas Comunes
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-lg" />
            ))}
          </div>
        ) : !templates || templates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No hay templates disponibles</p>
            <p className="text-xs mt-1">Crea un template desde un presupuesto existente</p>
          </div>
        ) : (
          <div className="space-y-3">
            {templates.map((template) => {
              const items = template.items as any[];
              const mayorItems = items.filter((item) => item.mayor_id === mayorId);
              const isSelected = selectedTemplate === template.id;

              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`w-full text-left border-2 rounded-lg p-4 transition-all hover:border-primary/50 ${
                    isSelected ? "border-primary bg-primary/5" : "border-border"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold truncate">{template.name}</h4>
                        {isSelected && <CheckCircle className="h-4 w-4 text-primary shrink-0" />}
                      </div>
                      {template.description && (
                        <p className="text-sm text-muted-foreground mb-2">{template.description}</p>
                      )}
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {items.length} partidas totales
                        </Badge>
                        {mayorItems.length > 0 && (
                          <Badge className="text-xs bg-green-500">
                            {mayorItems.length} para este mayor
                          </Badge>
                        )}
                        {mayorItems.length === 0 && (
                          <Badge variant="outline" className="text-xs">
                            Sin partidas para este mayor
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            disabled={!selectedTemplate || isLoading}
          >
            <Plus className="h-4 w-4 mr-2" />
            Aplicar Template
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
