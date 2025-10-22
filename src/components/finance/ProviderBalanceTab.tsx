import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { TrendingDown } from "lucide-react";

export function ProviderBalanceTab() {
  const [providers, setProviders] = useState<any[]>([]);
  const [balances, setBalances] = useState<Map<string, any>>(new Map());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const { data: providersData, error } = await supabase
      .from("providers")
      .select("*")
      .eq("activo", true)
      .order("name");

    if (error) {
      toast.error("Error al cargar proveedores");
      return;
    }

    setProviders(providersData || []);

    // Load balances
    const balanceMap = new Map();
    for (const provider of providersData || []) {
      const { data } = await supabase.rpc("get_provider_balance", {
        p_provider_id: provider.id,
      });

      if (data && data.length > 0) {
        balanceMap.set(provider.id, data[0]);
      }
    }
    setBalances(balanceMap);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Relación de Proveedores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-right">Total Facturado</TableHead>
                <TableHead className="text-right">Total Pagado</TableHead>
                <TableHead className="text-right">Saldo Pendiente</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => {
                const balance = balances.get(provider.id);
                const totalInvoiced = balance?.total_invoiced || 0;
                const totalPaid = balance?.total_paid || 0;
                const pending = balance?.balance || 0;

                return (
                  <TableRow key={provider.id}>
                    <TableCell className="font-mono font-semibold">
                      {provider.code_short}
                    </TableCell>
                    <TableCell>{provider.name}</TableCell>
                    <TableCell className="text-right">
                      ${totalInvoiced.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right text-green-600">
                      ${totalPaid.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      ${pending.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {pending > 0 ? (
                        <Badge variant="destructive">Pendiente</Badge>
                      ) : (
                        <Badge variant="default">Al Corriente</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
