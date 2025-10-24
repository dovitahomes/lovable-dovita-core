import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingDown, Wallet, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FinancialSummaryProps {
  projectId: string;
}

interface FinancialData {
  project_id: string;
  client_id: string;
  client_name: string;
  total_deposits: number;
  total_expenses: number;
  balance: number;
  mayor_id: string | null;
  mayor_code: string | null;
  mayor_name: string | null;
  mayor_expense: number;
}

export function FinancialSummary({ projectId }: FinancialSummaryProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['client-financial-summary', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vw_client_financial_summary')
        .select('*')
        .eq('project_id', projectId);

      if (error) throw error;
      return data as FinancialData[];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-destructive">Error al cargar resumen financiero</p>
        </CardContent>
      </Card>
    );
  }

  // Get summary values (all rows have same summary data)
  const summary = data?.[0] || {
    total_deposits: 0,
    total_expenses: 0,
    balance: 0
  };

  // Filter out rows without mayor data for the breakdown table
  const majorBreakdown = data?.filter(row => row.mayor_id) || [];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600 dark:text-green-400';
    if (balance < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Depósitos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(summary.total_deposits)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Pagos recibidos del cliente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gastos Totales</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {formatCurrency(summary.total_expenses)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Materiales recibidos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getBalanceColor(summary.balance)}`}>
              {formatCurrency(summary.balance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.balance >= 0 ? 'A favor del proyecto' : 'Pendiente de depositar'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by Major */}
      {majorBreakdown.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Desglose por Mayor</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Mayor</TableHead>
                  <TableHead className="text-right">Gasto</TableHead>
                  <TableHead className="text-right">% del Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {majorBreakdown.map((item) => {
                  const percentage = summary.total_expenses > 0
                    ? (item.mayor_expense / summary.total_expenses) * 100
                    : 0;

                  return (
                    <TableRow key={item.mayor_id}>
                      <TableCell className="font-mono text-sm">
                        {item.mayor_code}
                      </TableCell>
                      <TableCell className="font-medium">
                        {item.mayor_name}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.mayor_expense)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">
                          {percentage.toFixed(1)}%
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="bg-muted/50 font-semibold">
                  <TableCell colSpan={2}>Total</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(summary.total_expenses)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge>100%</Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {majorBreakdown.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              No hay gastos registrados aún
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
