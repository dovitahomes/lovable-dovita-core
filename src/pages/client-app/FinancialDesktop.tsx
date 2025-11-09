import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProject } from "@/contexts/client-app/ProjectContext";
import { useClientMinistrations, useClientFinancialSummary } from "@/hooks/client-app/useClientData";
import { isInDesignPhase } from "@/lib/project-utils";
import { DollarSign, TrendingUp, TrendingDown, CreditCard, CheckCircle2, Clock, Calendar, AlertCircle, Filter } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ClientLoadingState, ClientEmptyState, ClientErrorState } from '@/components/client-app/ClientSkeletons';
import { useClientError } from '@/hooks/client-app/useClientError';

type FilterStatus = 'all' | 'paid' | 'pending' | 'future';

export default function FinancialDesktop() {
  const { currentProject } = useProject();
  const { handleError } = useClientError();
  const project = currentProject;
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  
  // Fetch data using unified hooks
  const { data: ministrations = [], isLoading: loadingMinistrations, error: ministrationsError, refetch: refetchMinistrations } = useClientMinistrations(project?.id || null);
  const { data: financialSummary, error: financialError, refetch: refetchFinancial } = useClientFinancialSummary(project?.id || null);
  
  const hasError = ministrationsError || financialError;
  const handleRetry = () => {
    refetchMinistrations();
    refetchFinancial();
  };
  
  if (!project) {
    return <ClientLoadingState message="Cargando datos financieros..." />;
  }
  
  if (hasError) {
    return (
      <div className="h-[calc(100vh-100px)] overflow-y-auto space-y-6 pr-2 flex items-center justify-center">
        <ClientErrorState
          title="Error al cargar información financiera"
          description="No pudimos obtener los datos financieros. Verifica tu conexión e intenta nuevamente."
          onRetry={handleRetry}
          icon={DollarSign}
        />
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
        return 'default';
      case 'pending':
        return 'outline';
      case 'future':
        return 'secondary';
      default:
        return 'secondary';
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
    <div className="h-[calc(100vh-100px)] overflow-y-auto space-y-6 pr-2">
      <div>
        <h1 className="text-3xl font-bold mb-2">Información Financiera</h1>
        <p className="text-muted-foreground">Gestión de pagos y presupuesto</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-fade-in">
        <Card className="hover-lift transition-smooth">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatAmount(totalAmount)}</div>
            <p className="text-xs text-muted-foreground mt-1">Costo total del proyecto</p>
          </CardContent>
        </Card>

        <Card className="hover-lift transition-smooth" style={{ animationDelay: '0.05s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pagado</CardTitle>
            <TrendingDown className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{formatAmount(totalPaid)}</div>
            <p className="text-xs text-muted-foreground mt-1">{percentPaid.toFixed(1)}% del presupuesto</p>
          </CardContent>
        </Card>

        <Card className="hover-lift transition-smooth" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Por Pagar</CardTitle>
            <TrendingUp className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatAmount(totalPending)}</div>
            <p className="text-xs text-muted-foreground mt-1">{(100 - percentPaid).toFixed(1)}% restante</p>
          </CardContent>
        </Card>

        <Card className="hover-lift transition-smooth" style={{ animationDelay: '0.15s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Próximo Pago</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {nextPayment ? (
              <>
                <div className="text-2xl font-bold">{formatAmount(nextPayment.amount)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Vence el {format(new Date(nextPayment.date), "d MMM yyyy", { locale: es })}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Sin pagos pendientes</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Next Payment Destacado */}
      {nextPayment && (
        <Card className="border-l-4 border-l-amber-500 bg-amber-50/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <CardTitle>Próximo Pago Programado</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-lg">{nextPayment.concept}</p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(nextPayment.date), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold text-amber-700">{formatAmount(nextPayment.amount)}</p>
                <Badge className="mt-2 bg-amber-100 text-amber-700">
                  {getStatusLabel(nextPayment.status)}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Historial de Pagos</CardTitle>
            </div>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
              <TabsList>
                <TabsTrigger value="all">Todos ({ministrations.length})</TabsTrigger>
                <TabsTrigger value="paid">Pagados ({paidCount})</TabsTrigger>
                <TabsTrigger value="pending">Pendientes ({pendingCount})</TabsTrigger>
                <TabsTrigger value="future">Futuros ({futureCount})</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          {loadingMinistrations ? (
            <ClientLoadingState message="Cargando pagos..." />
          ) : filteredMinistrations.length === 0 ? (
            <ClientEmptyState
              icon={DollarSign}
              title="No hay pagos"
              description={`No hay pagos ${statusFilter !== 'all' ? `con estado "${getStatusLabel(statusFilter)}"` : 'disponibles'}`}
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Concepto</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMinistrations.map((payment) => (
                  <TableRow key={payment.id} className="hover-lift transition-smooth">
                    <TableCell className="font-medium">
                      {format(new Date(payment.date), "d MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>{payment.concept}</TableCell>
                    <TableCell className="font-bold">{formatAmount(payment.amount)}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(payment.status)}>
                        {getStatusLabel(payment.status)}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
