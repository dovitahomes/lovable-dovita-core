import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Mail, Phone, ArrowUpDown, ArrowUp, ArrowDown, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useAllLeads } from "@/hooks/useAllLeads";
import { StatusBadge } from "./StatusBadge";
import { LeadTableActions } from "./LeadTableActions";
import { LeadFilters } from "@/lib/leadFilters";
import { cn } from "@/lib/utils";

interface LeadsTableViewProps {
  search: string;
  filters: LeadFilters;
}

export function LeadsTableView({ search, filters }: LeadsTableViewProps) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<string>("updated_at");
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedLeads, setSelectedLeads] = useState<string[]>([]);

  const { data, isLoading } = useAllLeads({
    search,
    page,
    pageSize: 20,
    sortBy,
    sortOrder,
    filters,
  });

  const leads = data?.data || [];
  const totalPages = data?.totalPages || 1;

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(leads.map(l => l.id));
    } else {
      setSelectedLeads([]);
    }
  };

  const handleSelectLead = (leadId: string, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, leadId]);
    } else {
      setSelectedLeads(selectedLeads.filter(id => id !== leadId));
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-30" />;
    return sortOrder === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox
                    checked={selectedLeads.length === leads.length && leads.length > 0}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('nombre_completo')}
                    className="h-8 px-2 hover:bg-transparent"
                  >
                    Nombre
                    <SortIcon column="nombre_completo" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('terreno_m2')}
                    className="h-8 px-2 hover:bg-transparent"
                  >
                    M² Terreno
                    <SortIcon column="terreno_m2" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('presupuesto_referencia')}
                    className="h-8 px-2 hover:bg-transparent"
                  >
                    Presupuesto
                    <SortIcon column="presupuesto_referencia" />
                  </Button>
                </TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('status')}
                    className="h-8 px-2 hover:bg-transparent"
                  >
                    Status
                    <SortIcon column="status" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort('last_activity')}
                    className="h-8 px-2 hover:bg-transparent"
                  >
                    Último Contacto
                    <SortIcon column="last_activity" />
                  </Button>
                </TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No se encontraron leads
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow 
                    key={lead.id}
                    className={cn(
                      "hover:bg-accent/50 transition-colors",
                      selectedLeads.includes(lead.id) && "bg-accent/30"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedLeads.includes(lead.id)}
                        onCheckedChange={(checked) => handleSelectLead(lead.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                            {getInitials(lead.nombre_completo)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="font-medium">{lead.nombre_completo}</span>
                          {lead.sucursales?.nombre && (
                            <span className="text-xs text-muted-foreground">
                              {lead.sucursales.nombre}
                            </span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {lead.terreno_m2 ? (
                        <span className="font-mono text-sm">{lead.terreno_m2} m²</span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.presupuesto_referencia ? (
                        <span className="font-mono text-sm">
                          {new Intl.NumberFormat('es-MX', {
                            style: 'currency',
                            currency: 'MXN',
                            maximumFractionDigits: 0
                          }).format(lead.presupuesto_referencia)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.email ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[200px]">{lead.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {lead.telefono ? (
                        <div className="flex items-center gap-2 text-sm">
                          <Phone className="h-3 w-3 text-muted-foreground shrink-0" />
                          <span>{lead.telefono}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={lead.status} />
                    </TableCell>
                    <TableCell>
                      {lead.last_activity ? (
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(lead.last_activity), {
                            addSuffix: true,
                            locale: es
                          })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sin contacto</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <LeadTableActions lead={lead} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Página {page} de {totalPages} • {data?.totalCount || 0} leads totales
          </p>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className={cn(
                    page === 1 && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
              <PaginationItem>
                <span className="text-sm px-4">
                  {page} / {totalPages}
                </span>
              </PaginationItem>
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className={cn(
                    page === totalPages && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedLeads.length > 0 && (
        <div className="fixed bottom-6 right-6 bg-primary text-primary-foreground rounded-lg shadow-lg p-4 animate-slide-in-up z-50">
          <div className="flex items-center gap-4">
            <p className="text-sm font-medium">
              {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} seleccionado{selectedLeads.length > 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary">
                Cambiar Estado
              </Button>
              <Button size="sm" variant="secondary">
                Exportar
              </Button>
              <Button 
                size="sm" 
                variant="ghost"
                onClick={() => setSelectedLeads([])}
                className="hover:bg-primary-foreground/10"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
