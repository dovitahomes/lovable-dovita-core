import { useState } from "react";
import { useInvoices, useMarkInvoiceAsPaid } from "@/hooks/finance/useInvoices";
import { InvoiceCard } from "./InvoiceCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Filter } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function InvoicesGrid() {
  const [tipoFilter, setTipoFilter] = useState<'ingreso' | 'egreso' | undefined>(undefined);
  const [paidFilter, setPaidFilter] = useState<boolean | undefined>(undefined);
  
  const { data: invoices, isLoading } = useInvoices({
    tipo: tipoFilter,
    paid: paidFilter,
  });
  
  const markPaidMutation = useMarkInvoiceAsPaid();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const handleClearFilters = () => {
    setTipoFilter(undefined);
    setPaidFilter(undefined);
  };

  const hasActiveFilters = tipoFilter !== undefined || paidFilter !== undefined;

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Filtros:</span>
        </div>

        <Select value={tipoFilter || 'all'} onValueChange={(v) => setTipoFilter(v === 'all' ? undefined : v as any)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="ingreso">Ingresos</SelectItem>
            <SelectItem value="egreso">Egresos</SelectItem>
          </SelectContent>
        </Select>

        <Select value={paidFilter === undefined ? 'all' : paidFilter ? 'paid' : 'pending'} 
                onValueChange={(v) => setPaidFilter(v === 'all' ? undefined : v === 'paid')}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="paid">Pagadas</SelectItem>
            <SelectItem value="pending">Pendientes</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleClearFilters}>
            Limpiar filtros
          </Button>
        )}

        <Badge variant="secondary" className="ml-auto">
          {invoices?.length || 0} facturas
        </Badge>
      </div>

      {/* Grid */}
      {invoices && invoices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {invoices.map((invoice, index) => (
            <div
              key={invoice.id}
              className="animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'backwards' }}
            >
              <InvoiceCard
                invoice={invoice}
                onMarkPaid={(id) => markPaidMutation.mutate(id)}
              />
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              No hay facturas registradas
            </p>
            <p className="text-sm text-muted-foreground">
              Sube un archivo XML SAT para comenzar
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
