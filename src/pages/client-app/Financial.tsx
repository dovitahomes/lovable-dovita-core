import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { useClientMinistrations, useClientFinancialSummary } from '@/hooks/client-app/useClientData';
import { CheckCircle2, Clock, Calendar, AlertCircle, DollarSign, TrendingUp, Filter } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { isInDesignPhase } from '@/lib/project-utils';

type FilterStatus = 'all' | 'paid' | 'pending' | 'future';

export default function Financial() {
  const { currentProject } = useProject();
  const project = currentProject;
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  
  // Fetch data using unified hooks
  const { data: ministrations = [], isLoading: loadingMinistrations } = useClientMinistrations(project?.id || null);
  const { data: financialSummary } = useClientFinancialSummary(project?.id || null);
  
  if (!project) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="text-lg font-medium text-muted-foreground">Cargando datos financieros...</p>
        </div>
      </div>
    );
  }

  const inDesignPhase = isInDesignPhase(project);
  
  // Calculate totals from financial summary or fallback to project data
  const totalAmount = financialSummary?.total_amount || project.totalAmount || 5000000;
  const totalPaid = financialSummary?.spent_amount || project.totalPaid || 0;
  const totalPending = totalAmount - totalPaid;
  const percentPaid = (totalPaid / totalAmount) * 100;

  // Filter ministrations
  const filteredMinistrations = statusFilter === 'all' 
    ? ministrations 
    : ministrations.filter(m => m.status === statusFilter);

  // Find next pending payment
  const nextPayment = ministrations.find(m => m.status === 'pending' || m.status === 'future');
  
  // Count by status
  const paidCount = ministrations.filter(m => m.status === 'paid').length;
  const pendingCount = ministrations.filter(m => m.status === 'pending').length;
  const futureCount = ministrations.filter(m => m.status === 'future').length;

  const formatAmount = (amount: number) => {
    if (inDesignPhase) {
      return `$${amount.toLocaleString('es-MX')}`;
    }
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}k`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'future':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle2 className="h-3 w-3" />;
      case 'pending':
        return <AlertCircle className="h-3 w-3" />;
      case 'future':
        return <Clock className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Pagado';
      case 'pending':
        return 'Pendiente';
      case 'future':
        return 'Futuro';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className="h-full overflow-y-auto pb-[130px]">
      {/* Header con Degradado */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-white px-4 py-6 mb-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold mb-1">Pagos y Presupuesto</h1>
            <p className="text-sm text-white/90">
              Seguimiento financiero del proyecto
            </p>
          </div>
          {/* Badge Progreso */}
          <div className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              <span className="font-semibold">{Math.round(percentPaid)}%</span>
            </div>
            <p className="text-xs text-white/80 mt-1">pagado</p>
          </div>
        </div>
      </div>

      <div className="px-4 space-y-4">
        {/* Financial Summary Card */}
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total del Proyecto</p>
                <p className="text-3xl font-bold text-primary">
                  {formatAmount(totalAmount)}
                </p>
              </div>
              <TrendingUp className="h-12 w-12 text-primary/20" />
            </div>
            
            <Progress value={percentPaid} className="h-3" />
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Pagado</p>
                <p className="text-lg font-bold text-green-600">
                  {formatAmount(totalPaid)}
                </p>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <p className="text-xs text-muted-foreground mb-1">Por Pagar</p>
                <p className="text-lg font-bold text-orange-600">
                  {formatAmount(totalPending)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Payment Destacado */}
        {nextPayment && (
          <Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <CardTitle className="text-sm text-amber-900">Próximo Pago</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-semibold text-base">{nextPayment.concept}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(nextPayment.date), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm text-muted-foreground">Monto</span>
                <p className="text-2xl font-bold text-amber-700">
                  {formatAmount(nextPayment.amount)}
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Filtros */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtrar Pagos</span>
          </div>
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="all" className="text-xs">
                Todos ({ministrations.length})
              </TabsTrigger>
              <TabsTrigger value="paid" className="text-xs">
                Pagados ({paidCount})
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs">
                Pendientes ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="future" className="text-xs">
                Futuros ({futureCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </Card>

        {/* Historial de Pagos */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Historial de Pagos</h2>
          
          {loadingMinistrations ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">Cargando pagos...</p>
            </Card>
          ) : filteredMinistrations.length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">
                No hay pagos {statusFilter !== 'all' ? `con estado "${getStatusLabel(statusFilter)}"` : 'disponibles'}
              </p>
            </Card>
          ) : (
            filteredMinistrations.map((ministracion) => (
              <Card 
                key={ministracion.id} 
                className={`border-l-4 ${
                  ministracion.status === 'paid' 
                    ? 'border-l-green-500' 
                    : ministracion.status === 'pending'
                    ? 'border-l-amber-500'
                    : 'border-l-gray-300'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-semibold">{ministracion.concept}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(ministracion.date), "d 'de' MMMM, yyyy", { locale: es })}
                      </p>
                    </div>
                    <Badge className={getStatusColor(ministracion.status)}>
                      {getStatusIcon(ministracion.status)}
                      <span className="ml-1">{getStatusLabel(ministracion.status)}</span>
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-sm text-muted-foreground">Monto</span>
                    <p className="text-xl font-bold text-primary">
                      {formatAmount(ministracion.amount)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
