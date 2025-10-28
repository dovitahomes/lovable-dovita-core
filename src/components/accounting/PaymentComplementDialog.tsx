import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const paymentSchema = z.object({
  amount: z.coerce.number().positive("El monto debe ser mayor a 0"),
  date: z.string().min(1, "Selecciona una fecha"),
  transaction_id: z.string().optional(),
});

type PaymentFormData = z.infer<typeof paymentSchema>;

interface PaymentComplementDialogProps {
  open: boolean;
  onClose: (reload: boolean) => void;
  invoice: any;
}

export function PaymentComplementDialog({
  open,
  onClose,
  invoice,
}: PaymentComplementDialogProps) {
  const [transactions, setTransactions] = useState<any[]>([]);

  const form = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amount: 0,
      date: new Date().toISOString().split("T")[0],
      transaction_id: "",
    },
  });

  useEffect(() => {
    if (open && invoice) {
      loadTransactions();
      form.reset({
        amount: invoice.balance || 0,
        date: new Date().toISOString().split("T")[0],
        transaction_id: "",
      });
    }
  }, [open, invoice]);

  const loadTransactions = async () => {
    // Load relevant transactions based on invoice type
    const type = invoice.tipo === "ingreso" ? "ingreso" : "egreso";
    
    const { data } = await supabase
      .from("transactions")
      .select("*, bank_accounts(numero_cuenta, banks(nombre))")
      .eq("type", type)
      .is("cfdi_id", null)
      .order("date", { ascending: false })
      .limit(20);

    setTransactions(data || []);
  };

  const onSubmit = async (data: PaymentFormData) => {
    if (!invoice) return;

    if (data.amount > invoice.balance) {
      toast.error("El monto no puede ser mayor al saldo pendiente");
      return;
    }

    try {
      const { error } = await supabase.from("invoice_payments").insert({
        invoice_id: invoice.id,
        transaction_id: data.transaction_id || null,
        amount: data.amount,
        date: data.date,
      });

      if (error) throw error;

      // Update invoice paid status if fully paid
      if (data.amount >= invoice.balance) {
        await supabase
          .from("invoices")
          .update({ paid: true })
          .eq("id", invoice.id);
      }

      toast.success("Complemento de pago registrado");
      form.reset();
      onClose(true);
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  if (!invoice) return null;

  return (
    <Dialog open={open} onOpenChange={() => onClose(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar Complemento de Pago (PPD)</DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-4 bg-muted rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Folio:</span>
            <span className="font-medium">{invoice.folio || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Método de Pago:</span>
            <span className="font-medium">
              {invoice.metodo_pago === 'PUE' ? 'PUE (Pago único)' : 'PPD (Pago en parcialidades)'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total:</span>
            <span className="font-medium">
              ${invoice.total_amount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Pagado:</span>
            <span className="font-medium">
              ${invoice.total_paid?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Saldo:</span>
            <span className="font-medium text-primary">
              ${invoice.balance?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </span>
          </div>
          {invoice.metodo_pago === 'PUE' && invoice.total_paid > 0 && (
            <p className="text-sm text-amber-600 mt-2">
              ⚠️ Esta factura es PUE y ya tiene un pago registrado
            </p>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monto del Pago *</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha del Pago *</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="transaction_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vincular con Transacción Bancaria</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar transacción (opcional)" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {transactions.map((tx) => (
                        <SelectItem key={tx.id} value={tx.id}>
                          {tx.bank_accounts?.banks?.nombre} - ${tx.amount} ({tx.date})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onClose(false)}>
                Cancelar
              </Button>
              <Button type="submit">Registrar Pago</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
