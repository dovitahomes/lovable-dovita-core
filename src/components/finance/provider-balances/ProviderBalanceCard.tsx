import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Building2, FileText, Calendar, Eye, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { ProviderBalance } from "@/hooks/finance/useProviderBalances";

interface ProviderBalanceCardProps {
  provider: ProviderBalance;
  onViewDetails: (providerId: string) => void;
}

export function ProviderBalanceCard({ provider, onViewDetails }: ProviderBalanceCardProps) {
  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  const getStatusBadge = () => {
    switch (provider.status) {
      case 'vencido':
        return (
          <Badge variant="destructive" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" />
            Vencido
          </Badge>
        );
      case 'por_vencer':
        return (
          <Badge variant="secondary" className="gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-400">
            <span className="h-2 w-2 rounded-full bg-amber-600" />
            Por Vencer
          </Badge>
        );
      case 'al_dia':
        return (
          <Badge variant="outline" className="gap-1 text-emerald-700 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />
            Al Día
          </Badge>
        );
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getGradientClass = () => {
    switch (provider.status) {
      case 'vencido':
        return 'from-red-500 to-orange-500';
      case 'por_vencer':
        return 'from-amber-500 to-yellow-500';
      case 'al_dia':
        return 'from-emerald-500 to-teal-500';
    }
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${getGradientClass()} opacity-5`} />
      
      <CardContent className="relative p-6 space-y-4">
        {/* Header with Avatar and Status */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12 border-2 border-border">
              <AvatarFallback className={`bg-gradient-to-br ${getGradientClass()} text-white font-semibold`}>
                {getInitials(provider.providerName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-foreground line-clamp-1">
                {provider.providerName}
              </h3>
              <p className="text-xs text-muted-foreground">
                {provider.providerCode}
              </p>
            </div>
          </div>
          {getStatusBadge()}
        </div>

        {/* Metrics */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Saldo Pendiente</span>
            </div>
            <span className="text-lg font-bold text-foreground">
              {formatCurrency(provider.totalPendiente)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span className="text-sm">Facturas Pendientes</span>
            </div>
            <Badge variant="outline">
              {provider.facturasPendientes}
            </Badge>
          </div>

          {provider.proximoPago && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span className="text-sm">Próximo Pago</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {format(provider.proximoPago, 'dd MMM yyyy', { locale: es })}
                </p>
                {provider.diasVencimiento !== null && (
                  <p className={`text-xs ${
                    provider.diasVencimiento < 0 
                      ? 'text-red-600 dark:text-red-400' 
                      : provider.diasVencimiento <= 7
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-muted-foreground'
                  }`}>
                    {provider.diasVencimiento < 0 
                      ? `Vencido hace ${Math.abs(provider.diasVencimiento)} días`
                      : `En ${provider.diasVencimiento} días`}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(provider.providerId)}
            className="flex-1 gap-2"
          >
            <Eye className="h-4 w-4" />
            Ver Detalles
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1 gap-2"
          >
            <Building2 className="h-4 w-4" />
            Pagar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
