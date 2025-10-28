import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

interface ReconcileDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: {
    id: string;
    folio: string | null;
    total_amount: number;
    balance: number;
  };
}

interface Transaction {
  id: string;
  date: string;
  amount: number;
  concept: string;
  created_at: string;
}

export function ReconcileDialog({ open, onClose, invoice }: ReconcileDialogProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadTransactions();
    }
  }, [open]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('id, date, amount, concept, created_at')
        .is('cfdi_id', null)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      toast.error('Error al cargar transacciones');
    }
  };

  const handleReconcile = async () => {
    if (!selectedTransactionId) {
      toast.error('Selecciona una transacción');
      return;
    }

    setLoading(true);
    try {
      const selectedTransaction = transactions.find(t => t.id === selectedTransactionId);
      if (!selectedTransaction) return;

      // Link transaction to invoice
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ cfdi_id: invoice.id })
        .eq('id', selectedTransactionId);

      if (updateError) throw updateError;

      // Check if payment covers full amount
      if (selectedTransaction.amount >= invoice.total_amount) {
        // Mark as fully paid
        await supabase
          .from('invoices')
          .update({ paid: true })
          .eq('id', invoice.id);
        
        toast.success('Factura marcada como pagada');
      } else {
        // Insert partial payment
        await supabase
          .from('invoice_payments')
          .insert({
            invoice_id: invoice.id,
            amount: selectedTransaction.amount,
            date: selectedTransaction.date,
            transaction_id: selectedTransactionId
          });
        
        toast.success('Pago parcial registrado');
      }

      onClose();
    } catch (error) {
      console.error('Error reconciling:', error);
      toast.error('Error al conciliar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Conciliar Factura Manualmente</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Folio:</span>
              <span className="font-medium">{invoice.folio || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="font-medium">
                ${invoice.total_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Saldo:</span>
              <span className="font-medium">
                ${invoice.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          <div>
            <Label htmlFor="transaction">Transacción</Label>
            <Select value={selectedTransactionId} onValueChange={setSelectedTransactionId}>
              <SelectTrigger id="transaction">
                <SelectValue placeholder="Selecciona una transacción" />
              </SelectTrigger>
              <SelectContent>
                {transactions.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {format(new Date(t.date), 'dd/MM/yyyy')} - 
                    ${t.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} - 
                    {t.concept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {transactions.length === 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                No hay transacciones disponibles para conciliar
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleReconcile} disabled={loading || !selectedTransactionId}>
              {loading ? 'Conciliando...' : 'Conciliar'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
