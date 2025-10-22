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
import { Plus, TrendingDown, TrendingUp } from "lucide-react";
import { format } from "date-fns";
import { TransactionDialog } from "./TransactionDialog";

export function TransactionsTab() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedType, setSelectedType] = useState<"ingreso" | "egreso">("ingreso");

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        bank_accounts(numero_cuenta, banks(nombre)),
        projects(clients(name)),
        providers(code_short, name),
        clients(name),
        invoices(folio, uuid)
      `)
      .order("date", { ascending: false })
      .limit(50);

    if (error) {
      toast.error("Error al cargar transacciones");
      return;
    }
    setTransactions(data || []);
  };

  const openDialog = (type: "ingreso" | "egreso") => {
    setSelectedType(type);
    setShowDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registrar Ingreso</p>
                <p className="text-2xl font-bold text-green-600">+</p>
              </div>
              <Button onClick={() => openDialog("ingreso")} className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Nuevo Ingreso
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Registrar Egreso</p>
                <p className="text-2xl font-bold text-red-600">-</p>
              </div>
              <Button onClick={() => openDialog("egreso")} variant="outline" className="gap-2">
                <TrendingDown className="h-4 w-4" />
                Nuevo Egreso
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Historial de Transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Cuenta</TableHead>
                <TableHead>Cliente/Proveedor</TableHead>
                <TableHead className="text-right">Monto</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((tx) => (
                <TableRow key={tx.id}>
                  <TableCell>{format(new Date(tx.date), "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant={tx.type === "ingreso" ? "default" : "destructive"}>
                      {tx.type === "ingreso" ? (
                        <TrendingUp className="h-3 w-3 mr-1" />
                      ) : (
                        <TrendingDown className="h-3 w-3 mr-1" />
                      )}
                      {tx.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">{tx.concept}</TableCell>
                  <TableCell className="text-sm">
                    {tx.bank_accounts?.banks?.nombre} - {tx.bank_accounts?.numero_cuenta}
                  </TableCell>
                  <TableCell>
                    {tx.type === "ingreso"
                      ? tx.clients?.name || tx.projects?.clients?.name
                      : tx.providers
                      ? `${tx.providers.code_short} - ${tx.providers.name}`
                      : "-"}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {tx.type === "ingreso" ? "+" : "-"}${tx.amount.toLocaleString()} {tx.currency}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TransactionDialog
        open={showDialog}
        onClose={(reload) => {
          setShowDialog(false);
          if (reload) loadTransactions();
        }}
        type={selectedType}
      />
    </div>
  );
}
