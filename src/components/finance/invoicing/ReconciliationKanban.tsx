import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useBankReconciliation } from "@/hooks/useBankTransactions";
import { useReconcileBankTransaction, useUnreconcileBankTransaction } from "@/hooks/useBankTransactions";
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { AlertCircle, CheckCircle2, Clock, Link2, Unlink } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ReconciliationColumn {
  id: string;
  title: string;
  icon: React.ReactNode;
  gradient: string;
}

export function ReconciliationKanban() {
  const { data: reconciliation, isLoading } = useBankReconciliation();
  const reconcileMutation = useReconcileBankTransaction();
  const unreconcileMutation = useUnreconcileBankTransaction();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeTransaction = reconciliation?.find(r => r.transaction_id === active.id);
    if (!activeTransaction) return;

    // Si arrastramos a la columna de "conciliadas" y hay una factura disponible
    if (over.id === 'reconciled' && activeTransaction.invoice_id && !activeTransaction.reconciled) {
      reconcileMutation.mutate({
        transactionId: activeTransaction.transaction_id,
        invoiceId: activeTransaction.invoice_id,
      });
    }
  };

  const columns: ReconciliationColumn[] = [
    {
      id: 'unreconciled',
      title: 'Por Conciliar',
      icon: <Clock className="h-5 w-5" />,
      gradient: 'from-amber-500/10 to-orange-500/10 dark:from-amber-500/20 dark:to-orange-500/20',
    },
    {
      id: 'reconciled',
      title: 'Conciliadas',
      icon: <CheckCircle2 className="h-5 w-5" />,
      gradient: 'from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20',
    },
    {
      id: 'differences',
      title: 'Con Diferencias',
      icon: <AlertCircle className="h-5 w-5" />,
      gradient: 'from-red-500/10 to-pink-500/10 dark:from-red-500/20 dark:to-pink-500/20',
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {columns.map((col) => (
          <Card key={col.id}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const unreconciled = reconciliation?.filter(r => !r.reconciled) || [];
  const reconciled = reconciliation?.filter(r => r.reconciled && r.reconciled_exact) || [];
  const differences = reconciliation?.filter(r => r.reconciled && !r.reconciled_exact) || [];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getColumnData = (columnId: string) => {
    switch (columnId) {
      case 'unreconciled':
        return unreconciled;
      case 'reconciled':
        return reconciled;
      case 'differences':
        return differences;
      default:
        return [];
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Conciliación Bancaria</h3>
        <div className="flex gap-2">
          <Badge variant="secondary">{unreconciled.length} por conciliar</Badge>
          <Badge variant="default" className="bg-emerald-500">{reconciled.length} conciliadas</Badge>
        </div>
      </div>

      <DndContext 
        sensors={sensors} 
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {columns.map((column, index) => {
            const items = getColumnData(column.id);
            
            return (
              <Card
                key={column.id}
                className={cn(
                  "animate-in fade-in slide-in-from-bottom-4"
                )}
                style={{ animationDelay: `${index * 100}ms`, animationFillMode: 'backwards' }}
              >
                <CardHeader className={cn("pb-4", `bg-gradient-to-br ${column.gradient}`)}>
                  <CardTitle className="flex items-center gap-2 text-base">
                    {column.icon}
                    {column.title}
                    <Badge variant="secondary" className="ml-auto">{items.length}</Badge>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-4" id={column.id}>
                  <SortableContext items={items.map(i => i.transaction_id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {items.map((item) => (
                        <div
                          key={item.transaction_id}
                          className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between">
                              <p className="text-sm font-medium truncate flex-1">
                                {item.description || 'Sin descripción'}
                              </p>
                              <Badge variant={item.type === 'ingreso' ? 'default' : 'destructive'} className="text-xs ml-2">
                                {item.type === 'ingreso' ? 'In' : 'Out'}
                              </Badge>
                            </div>
                            
                            <p className="text-lg font-bold text-foreground">
                              {formatCurrency(item.amount || 0)}
                            </p>
                            
                            <p className="text-xs text-muted-foreground">
                              {item.date ? format(new Date(item.date), 'dd MMM yyyy', { locale: es }) : 'Sin fecha'}
                            </p>

                            {item.invoice_id && (
                              <div className="pt-2 border-t flex items-center justify-between">
                                <div className="text-xs text-muted-foreground truncate flex-1">
                                  {item.supplier_name || 'Sin proveedor'}
                                </div>
                                {column.id === 'reconciled' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => unreconcileMutation.mutate(item.transaction_id)}
                                    className="h-6 text-xs gap-1"
                                  >
                                    <Unlink className="h-3 w-3" />
                                    Desconciliar
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}

                      {items.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No hay movimientos en esta categoría
                        </div>
                      )}
                    </div>
                  </SortableContext>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </DndContext>
    </div>
  );
}
