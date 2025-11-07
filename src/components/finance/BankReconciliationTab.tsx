import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useBankReconciliation, useReconcileBankTransaction, useUnreconcileBankTransaction } from "@/hooks/useBankTransactions";
import { Check, X, Search, ArrowLeftRight } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function BankReconciliationTab() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showReconciled, setShowReconciled] = useState(false);
  
  const { data: reconciliation, isLoading } = useBankReconciliation({
    reconciled: showReconciled ? undefined : false,
  });
  
  const reconcileMutation = useReconcileBankTransaction();
  const unreconcileMutation = useUnreconcileBankTransaction();

  const filteredData = reconciliation?.filter((item) => {
    const search = searchTerm.toLowerCase();
    return (
      item.description?.toLowerCase().includes(search) ||
      item.supplier_name?.toLowerCase().includes(search) ||
      item.reference?.toLowerCase().includes(search) ||
      item.uuid_cfdi?.toLowerCase().includes(search)
    );
  });

  const autoMatches = filteredData?.filter((item) => item.reconciled_exact && !item.reconciled).length || 0;

  const handleReconcile = (transactionId: string, invoiceId: string) => {
    reconcileMutation.mutate({ transactionId, invoiceId });
  };

  const handleUnreconcile = (transactionId: string) => {
    if (confirm("¿Deshacer esta conciliación?")) {
      unreconcileMutation.mutate(transactionId);
    }
  };

  return (
    <div className="space-y-4">
      {autoMatches > 0 && (
        <Alert>
          <ArrowLeftRight className="h-4 w-4" />
          <AlertDescription>
            Se encontraron {autoMatches} coincidencia(s) automática(s) por monto
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="h-5 w-5" />
              Conciliación Bancaria
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button
                variant={showReconciled ? "default" : "outline"}
                size="sm"
                onClick={() => setShowReconciled(!showReconciled)}
              >
                {showReconciled ? "Ocultar" : "Mostrar"} Conciliados
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando movimientos...
            </div>
          ) : !filteredData || filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay movimientos bancarios
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Monto</TableHead>
                    <TableHead>Factura UUID</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead>Total Factura</TableHead>
                    <TableHead>Diferencia</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((item) => (
                    <TableRow
                      key={item.transaction_id}
                      className={item.reconciled_exact && !item.reconciled ? "bg-green-50 dark:bg-green-950/20" : ""}
                    >
                      <TableCell className="text-sm">
                        {new Date(item.date).toLocaleDateString('es-MX')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.bank_name || "—"}
                        <br />
                        <span className="text-xs text-muted-foreground">
                          {item.numero_cuenta || ""}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {item.description || "—"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        <Badge variant={item.type === "egreso" ? "destructive" : "default"}>
                          {new Intl.NumberFormat('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                          }).format(item.amount)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                        {item.uuid_cfdi || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.supplier_name || "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {item.invoice_total
                          ? new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: 'MXN',
                            }).format(item.invoice_total)
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {item.diff !== null && item.diff !== undefined ? (
                          <Badge
                            variant={item.reconciled_exact ? "default" : "secondary"}
                          >
                            {new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: 'MXN',
                            }).format(item.diff)}
                          </Badge>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell>
                        {item.reconciled ? (
                          <Badge variant="default" className="gap-1">
                            <Check className="h-3 w-3" />
                            Conciliado
                          </Badge>
                        ) : item.reconciled_exact ? (
                          <Badge variant="outline" className="gap-1 border-green-500 text-green-500">
                            ✓ Coincide
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Pendiente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.reconciled ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUnreconcile(item.transaction_id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        ) : item.invoice_id ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReconcile(item.transaction_id, item.invoice_id!)}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Conciliar
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
