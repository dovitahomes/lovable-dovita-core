import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateBankAccount, type BankAccountFormData } from "@/hooks/useCreateBankAccount";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

interface BankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  account?: any;
  banks?: any[];
  onSuccess?: () => void;
}

export function BankAccountDialog({ open, onOpenChange, account, banks: propBanks, onSuccess }: BankAccountDialogProps) {
  const createBankAccount = useCreateBankAccount();
  const [formData, setFormData] = useState<Partial<BankAccountFormData>>({
    bank_id: "",
    numero_cuenta: "",
    tipo_cuenta: "",
    moneda: "MXN",
    saldo_actual: 0,
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [banks, setBanks] = useState<any[]>(propBanks || []);

  useEffect(() => {
    if (!propBanks) {
      loadBanks();
    } else {
      setBanks(propBanks);
    }
  }, [propBanks]);

  useEffect(() => {
    if (account) {
      setFormData({
        bank_id: account.bank_id || "",
        numero_cuenta: account.numero_cuenta || "",
        tipo_cuenta: account.tipo_cuenta || "",
        moneda: account.moneda || "MXN",
        saldo_actual: account.saldo_actual || 0,
      });
    } else {
      setFormData({
        bank_id: "",
        numero_cuenta: "",
        tipo_cuenta: "",
        moneda: "MXN",
        saldo_actual: 0,
      });
    }
  }, [account, open]);

  const loadBanks = async () => {
    const { data } = await supabase
      .from("banks")
      .select("*")
      .eq("activo", true)
      .order("nombre");
    setBanks(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (account) {
      setIsUpdating(true);
      const { error } = await supabase
        .from("bank_accounts")
        .update({
          bank_id: formData.bank_id,
          numero_cuenta: formData.numero_cuenta,
          tipo_cuenta: formData.tipo_cuenta || null,
          moneda: formData.moneda,
          saldo_actual: formData.saldo_actual,
        })
        .eq("id", account.id);
      
      setIsUpdating(false);
      if (error) {
        toast.error("Error al actualizar cuenta");
        return;
      }
      toast.success("Cuenta actualizada");
      onSuccess?.();
      onOpenChange(false);
    } else {
      createBankAccount.mutate(formData as BankAccountFormData, {
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
          <DialogTitle>{account ? "Editar" : "Nueva"} Cuenta Bancaria</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Banco *</Label>
            <Select
              value={formData.bank_id}
              onValueChange={(v) => setFormData({ ...formData, bank_id: v })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar banco" />
              </SelectTrigger>
              <SelectContent>
                {banks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    {bank.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Número de Cuenta *</Label>
            <Input
              value={formData.numero_cuenta}
              onChange={(e) => setFormData({ ...formData, numero_cuenta: e.target.value })}
              placeholder="1234567890"
              required
              maxLength={50}
            />
          </div>

          <div>
            <Label>Tipo de Cuenta</Label>
            <Input
              value={formData.tipo_cuenta}
              onChange={(e) => setFormData({ ...formData, tipo_cuenta: e.target.value })}
              placeholder="Cheques, Ahorro, etc."
              maxLength={50}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Moneda *</Label>
              <Select
                value={formData.moneda}
                onValueChange={(v) => setFormData({ ...formData, moneda: v as "MXN" | "USD" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MXN">MXN</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Saldo Inicial</Label>
              <Input
                type="number"
                step="0.01"
                value={formData.saldo_actual}
                onChange={(e) => setFormData({ ...formData, saldo_actual: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createBankAccount.isPending || isUpdating}>
              {(createBankAccount.isPending || isUpdating) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {account ? "Actualizar" : "Crear"} Cuenta
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
