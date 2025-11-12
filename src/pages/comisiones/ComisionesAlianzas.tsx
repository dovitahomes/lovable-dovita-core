import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { BACKOFFICE_ROUTES } from "@/config/routes";
import { Handshake, CheckCircle2, Eye, FileDown } from "lucide-react";
import { AllianceCard } from "@/components/commissions/AllianceCard";
import { CommissionFilters } from "@/components/commissions/CommissionFilters";
import { CommissionDetailsDialog } from "@/components/commissions/CommissionDetailsDialog";
import { useAlliancesWithCommissions, useAllianceCommissions, useMarkCommissionAsPaid, useBulkMarkAsPaid } from "@/hooks/commissions/useAllianceCommissions";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function ComisionesAlianzas() {
  const [selectedAllianceId, setSelectedAllianceId] = useState<string | undefined>();
  const [selectedCommissionIds, setSelectedCommissionIds] = useState<string[]>([]);
  const [detailsCommission, setDetailsCommission] = useState<any>(null);
  const [filters, setFilters] = useState<any>({ status: 'all' });

  const { data: alliances, isLoading: loadingAlliances } = useAlliancesWithCommissions();
  const { data: commissions, isLoading: loadingCommissions } = useAllianceCommissions({
    ...filters,
    alianzaId: selectedAllianceId,
  });
  const markAsPaidMutation = useMarkCommissionAsPaid();
  const bulkMarkAsPaidMutation = useBulkMarkAsPaid();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const pendingIds = (commissions || [])
        .filter((c: any) => c.status !== 'pagada')
        .map((c: any) => c.id);
      setSelectedCommissionIds(pendingIds);
    } else {
      setSelectedCommissionIds([]);
    }
  };

  const handleSelectCommission = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedCommissionIds([...selectedCommissionIds, id]);
    } else {
      setSelectedCommissionIds(selectedCommissionIds.filter(cid => cid !== id));
    }
  };

  const handleBulkMarkAsPaid = () => {
    if (selectedCommissionIds.length > 0) {
      bulkMarkAsPaidMutation.mutate(selectedCommissionIds);
      setSelectedCommissionIds([]);
    }
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { color: string; label: string }> = {
      calculada: {
        color: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
        label: "Calculada"
      },
      pendiente: {
        color: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
        label: "Pendiente"
      },
      pagada: {
        color: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
        label: "Pagada"
      },
    };
    const config = configs[status] || configs.pendiente;
    return (
      <Badge className={config.color}>
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 max-w-full overflow-x-hidden px-4 sm:px-6 py-6">
      {/* Breadcrumb */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link to={BACKOFFICE_ROUTES.COMISIONES}>Comisiones</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Comisiones por Alianzas</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600">
          <Handshake className="h-6 w-6 text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl font-bold">Comisiones por Alianzas</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Gestiona comisiones generadas por alianzas comerciales e inmobiliarias
          </p>
        </div>

        {selectedAllianceId && (
          <Button
            variant="outline"
            onClick={() => setSelectedAllianceId(undefined)}
          >
            Ver Todas
          </Button>
        )}
      </div>

      {/* Alliances Grid */}
      {!selectedAllianceId && (
        <>
          {loadingAlliances ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {alliances?.map((alliance, index) => (
                <div
                  key={alliance.id}
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <AllianceCard
                    alliance={alliance}
                    onClick={setSelectedAllianceId}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Commissions Detail View */}
      {selectedAllianceId && (
        <Card className="animate-fade-in">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Comisiones Detalladas</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {alliances?.find(a => a.id === selectedAllianceId)?.nombre}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <CommissionFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  alliances={alliances?.map(a => ({ id: a.id, nombre: a.nombre }))}
                />
                <Button variant="outline">
                  <FileDown className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedCommissionIds.length > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 border border-primary/20 mt-4">
                <span className="text-sm font-medium">
                  {selectedCommissionIds.length} seleccionadas
                </span>
                <Button
                  size="sm"
                  onClick={handleBulkMarkAsPaid}
                  disabled={bulkMarkAsPaidMutation.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Marcar como Pagadas
                </Button>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {loadingCommissions ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedCommissionIds.length > 0 &&
                            selectedCommissionIds.length === commissions?.filter((c: any) => c.status !== 'pagada').length
                          }
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Monto Base</TableHead>
                      <TableHead>%</TableHead>
                      <TableHead>Comisión</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {commissions && commissions.length > 0 ? (
                      commissions.map((commission: any) => (
                        <TableRow key={commission.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedCommissionIds.includes(commission.id)}
                              onCheckedChange={(checked) =>
                                handleSelectCommission(commission.id, checked as boolean)
                              }
                              disabled={commission.status === 'pagada'}
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            {commission.budgets?.projects?.clients?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            ${commission.base_amount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>{commission.percent}%</TableCell>
                          <TableCell className="font-semibold text-primary">
                            ${commission.calculated_amount?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell>{getStatusBadge(commission.status)}</TableCell>
                          <TableCell>
                            {format(new Date(commission.created_at), 'dd MMM yyyy', { locale: es })}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setDetailsCommission(commission)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {commission.status !== 'pagada' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => markAsPaidMutation.mutate(commission.id)}
                                  disabled={markAsPaidMutation.isPending}
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                          No hay comisiones para esta alianza
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Details Dialog */}
      <CommissionDetailsDialog
        commission={detailsCommission}
        open={!!detailsCommission}
        onOpenChange={(open) => !open && setDetailsCommission(null)}
        onMarkAsPaid={(id) => markAsPaidMutation.mutate(id)}
      />
    </div>
  );
}
