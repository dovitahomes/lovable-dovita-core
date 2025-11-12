import { useMemo, useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useProviderBalances } from "@/hooks/finance/useProviderBalances";
import { ProviderBalanceCard } from "./ProviderBalanceCard";
import { Building2, AlertCircle } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function VirtualizedProviderBalancesGrid() {
  const { data, isLoading } = useProviderBalances();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const parentRef = useRef<HTMLDivElement>(null);

  const handleViewDetails = (providerId: string) => {
    console.log('View provider details:', providerId);
  };

  // Memoized filtering
  const filteredData = useMemo(() => {
    if (!data) return [];
    
    return data.filter(provider => {
      const matchesSearch = provider.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           provider.providerCode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || provider.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, searchTerm, statusFilter]);

  // Memoized stats calculation
  const stats = useMemo(() => {
    if (!data) return { totalPendiente: 0, vencidos: 0, porVencer: 0, totalFacturas: 0 };
    
    return {
      totalPendiente: data.reduce((sum, p) => sum + p.totalPendiente, 0),
      vencidos: data.filter(p => p.status === 'vencido').length,
      porVencer: data.filter(p => p.status === 'por_vencer').length,
      totalFacturas: data.reduce((sum, p) => sum + p.facturasPendientes, 0),
    };
  }, [data]);

  // Virtualization setup - only virtualize if more than 50 items
  const shouldVirtualize = filteredData.length > 50;
  
  const rowVirtualizer = useVirtualizer({
    count: shouldVirtualize ? filteredData.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 200,
    overscan: 5,
    enabled: shouldVirtualize,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Saldos de Proveedores</CardTitle>
          <CardDescription>No hay saldos pendientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              No hay facturas pendientes de pago a proveedores
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Pendiente</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(stats.totalPendiente)}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Facturas</p>
                <p className="text-2xl font-bold text-foreground">{stats.totalFacturas}</p>
              </div>
              <Badge variant="outline" className="text-lg">
                {data.length} proveedores
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Vencidos</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.vencidos}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Por Vencer</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.porVencer}</p>
              </div>
              <Badge variant="secondary" className="text-lg bg-amber-500/10">
                ≤7 días
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle>Saldos de Proveedores</CardTitle>
              <CardDescription>
                {filteredData.length} proveedor{filteredData.length !== 1 ? 'es' : ''} con saldo pendiente
                {shouldVirtualize && <span className="ml-2 text-xs">(virtualizado)</span>}
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Input
                placeholder="Buscar proveedor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="sm:w-64"
              />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="sm:w-40">
                  <SelectValue placeholder="Filtrar..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="vencido">Vencidos</SelectItem>
                  <SelectItem value="por_vencer">Por Vencer</SelectItem>
                  <SelectItem value="al_dia">Al Día</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Provider Cards Grid */}
      {filteredData.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              No se encontraron proveedores con los filtros seleccionados
            </p>
          </CardContent>
        </Card>
      ) : shouldVirtualize ? (
        // Virtualized rendering for large lists
        <div ref={parentRef} className="overflow-auto max-h-[800px]">
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const provider = filteredData[virtualRow.index];
              return (
                <div
                  key={provider.providerId}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div className="p-2">
                    <ProviderBalanceCard
                      provider={provider}
                      onViewDetails={handleViewDetails}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // Regular grid for smaller lists
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map((provider) => (
            <ProviderBalanceCard
              key={provider.providerId}
              provider={provider}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}
