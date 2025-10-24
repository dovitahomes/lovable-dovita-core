import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateClient, type ClientFormData } from "@/hooks/useCreateClient";
import { Loader2 } from "lucide-react";

interface ClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ClientDialog({ open, onOpenChange }: ClientDialogProps) {
  const createClient = useCreateClient();
  const [formData, setFormData] = useState<Partial<ClientFormData>>({
    name: "",
    person_type: "fisica",
    email: "",
    phone: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClient.mutate(formData as ClientFormData, {
      onSuccess: () => {
        onOpenChange(false);
        setFormData({
          name: "",
          person_type: "fisica",
          email: "",
          phone: "",
        });
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Nuevo Cliente</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Nombre / Razón Social *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nombre completo o empresa"
              required
            />
          </div>

          <div>
            <Label>Tipo de Persona *</Label>
            <Select
              value={formData.person_type}
              onValueChange={(v) => setFormData({ ...formData, person_type: v as "fisica" | "moral" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fisica">Persona Física</SelectItem>
                <SelectItem value="moral">Persona Moral</SelectItem>
              </SelectContent>
            </Select>
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

          <div>
            <Label>Teléfono</Label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="55 1234 5678"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createClient.isPending}>
              {createClient.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Crear Cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
