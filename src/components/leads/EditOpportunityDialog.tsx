import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useUpdateLead } from "@/hooks/useLeads";
import { useToast } from "@/hooks/use-toast";

interface EditOpportunityDialogProps {
  lead: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditOpportunityDialog({ lead, open, onOpenChange }: EditOpportunityDialogProps) {
  const [amount, setAmount] = useState(lead?.amount || 0);
  const [probability, setProbability] = useState(lead?.probability || 50);
  const [expectedCloseDate, setExpectedCloseDate] = useState<Date | undefined>(
    lead?.expected_close_date ? new Date(lead.expected_close_date) : undefined
  );

  const updateLead = useUpdateLead();
  const { toast } = useToast();

  // Sync with lead changes
  useEffect(() => {
    if (lead) {
      setAmount(lead.amount || 0);
      setProbability(lead.probability || 50);
      setExpectedCloseDate(lead.expected_close_date ? new Date(lead.expected_close_date) : undefined);
    }
  }, [lead]);

  const handleSave = async () => {
    try {
      await updateLead.mutateAsync({
        leadId: lead.id,
        updates: {
          amount: amount || null,
          probability: probability || null,
          expected_close_date: expectedCloseDate ? format(expectedCloseDate, 'yyyy-MM-dd') : null,
        },
      });

      toast({
        title: "Oportunidad actualizada",
        description: "Los datos de la oportunidad se actualizaron correctamente",
      });

      onOpenChange(false);
    } catch (error) {
      console.error("Error al actualizar oportunidad:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la oportunidad",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Oportunidad</DialogTitle>
          <DialogDescription>
            Actualiza los detalles de la oportunidad de venta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Valor de la Oportunidad</Label>
            <Input
              id="amount"
              type="number"
              placeholder="$0.00"
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground">
              Monto estimado de la venta en pesos mexicanos
            </p>
          </div>

          {/* Probability */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="probability">Probabilidad de Cierre</Label>
              <span className="text-sm font-semibold text-primary">{probability}%</span>
            </div>
            <Slider
              id="probability"
              value={[probability]}
              onValueChange={(value) => setProbability(value[0])}
              min={0}
              max={100}
              step={5}
              className="py-4"
            />
            <p className="text-xs text-muted-foreground">
              Probabilidad de que este lead se convierta en cliente
            </p>
          </div>

          {/* Expected Close Date */}
          <div className="space-y-2">
            <Label>Fecha de Cierre Esperado</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !expectedCloseDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {expectedCloseDate ? (
                    format(expectedCloseDate, "PPP", { locale: es })
                  ) : (
                    <span>Seleccionar fecha</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={expectedCloseDate}
                  onSelect={setExpectedCloseDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <p className="text-xs text-muted-foreground">
              Fecha estimada en que se cerrará la venta
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={updateLead.isPending}>
            {updateLead.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Guardar Cambios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
