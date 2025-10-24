import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateBank, type BankFormData } from "@/hooks/useCreateBank";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bank?: any;
  onSuccess?: () => void;
}

export function BankDialog({ open, onOpenChange, bank, onSuccess }: BankDialogProps) {
  const createBank = useCreateBank();
  const [formData, setFormData] = useState<Partial<BankFormData>>({
    nombre: "",
    codigo: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (bank) {
      setFormData({
        nombre: bank.nombre || "",
        codigo: bank.codigo || "",
      });
    } else {
      setFormData({
        nombre: "",
        codigo: "",
      });
    }
  }, [bank, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (bank) {
      setIsUpdating(true);
      const { error } = await supabase
        .from("banks")
        .update({
          nombre: formData.nombre,
          codigo: formData.codigo || null,
        })
        .eq("id", bank.id);
      
      setIsUpdating(false);
      if (error) {
        toast.error("Error al actualizar banco");
        return;
      }
      toast.success("Banco actualizado");
      onSuccess?.();
      onOpenChange(false);
    } else {
      createBank.mutate(formData as BankFormData, {
        onSuccess: () => {
          onSuccess?.();
          onOpenChange(false);
        },
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{bank ? "Editar" : "Nuevo"} Banco</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre *</Label>
            <Input
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              placeholder="BBVA, Santander, etc."
              required
            />
          </div>

          <div>
            <Label>Código</Label>
            <Input
              value={formData.codigo}
              onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
              placeholder="012"
              maxLength={10}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createBank.isPending || isUpdating}>
              {(createBank.isPending || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {bank ? "Actualizar" : "Crear"} Banco
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
