import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Upload, FileText, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  commission: {
    id: string;
    calculated_amount: number;
    tipo: string;
  };
  onSuccess: () => void;
}

const PAYMENT_METHODS = [
  { value: "transferencia", label: "Transferencia Bancaria" },
  { value: "cheque", label: "Cheque" },
  { value: "efectivo", label: "Efectivo" },
  { value: "spei", label: "SPEI" },
  { value: "otro", label: "Otro" },
];

export function PaymentDialog({ open, onOpenChange, commission, onSuccess }: PaymentDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    payment_date: format(new Date(), "yyyy-MM-dd"),
    payment_method: "transferencia",
    payment_reference: "",
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo no puede superar 10MB",
          variant: "destructive",
        });
        return;
      }
      // Validate file type
      const validTypes = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
      if (!validTypes.includes(file.type)) {
        toast({
          title: "Error",
          description: "Solo se permiten archivos PDF o imágenes (JPG, PNG)",
          variant: "destructive",
        });
        return;
      }
      setReceiptFile(file);
    }
  };

  const uploadReceipt = async (): Promise<string | null> => {
    if (!receiptFile) return null;

    const fileExt = receiptFile.name.split(".").pop();
    const fileName = `${commission.id}_${Date.now()}.${fileExt}`;
    const filePath = `${commission.tipo}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("commission_receipts")
      .upload(filePath, receiptFile);

    if (uploadError) {
      console.error("Error uploading receipt:", uploadError);
      throw new Error("Error al subir el comprobante");
    }

    return filePath;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Upload receipt if provided
      let receiptUrl: string | null = null;
      if (receiptFile) {
        receiptUrl = await uploadReceipt();
      }

      // Update commission with payment details
      const { error: updateError } = await supabase
        .from("commissions")
        .update({
          status: "pagada",
          paid_at: new Date().toISOString(),
          payment_date: formData.payment_date,
          payment_method: formData.payment_method,
          payment_reference: formData.payment_reference || null,
          receipt_url: receiptUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", commission.id);

      if (updateError) throw updateError;

      toast({
        title: "Éxito",
        description: "Comisión marcada como pagada correctamente",
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error("Error marking as paid:", error);
      toast({
        title: "Error",
        description: error.message || "Error al procesar el pago",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      payment_date: format(new Date(), "yyyy-MM-dd"),
      payment_method: "transferencia",
      payment_reference: "",
    });
    setReceiptFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Marcar como Pagada</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount Display */}
          <div className="bg-muted/50 rounded-lg p-4 border">
            <div className="text-sm text-muted-foreground">Monto a Pagar</div>
            <div className="text-2xl font-bold">
              ${commission.calculated_amount.toLocaleString("es-MX", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>

          {/* Payment Date */}
          <div className="space-y-2">
            <Label htmlFor="payment_date">Fecha de Pago *</Label>
            <Input
              id="payment_date"
              type="date"
              value={formData.payment_date}
              onChange={(e) =>
                setFormData({ ...formData, payment_date: e.target.value })
              }
              required
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pago *</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) =>
                setFormData({ ...formData, payment_method: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((method) => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Payment Reference */}
          <div className="space-y-2">
            <Label htmlFor="payment_reference">
              Referencia Bancaria (opcional)
            </Label>
            <Input
              id="payment_reference"
              value={formData.payment_reference}
              onChange={(e) =>
                setFormData({ ...formData, payment_reference: e.target.value })
              }
              placeholder="Ej: 123456789"
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              Número de referencia, folio o ID de transacción
            </p>
          </div>

          {/* Receipt Upload */}
          <div className="space-y-2">
            <Label htmlFor="receipt">Comprobante de Pago (opcional)</Label>
            <div className="flex items-center gap-2">
              <Input
                id="receipt"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => document.getElementById("receipt")?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                {receiptFile ? receiptFile.name : "Subir Comprobante"}
              </Button>
            </div>
            {receiptFile && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" />
                <span>Archivo seleccionado: {receiptFile.name}</span>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              PDF o imagen (JPG, PNG). Máximo 10MB
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Procesando..." : "Confirmar Pago"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
