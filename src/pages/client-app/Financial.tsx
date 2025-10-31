import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { mockProjectData, mockMinistraciones, budgetCategories } from '@/lib/client-data';
import { CheckCircle2, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function Financial() {
  const project = mockProjectData;

  return (
    <div className="h-full overflow-y-auto px-4 pt-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Estado Financiero</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Resumen de pagos y presupuesto del proyecto
        </p>
      </div>

      {/* Financial Summary */}
      <Card className="bg-gradient-to-br from-primary to-primary/80 text-white border-0">
        <CardHeader>
          <CardTitle className="text-lg">Monto Total del Proyecto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-3xl font-bold">
              ${project.totalAmount.toLocaleString('es-MX')}
            </p>
            <p className="text-sm opacity-90 mt-1">MXN</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <p className="text-xs opacity-75">Pagado</p>
              <p className="text-xl font-semibold">
                ${(project.totalPaid / 1000000).toFixed(1)}M
              </p>
            </div>
            <div>
              <p className="text-xs opacity-75">Por Pagar</p>
              <p className="text-xl font-semibold">
                ${(project.totalPending / 1000000).toFixed(1)}M
              </p>
            </div>
          </div>

          <Progress 
            value={(project.totalPaid / project.totalAmount) * 100} 
            className="h-2 bg-white/20"
          />
        </CardContent>
      </Card>

      {/* Ministraciones */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Ministraciones</h2>
        
        {mockMinistraciones.map((ministracion) => (
          <Card key={ministracion.id} className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-semibold">{ministracion.concept}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                    <Calendar className="h-3 w-3" />
                    {format(new Date(ministracion.date), "d 'de' MMMM, yyyy", { locale: es })}
                  </p>
                </div>
                {ministracion.status === 'paid' && (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Pagado
                  </Badge>
                )}
                {ministracion.status === 'pending' && (
                  <Badge className="bg-amber-100 text-amber-700">
                    <Clock className="h-3 w-3 mr-1" />
                    Pendiente
                  </Badge>
                )}
                {ministracion.status === 'future' && (
                  <Badge variant="secondary">
                    Futuro
                  </Badge>
                )}
              </div>
              <p className="text-xl font-bold text-primary">
                ${ministracion.amount.toLocaleString('es-MX')}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Budget Categories */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Presupuesto Ejecutivo</h2>
        <p className="text-sm text-muted-foreground">
          Gastos por categoría principal
        </p>
        
        {budgetCategories.map((category, index) => {
          const percentage = (category.spent / category.budgeted) * 100;
          return (
            <Card key={index}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{category.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {percentage.toFixed(0)}%
                  </p>
                </div>
                <Progress value={percentage} className="h-2" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Gastado: ${(category.spent / 1000).toFixed(0)}k
                  </span>
                  <span className="text-muted-foreground">
                    Total: ${(category.budgeted / 1000).toFixed(0)}k
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
