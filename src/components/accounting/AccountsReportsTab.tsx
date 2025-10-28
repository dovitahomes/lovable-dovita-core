import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

export function AccountsReportsTab() {
  const [receivables, setReceivables] = useState<any[]>([]);
  const [payables, setPayables] = useState<any[]>([]);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    // Load accounts receivable
    const { data: receivablesData, error: recError } = await supabase.rpc(
      "get_accounts_receivable"
    );

    if (recError) {
      toast.error("Error al cargar cuentas por cobrar");
    } else {
      setReceivables(receivablesData || []);
    }

    // Load accounts payable
    const { data: payablesData, error: payError } = await supabase.rpc(
      "get_accounts_payable"
    );

    if (payError) {
      toast.error("Error al cargar cuentas por pagar");
    } else {
      setPayables(payablesData || []);
    }
  };

  const exportToExcel = async (type: "receivable" | "payable") => {
    try {
      const { exportToExcel: exportFn } = await import('@/utils/lazyExports');
      const data = type === "receivable" ? receivables : payables;
      const filename = type === "receivable" ? 'cuentas_por_cobrar' : 'cuentas_por_pagar';
      
      exportFn(
        data.map(item => ({
          [type === "receivable" ? 'Cliente' : 'Proveedor']: item.client_name || item.provider_name || 'N/A',
          'Total Facturado': item.total_invoiced || 0,
          'Total Pagado': item.total_paid || 0,
          'Saldo': item.balance || 0,
          'Fecha Factura Más Antigua': item.oldest_invoice_date ? format(new Date(item.oldest_invoice_date), 'dd/MM/yyyy') : 'N/A'
        })),
        filename
      );
      toast.success('Exportado a Excel');
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('Error al exportar');
    }
  };

  const totalReceivable = receivables.reduce((sum, r) => sum + (r.balance || 0), 0);
  const totalPayable = payables.reduce((sum, p) => sum + (p.balance || 0), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cuentas por Cobrar</p>
                <p className="text-3xl font-bold text-green-600">
                  ${totalReceivable.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Cuentas por Pagar</p>
                <p className="text-3xl font-bold text-red-600">
                  ${totalPayable.toLocaleString()}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cuentas por Cobrar</CardTitle>
          <Button onClick={() => exportToExcel("receivable")} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Total Facturado</TableHead>
                <TableHead className="text-right">Total Pagado</TableHead>
                <TableHead className="text-right">Saldo Pendiente</TableHead>
                <TableHead>Factura Más Antigua</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {receivables.map((rec, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{rec.client_name || "Sin nombre"}</TableCell>
                  <TableCell className="text-right">
                    ${rec.total_invoiced?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    ${rec.total_paid?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${rec.balance?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {rec.oldest_invoice_date
                      ? format(new Date(rec.oldest_invoice_date), "dd/MM/yyyy")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Cuentas por Pagar</CardTitle>
          <Button onClick={() => exportToExcel("payable")} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-right">Total Facturado</TableHead>
                <TableHead className="text-right">Total Pagado</TableHead>
                <TableHead className="text-right">Saldo Pendiente</TableHead>
                <TableHead>Factura Más Antigua</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payables.map((pay, idx) => (
                <TableRow key={idx}>
                  <TableCell className="font-medium">{pay.provider_name || "Sin nombre"}</TableCell>
                  <TableCell className="text-right">
                    ${pay.total_invoiced?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    ${pay.total_paid?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${pay.balance?.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {pay.oldest_invoice_date
                      ? format(new Date(pay.oldest_invoice_date), "dd/MM/yyyy")
                      : "-"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
