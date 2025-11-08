import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { promoteLeadToOpportunity } from "@/lib/crm/opportunities";

interface ConvertLeadToOpportunityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
}

export function ConvertLeadToOpportunityDialog({ open, onOpenChange, lead }: ConvertLeadToOpportunityDialogProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: lead?.nombre_completo || "",
    amount: lead?.presupuesto_referencia || "",
    account_id: "",
    contact_id: "",
    notes: lead?.notas || ""
  });

  const { data: accounts = [] } = useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('accounts')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data;
    }
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('id, first_name, last_name')
        .order('first_name');
      if (error) throw error;
      return data;
    }
  });

  const convertMutation = useMutation({
    mutationFn: async () => {
      return await promoteLeadToOpportunity(lead.id, {
        name: formData.name,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        account_id: formData.account_id || undefined,
        contact_id: formData.contact_id || undefined,
        notes: formData.notes || undefined
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      toast.success("Lead convertido a Oportunidad exitosamente");
      onOpenChange(false);
    },
    onError: (error: any) => {
      toast.error("Error al convertir: " + error.message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Convertir Lead a Oportunidad</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Nombre de la Oportunidad *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Proyecto Casa residencial"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Monto Estimado</Label>
              <Input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
              />
            </div>

            <div>
              <Label>Cuenta Asociada</Label>
              <Select value={formData.account_id} onValueChange={(v) => setFormData({ ...formData, account_id: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cuenta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ninguna</SelectItem>
                  {accounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Contacto</Label>
            <Select value={formData.contact_id} onValueChange={(v) => setFormData({ ...formData, contact_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar contacto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Ninguno</SelectItem>
                {contacts.map(c => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.first_name} {c.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Notas</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Notas adicionales..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => convertMutation.mutate()} disabled={convertMutation.isPending || !formData.name}>
            {convertMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Convertir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
