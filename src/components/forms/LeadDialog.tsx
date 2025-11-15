import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLead, type LeadFormData, type LeadStatus } from "@/hooks/useCreateLead";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { detectDuplicates, DuplicateLead } from "@/lib/crm/duplicates";
import { DuplicatesWarningDialog } from "@/components/crm/DuplicatesWarningDialog";
import { toast } from "sonner";

interface LeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadDialog({ open, onOpenChange }: LeadDialogProps) {
  const createLead = useCreateLead();
  const [formData, setFormData] = useState<Partial<LeadFormData>>({
    nombre_completo: "",
    telefono: "",
    email: "",
    terreno_m2: undefined,
    presupuesto_referencia: undefined,
    notas: "",
    sucursal_id: null,
    status: "nuevo" as LeadStatus,
    amount: undefined,
    probability: undefined,
    expected_close_date: undefined,
  });

  const [expectedCloseDate, setExpectedCloseDate] = useState<Date | undefined>();
  const [duplicates, setDuplicates] = useState<DuplicateLead[]>([]);
  const [showDuplicatesWarning, setShowDuplicatesWarning] = useState(false);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  const { data: sucursales } = useQuery({
    queryKey: ["sucursales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sucursales")
        .select("*")
        .eq("activa", true)
        .order("nombre");
      if (error) throw error;
      return data;
    },
  });

  // Mostrar campos de oportunidad cuando el status es propuesta, negociacion o ganado
  const showOpportunityFields = ["propuesta", "negociacion", "ganado"].includes(formData.status || "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Detectar duplicados antes de crear
    setIsCheckingDuplicates(true);
    try {
      const foundDuplicates = await detectDuplicates({
        nombre_completo: formData.nombre_completo,
        email: formData.email,
        telefono: formData.telefono,
      });

      if (foundDuplicates.length > 0) {
        setDuplicates(foundDuplicates);
        setShowDuplicatesWarning(true);
        setIsCheckingDuplicates(false);
        return;
      }

      // No duplicados, crear directamente
      await createLeadDirectly();
    } catch (error: any) {
      console.error('Error checking duplicates:', error);
      // PASO 3: Mensaje más específico según tipo de error
      if (error.message?.includes('uuid')) {
        toast.error("Error técnico al verificar duplicados. Intenta nuevamente.");
      } else {
        toast.error("Error al verificar duplicados: " + error.message);
      }
      setIsCheckingDuplicates(false);
    }
  };

  // PASO 2B: Función para resetear completamente el estado del dialog
  const handleDialogClose = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset completo cuando cierra
      setFormData({
        nombre_completo: "",
        telefono: "",
        email: "",
        terreno_m2: undefined,
        presupuesto_referencia: undefined,
        notas: "",
        sucursal_id: null,
        status: "nuevo" as LeadStatus,
        amount: undefined,
        probability: undefined,
        expected_close_date: undefined,
      });
      setExpectedCloseDate(undefined);
      setIsCheckingDuplicates(false);
      setDuplicates([]);
      setShowDuplicatesWarning(false);
    }
    onOpenChange(newOpen);
  };

  const createLeadDirectly = () => {
    const submitData = {
      ...formData,
      expected_close_date: expectedCloseDate ? format(expectedCloseDate, "yyyy-MM-dd") : undefined,
    };
    
    // PASO 2A: Agregar onError para resetear estado cuando falla
    createLead.mutate(submitData as LeadFormData, {
      onSuccess: () => {
        handleDialogClose(false);
      },
      onError: () => {
        setIsCheckingDuplicates(false);
      }
    });
  };

  return (
    <>
      <DuplicatesWarningDialog
        open={showDuplicatesWarning}
        onOpenChange={setShowDuplicatesWarning}
        duplicates={duplicates}
        onProceed={() => {
          setShowDuplicatesWarning(false);
          setIsCheckingDuplicates(false);
          createLeadDirectly();
        }}
        onCancel={() => {
          setShowDuplicatesWarning(false);
          setIsCheckingDuplicates(false);
        }}
      />
      
      {/* PASO 2B: Usar handleDialogClose para reset automático */}
      <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Lead</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre Completo *</Label>
            <Input
              value={formData.nombre_completo}
              onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
              placeholder="Juan Pérez"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Teléfono</Label>
              <Input
                value={formData.telefono}
                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                placeholder="55 1234 5678"
              />
            </div>

            <div>
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="correo@ejemplo.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Terreno (m²)</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.terreno_m2 || ""}
                onChange={(e) => setFormData({ ...formData, terreno_m2: parseFloat(e.target.value) || undefined })}
                placeholder="150"
              />
            </div>

            <div>
              <Label>Presupuesto Referencia</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.presupuesto_referencia || ""}
                onChange={(e) => setFormData({ ...formData, presupuesto_referencia: parseFloat(e.target.value) || undefined })}
                placeholder="500000"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Sucursal</Label>
              <Select
                value={formData.sucursal_id || "none"}
                onValueChange={(v) => setFormData({ ...formData, sucursal_id: v === "none" ? null : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar sucursal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin sucursal</SelectItem>
                  {sucursales?.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Estado</Label>
              <Select
                value={formData.status || "nuevo"}
                onValueChange={(v) => setFormData({ ...formData, status: v as LeadStatus })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                  <SelectItem value="contactado">Contactado</SelectItem>
                  <SelectItem value="calificado">Calificado</SelectItem>
                  <SelectItem value="propuesta">Propuesta</SelectItem>
                  <SelectItem value="negociacion">Negociación</SelectItem>
                  <SelectItem value="ganado">Ganado</SelectItem>
                  <SelectItem value="perdido">Perdido</SelectItem>
                  <SelectItem value="convertido">Convertido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {showOpportunityFields && (
            <>
              <div className="border-t pt-4 mt-2">
                <h3 className="text-sm font-semibold mb-3 text-muted-foreground">Información de Oportunidad</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Monto Estimado *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.amount || ""}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || undefined })}
                    placeholder="1500000"
                    required={showOpportunityFields}
                  />
                </div>

                <div>
                  <Label>Probabilidad de Cierre (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.probability || ""}
                    onChange={(e) => setFormData({ ...formData, probability: parseInt(e.target.value) || undefined })}
                    placeholder="50"
                  />
                </div>
              </div>

              <div>
                <Label>Fecha Esperada de Cierre</Label>
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
                      {expectedCloseDate ? format(expectedCloseDate, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={expectedCloseDate}
                      onSelect={setExpectedCloseDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </>
          )}

          <div>
            <Label>Notas</Label>
            <Textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Información adicional..."
              rows={3}
            />
          </div>

          <DialogFooter>
            {/* PASO 2C: Botón Cancelar usa handleDialogClose */}
            <Button type="button" variant="outline" onClick={() => handleDialogClose(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createLead.isPending || isCheckingDuplicates}>
              {(createLead.isPending || isCheckingDuplicates) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {isCheckingDuplicates ? "Verificando..." : "Crear Lead"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      </Dialog>
    </>
  );
}
