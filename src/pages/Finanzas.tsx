import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, FileText, BarChart3, Hammer, AlertCircle, ArrowRight } from "lucide-react";
import { useModuleAccess } from "@/hooks/useModuleAccess";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTreasuryStats } from "@/hooks/finance/useTreasuryStats";
import { Skeleton } from "@/components/ui/skeleton";

interface FinanceModuleCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  route: string;
  stats?: {
    label: string;
    value: string;
  }[];
}

export default function Finanzas() {
  const { canView } = useModuleAccess();
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = useTreasuryStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  if (!canView('finanzas')) {
    return (
      <div className="container mx-auto p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Acceso Denegado</AlertTitle>
          <AlertDescription>
            No tienes permisos para ver este módulo.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const modules: FinanceModuleCard[] = [
    {
      id: 'treasury',
      title: 'Tesorería',
      description: 'Gestiona cuentas bancarias, movimientos y conciliación',
      icon: <Building2 className="h-8 w-8" />,
      gradient: 'from-blue-500/10 to-cyan-500/10 dark:from-blue-500/20 dark:to-cyan-500/20',
      route: '/finanzas/tesoreria',
      stats: statsLoading ? [
        { label: 'Cuentas Activas', value: '...' },
        { label: 'Balance Total', value: '...' }
      ] : [
        { label: 'Cuentas Activas', value: `${stats?.activeAccounts || 0}` },
        { label: 'Balance Total', value: formatCurrency(stats?.totalBalance || 0) }
      ]
    },
    {
      id: 'invoicing',
      title: 'Facturación',
      description: 'Administra facturas, lotes de pago y XML SAT',
      icon: <FileText className="h-8 w-8" />,
      gradient: 'from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20',
      route: '/finanzas/facturacion',
      stats: [
        { label: 'Por Pagar', value: '-' },
        { label: 'Lotes Activos', value: '-' }
      ]
    },
    {
      id: 'reports',
      title: 'Reportes',
      description: 'Genera reportes financieros y análisis de saldos',
      icon: <BarChart3 className="h-8 w-8" />,
      gradient: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
      route: '/finanzas/reportes',
      stats: statsLoading ? [
        { label: 'Ingresos del Mes', value: '...' },
        { label: 'Egresos del Mes', value: '...' }
      ] : [
        { label: 'Ingresos del Mes', value: formatCurrency(stats?.monthIncome || 0) },
        { label: 'Egresos del Mes', value: formatCurrency(stats?.monthExpenses || 0) }
      ]
    },
    {
      id: 'construction',
      title: 'Construcción',
      description: 'Monitorea gastos por proyecto y consumo de presupuesto',
      icon: <Hammer className="h-8 w-8" />,
      gradient: 'from-orange-500/10 to-red-500/10 dark:from-orange-500/20 dark:to-red-500/20',
      route: '/finanzas/construccion',
      stats: [
        { label: 'Proyectos Activos', value: '-' },
        { label: 'Alertas', value: '-' }
      ]
    }
  ];

  return (
    <div className="container max-w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">Finanzas</h1>
            <p className="text-sm text-muted-foreground">
              Centro de control financiero y tesorería
            </p>
          </div>
        </div>
      </div>

      {/* Module Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module, index) => (
          <Card
            key={module.id}
            className={cn(
              "group cursor-pointer transition-all duration-300",
              "hover:scale-[1.02] hover:shadow-lg",
              "border-2 hover:border-primary/50",
              "animate-in fade-in slide-in-from-bottom-4"
            )}
            style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
            onClick={() => navigate(module.route)}
          >
            <CardHeader className="space-y-4">
              <div className="flex items-start justify-between">
                <div className={cn(
                  "p-4 rounded-xl bg-gradient-to-br transition-transform group-hover:scale-110",
                  module.gradient
                )}>
                  {module.icon}
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="space-y-1">
                <CardTitle className="text-2xl group-hover:text-primary transition-colors">
                  {module.title}
                </CardTitle>
                <CardDescription className="text-base">
                  {module.description}
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {module.stats?.map((stat) => (
                  <div key={stat.label} className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      {stat.label}
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Access Info */}
      <div className="mt-8 p-4 rounded-lg bg-muted/50 border">
        <p className="text-sm text-muted-foreground text-center">
          💡 <span className="font-medium">Consejo:</span> Haz clic en cualquier módulo para acceder a sus funcionalidades
        </p>
      </div>
    </div>
  );
}
