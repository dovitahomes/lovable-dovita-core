import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, DollarSign, Download, FileText, CreditCard } from "lucide-react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface PaymentTimelineProps {
  alianzaId?: string | null;
}

export function PaymentTimeline({ alianzaId }: PaymentTimelineProps) {
  const [periodFilter, setPeriodFilter] = useState("este-mes");

  const getDateRange = () => {
    const now = new Date();
    switch (periodFilter) {
      case "este-mes":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "mes-anterior":
        return {
          start: startOfMonth(subMonths(now, 1)),
          end: endOfMonth(subMonths(now, 1)),
        };
      case "ultimos-3-meses":
        return { start: subMonths(now, 3), end: now };
      case "ultimos-6-meses":
        return { start: subMonths(now, 6), end: now };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const { start, end } = getDateRange();

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payment-timeline", alianzaId, periodFilter],
    queryFn: async () => {
      let query = supabase
        .from("commissions")
        .select(
          `
          id,
          calculated_amount,
          status,
          paid_at,
          payment_date,
          payment_method,
          payment_reference,
          receipt_url,
          tipo,
          deal_ref,
          budgets!inner(
            id,
            projects!inner(
              id,
              name,
              clients!inner(
                name
              )
            )
          )
        `
        )
        .eq("status", "pagada")
        .gte("paid_at", start.toISOString())
        .lte("paid_at", end.toISOString())
        .order("paid_at", { ascending: false });

      if (alianzaId) {
        query = query.eq("sujeto_id", alianzaId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const downloadReceipt = async (receiptUrl: string) => {
    try {
      const { data } = await supabase.storage
        .from("commission_receipts")
        .createSignedUrl(receiptUrl, 3600);

      if (data?.signedUrl) {
        window.open(data.signedUrl, "_blank");
      }
    } catch (error) {
      console.error("Error downloading receipt:", error);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    const methods: Record<string, string> = {
      transferencia: "Transferencia",
      cheque: "Cheque",
      efectivo: "Efectivo",
      spei: "SPEI",
      otro: "Otro",
    };
    return methods[method] || method;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Historial de Pagos</CardTitle>
          <Select value={periodFilter} onValueChange={setPeriodFilter}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="este-mes">Este Mes</SelectItem>
              <SelectItem value="mes-anterior">Mes Anterior</SelectItem>
              <SelectItem value="ultimos-3-meses">Últimos 3 Meses</SelectItem>
              <SelectItem value="ultimos-6-meses">Últimos 6 Meses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {payments && payments.length > 0 ? (
          <div className="space-y-4">
            {payments.map((payment: any) => (
              <div
                key={payment.id}
                className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    {/* Header */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500/10">
                        <DollarSign className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-semibold">
                          ${payment.calculated_amount.toLocaleString("es-MX", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {payment.budgets?.projects?.clients?.name || "Cliente"} -{" "}
                          {payment.budgets?.projects?.name || "Proyecto"}
                        </div>
                      </div>
                      <Badge
                        variant={payment.tipo === "alianza" ? "secondary" : "outline"}
                      >
                        {payment.tipo === "alianza" ? "Alianza" : "Colaborador"}
                      </Badge>
                    </div>

                    {/* Payment Details */}
                    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground ml-13">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {payment.payment_date
                          ? format(new Date(payment.payment_date), "dd MMM yyyy", {
                              locale: es,
                            })
                          : "Sin fecha"}
                      </div>
                      <div className="flex items-center gap-1">
                        <CreditCard className="h-4 w-4" />
                        {getPaymentMethodLabel(payment.payment_method || "otro")}
                      </div>
                      {payment.payment_reference && (
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          Ref: {payment.payment_reference}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {payment.receipt_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadReceipt(payment.receipt_url)}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Comprobante
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay pagos registrados en el período seleccionado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
