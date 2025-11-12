import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Clock, CheckCircle2, Eye } from "lucide-react";
import { CommissionDetailsDialog } from "@/components/commissions/CommissionDetailsDialog";
import { cn } from "@/lib/utils";

interface AllianceCommissionsTabProps {
  allianceId: string;
  allianceName: string;
}

interface BudgetInfo {
  id: string;
  project_id: string;
  projects?: {
    client_id: string;
    clients?: {
      name: string;
    } | null;
  } | null;
}

interface Commission {
  id: string;
  base_amount: number;
  percent: number;
  calculated_amount: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  notes: string | null;
  budgets?: BudgetInfo | null;
}

export function AllianceCommissionsTab({ allianceId, allianceName }: AllianceCommissionsTabProps) {
  const [selectedCommissionId, setSelectedCommissionId] = useState<string | null>(null);

  // Fetch comisiones de esta alianza específica
  const { data: commissions, isLoading } = useQuery({
    queryKey: ['alliance-commissions', allianceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('tipo', 'alianza')
        .eq('sujeto_id', allianceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Fetch budget details separately for each commission
      const commissionsWithBudgets = await Promise.all(
        (data || []).map(async (commission) => {
          const { data: budget } = await supabase
            .from('budgets')
            .select(`
              id,
              project_id,
              projects (
                client_id,
                clients (name)
              )
            `)
            .eq('id', commission.deal_ref)
            .single();
          
          return {
            ...commission,
            budgets: budget || null
          };
        })
      );
      
      return commissionsWithBudgets as Commission[];
    },
    staleTime: 1000 * 60,
  });

  // Calcular stats agregadas
  const stats = {
    totalGenerado: commissions?.reduce((sum, c) => sum + (c.calculated_amount || 0), 0) || 0,
    totalPendiente: commissions?.filter(c => c.status === 'calculada' || c.status === 'pendiente')
      .reduce((sum, c) => sum + (c.calculated_amount || 0), 0) || 0,
    totalPagado: commissions?.filter(c => c.status === 'pagada')
      .reduce((sum, c) => sum + (c.calculated_amount || 0), 0) || 0,
    numeroComisiones: commissions?.length || 0,
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      calculada: { label: 'Calculada', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
      pendiente: { label: 'Pendiente', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' },
      pagada: { label: 'Pagada', className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
    };
    return variants[status as keyof typeof variants] || { label: status, className: 'bg-gray-100 text-gray-700' };
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Total Generado</p>
                <p className="text-2xl font-bold">
                  ${stats.totalGenerado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Pendiente</p>
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  ${stats.totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Pagado</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  ${stats.totalPagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">Comisiones</p>
                <p className="text-2xl font-bold">{stats.numeroComisiones}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de comisiones */}
      <Card>
        <CardHeader>
          <CardTitle>Comisiones de {allianceName}</CardTitle>
          <CardDescription>
            {commissions?.length || 0} comisión{(commissions?.length || 0) !== 1 ? 'es' : ''} generada{(commissions?.length || 0) !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!commissions || commissions.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">No hay comisiones generadas</p>
              <p className="text-sm mt-2">
                Las comisiones se generan automáticamente cuando se publica un presupuesto referido por esta alianza
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente / Proyecto</TableHead>
                  <TableHead>Base</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Comisión</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {commissions.map((commission) => {
                  const statusInfo = getStatusBadge(commission.status);
                  return (
                    <TableRow key={commission.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">
                            {commission.budgets?.projects?.clients?.name || 'Sin cliente'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Presupuesto #{commission.budgets?.id?.slice(0, 8) || 'N/A'}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        ${commission.base_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>{commission.percent}%</TableCell>
                      <TableCell className="font-bold">
                        ${commission.calculated_amount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("text-xs", statusInfo.className)}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">
                            {new Date(commission.created_at).toLocaleDateString('es-MX')}
                          </p>
                          {commission.paid_at && (
                            <p className="text-xs text-muted-foreground">
                              Pagado: {new Date(commission.paid_at).toLocaleDateString('es-MX')}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedCommissionId(commission.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog de detalles */}
      {selectedCommissionId && commissions && (
        <CommissionDetailsDialog
          commission={commissions.find(c => c.id === selectedCommissionId)!}
          open={!!selectedCommissionId}
          onOpenChange={(open) => !open && setSelectedCommissionId(null)}
        />
      )}
    </div>
  );
}
