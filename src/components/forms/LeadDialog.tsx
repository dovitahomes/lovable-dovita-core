import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateLead, type LeadFormData } from "@/hooks/useCreateLead";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

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
  });

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLead.mutate(formData as LeadFormData, {
      onSuccess: () => {
        onOpenChange(false);
        setFormData({
          nombre_completo: "",
          telefono: "",
          email: "",
          terreno_m2: undefined,
          presupuesto_referencia: undefined,
          notas: "",
          sucursal_id: null,
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <Label>Notas</Label>
            <Textarea
              value={formData.notas}
              onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
              placeholder="Información adicional..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createLead.isPending}>
              {createLead.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Lead
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
