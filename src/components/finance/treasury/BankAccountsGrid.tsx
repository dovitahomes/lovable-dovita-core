import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Building2, Eye, TrendingUp, Wallet } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function BankAccountsGrid() {
  const { data: accounts, isLoading } = useQuery({
    queryKey: ['bank-accounts-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bank_accounts')
        .select('*, banks(*)')
        .eq('activa', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const activeAccounts = accounts || [];

  if (activeAccounts.length === 0) {
    return (
      <Card className="col-span-full">
        <CardContent className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground mb-2">
            No hay cuentas bancarias activas
          </p>
          <p className="text-sm text-muted-foreground">
            Agrega una cuenta bancaria desde la sección de Bancos
          </p>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getBankGradient = (index: number) => {
    const gradients = [
      'from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20',
      'from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20',
      'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
      'from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20',
      'from-pink-500/10 to-rose-500/10 dark:from-pink-500/20 dark:to-rose-500/20',
    ];
    return gradients[index % gradients.length];
  };

  const getBankIconColor = (index: number) => {
    const colors = [
      'text-blue-600 dark:text-blue-400',
      'text-violet-600 dark:text-violet-400',
      'text-emerald-600 dark:text-emerald-400',
      'text-orange-600 dark:text-orange-400',
      'text-pink-600 dark:text-pink-400',
    ];
    return colors[index % colors.length];
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">Cuentas Bancarias</h3>
        <Badge variant="secondary" className="gap-1">
          <Wallet className="h-3 w-3" />
          {activeAccounts.length} activas
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeAccounts.map((account, index) => (
          <Card
            key={account.id}
            className={cn(
              "group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
              "animate-in fade-in slide-in-from-bottom-4"
            )}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
          >
            <CardContent className="p-6">
              <div className={cn(
                "p-4 rounded-xl bg-gradient-to-br mb-4 inline-flex",
                getBankGradient(index)
              )}>
                <Building2 className={cn("h-6 w-6", getBankIconColor(index))} />
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {account.banks?.nombre || 'Banco'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    •••• {account.numero_cuenta?.slice(-4) || '****'}
                  </p>
                </div>

                <div className="pt-2 border-t">
                  <p className="text-sm text-muted-foreground mb-1">Saldo Actual</p>
                  <p className="text-2xl font-bold text-foreground">
                    {formatCurrency(account.saldo_actual || 0)}
                  </p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {account.moneda || 'MXN'}
                  </Badge>
                </div>

                <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="sm" className="flex-1 gap-2">
                    <Eye className="h-4 w-4" />
                    Ver
                  </Button>
                  <Button variant="ghost" size="sm" className="flex-1 gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Movimientos
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
