import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

type PurchaseOrderStatus = 'solicitado' | 'ordenado' | 'recibido';

interface PurchaseOrder {
  id: string;
  project_id: string;
  subpartida_id: string;
  proveedor_id: string | null;
  qty_solicitada: number;
  qty_ordenada: number;
  qty_recibida: number;
  estado: PurchaseOrderStatus;
  fecha_requerida: string | null;
  eta_proveedor: string | null;
  notas: string | null;
  created_at: string;
  projects?: { id: string; clients: { name: string } };
  tu_nodes?: { name: string; code: string };
  providers?: { name: string; code_short: string };
}

const STATUS_COLORS = {
  solicitado: 'bg-yellow-500',
  ordenado: 'bg-blue-500',
  recibido: 'bg-green-500',
};

const STATUS_LABELS = {
  solicitado: 'Solicitado',
  ordenado: 'Ordenado',
  recibido: 'Recibido',
};

/**
 * Purchase Orders page - uses existing purchase_orders table
 * No new tables created, adapts to current schema
 */
export default function OrdenesCompra() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "all">("all");
  const [projectFilter, setProjectFilter] = useState<string>("all");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['purchase-orders', search, statusFilter, projectFilter],
    queryFn: async () => {
      let query = supabase
        .from('purchase_orders')
        .select(`
          *,
          projects!inner(id, clients!inner(name)),
          tu_nodes!subpartida_id(name, code),
          providers(name, code_short)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('estado', statusFilter);
      }

      if (projectFilter !== 'all') {
        query = query.eq('project_id', projectFilter);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as PurchaseOrder[];
    },
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['projects-for-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, clients(name)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return data;
    },
  });

  const filteredOrders = orders.filter(order => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      order.tu_nodes?.name.toLowerCase().includes(searchLower) ||
      order.tu_nodes?.code.toLowerCase().includes(searchLower) ||
      order.providers?.name.toLowerCase().includes(searchLower)
    );
  });

  const getConsumptionPercent = (order: PurchaseOrder) => {
    if (!order.qty_solicitada || order.qty_solicitada === 0) return 0;
    return Math.round((order.qty_recibida / order.qty_solicitada) * 100);
  };

  const getConsumptionColor = (percent: number) => {
    if (percent >= 80) return 'bg-red-500';
    if (percent >= 50) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Órdenes de Compra</h1>
          <p className="text-muted-foreground">
            Gestiona las órdenes de compra por subpartida
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Orden
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Busca y filtra órdenes de compra</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por subpartida o proveedor..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="solicitado">Solicitado</SelectItem>
                <SelectItem value="ordenado">Ordenado</SelectItem>
                <SelectItem value="recibido">Recibido</SelectItem>
              </SelectContent>
            </Select>
            <Select value={projectFilter} onValueChange={setProjectFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proyectos</SelectItem>
                {projects.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.clients?.name || 'Sin cliente'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Órdenes</CardTitle>
          <CardDescription>
            {filteredOrders.length} orden{filteredOrders.length !== 1 ? 'es' : ''} encontrada{filteredOrders.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Subpartida</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead className="text-right">Solicitada</TableHead>
                  <TableHead className="text-right">Ordenada</TableHead>
                  <TableHead className="text-right">Recibida</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Consumo</TableHead>
                  <TableHead>Fecha Req.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center text-muted-foreground">
                      No hay órdenes de compra
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrders.map((order) => {
                    const consumptionPct = getConsumptionPercent(order);
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.projects?.clients?.name || 'Sin cliente'}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium">{order.tu_nodes?.name}</div>
                            <div className="text-muted-foreground">{order.tu_nodes?.code}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {order.providers ? (
                            <div className="text-sm">
                              <div className="font-medium">{order.providers.name}</div>
                              <div className="text-muted-foreground">{order.providers.code_short}</div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Sin asignar</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">{order.qty_solicitada}</TableCell>
                        <TableCell className="text-right">{order.qty_ordenada}</TableCell>
                        <TableCell className="text-right">{order.qty_recibida}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={STATUS_COLORS[order.estado]}>
                            {STATUS_LABELS[order.estado]}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                              <div 
                                className={`h-2.5 rounded-full ${getConsumptionColor(consumptionPct)}`}
                                style={{ width: `${consumptionPct}%` }}
                              />
                            </div>
                            <span className="text-xs text-muted-foreground min-w-[3rem] text-right">
                              {consumptionPct}%
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {order.fecha_requerida 
                            ? new Date(order.fecha_requerida).toLocaleDateString('es-MX')
                            : '-'
                          }
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
