import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateBank, type BankFormData } from "@/hooks/useCreateBank";
import { Loader2 } from "lucide-react";

interface BankDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BankDialog({ open, onOpenChange }: BankDialogProps) {
  const createBank = useCreateBank();
  const [formData, setFormData] = useState<Partial<BankFormData>>({
    nombre: "",
    codigo: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBank.mutate(formData as BankFormData, {
      onSuccess: () => {
        onOpenChange(false);
        setFormData({
          nombre: "",
          codigo: "",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Banco</DialogTitle>
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
            <Button type="submit" disabled={createBank.isPending}>
              {createBank.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Banco
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
