import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ShoppingCart, Check } from "lucide-react";
import { format } from "date-fns";
import { LoadingError } from "@/components/common/LoadingError";
import { TableSkeleton } from "@/components/common/Skeletons";

export function PurchaseOrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [groupedOrders, setGroupedOrders] = useState<Map<string, any[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [etaDate, setEtaDate] = useState("");
  const [groupingEnabled, setGroupingEnabled] = useState(true);

  useEffect(() => {
    loadOrders();
    loadConfig();
  }, []);

  const loadConfig = async () => {
    const { data } = await supabase
      .from("finance_config")
      .select("oc_grouping_enabled")
      .limit(1)
      .maybeSingle();
    
    if (data) {
      setGroupingEnabled(data.oc_grouping_enabled);
    }
  };

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(false);
      
      const { data, error } = await supabase
        .from("purchase_orders")
        .select(`
          *,
          projects(id, clients(name)),
          tu_nodes!subpartida_id(code, name, unit_default),
          providers(id, code_short, name)
        `)
        .eq("estado", "solicitado")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders(data || []);

      // Group by provider if enabled
      if (groupingEnabled) {
        const grouped = new Map();
        data?.forEach((order) => {
          const key = order.proveedor_id || "sin_proveedor";
          if (!grouped.has(key)) {
            grouped.set(key, []);
          }
          grouped.get(key).push(order);
        });
        setGroupedOrders(grouped);
      }
    } catch (err) {
      console.error("Error al cargar órdenes:", err);
      setError(true);
      toast.error("No pudimos cargar las órdenes de compra");
    } finally {
      setLoading(false);
    }
  };

  const processOrders = (providerOrders: any[]) => {
    setSelectedGroup(providerOrders);
    setShowProcessDialog(true);
  };

  const handleProcessOrder = async () => {
    if (!selectedGroup || !etaDate) {
      toast.error("Ingresa la fecha ETA");
      return;
    }

    try {
      for (const order of selectedGroup) {
        await supabase
          .from("purchase_orders")
          .update({
            estado: "ordenado",
            qty_ordenada: order.qty_solicitada,
            eta_proveedor: etaDate,
          })
          .eq("id", order.id);
      }

      toast.success("Órdenes procesadas correctamente");
      setShowProcessDialog(false);
      setSelectedGroup(null);
      setEtaDate("");
      loadOrders();
    } catch (error: any) {
      toast.error("Error al procesar: " + error.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "solicitado":
        return <Badge variant="secondary">Solicitado</Badge>;
      case "ordenado":
        return <Badge className="bg-yellow-500">Ordenado</Badge>;
      case "recibido":
        return <Badge className="bg-green-500">Recibido</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (error) {
    return <LoadingError onRetry={loadOrders} />;
  }

  if (loading) {
    return <TableSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Órdenes de Compra Pendientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {groupingEnabled ? (
            <div className="space-y-6">
              {Array.from(groupedOrders.entries()).map(([providerId, providerOrders]) => {
                const provider = providerOrders[0]?.providers;
                const totalAmount = providerOrders.reduce(
                  (sum, o) => sum + o.qty_solicitada,
                  0
                );

                return (
                  <Card key={providerId}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {provider ? `${provider.code_short} - ${provider.name}` : "Sin Proveedor"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {providerOrders.length} orden(es) - Total items: {totalAmount}
                        </p>
                      </div>
                      <Button onClick={() => processOrders(providerOrders)} size="sm">
                        Procesar Pedido
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Proyecto</TableHead>
                            <TableHead>Subpartida</TableHead>
                            <TableHead>Cantidad</TableHead>
                            <TableHead>Fecha Requerida</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {providerOrders.map((order) => (
                            <TableRow key={order.id}>
                              <TableCell>{order.projects?.clients?.name}</TableCell>
                              <TableCell>
                                <div>
                                  <span className="font-mono text-xs text-primary mr-1">
                                    {order.tu_nodes?.code}
                                  </span>
                                  <span className="text-sm">{order.tu_nodes?.name}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {order.qty_solicitada} {order.tu_nodes?.unit_default}
                              </TableCell>
                              <TableCell>
                                {order.fecha_requerida
                                  ? format(new Date(order.fecha_requerida), "dd/MM/yyyy")
                                  : "-"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Proyecto</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Subpartida</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.projects?.clients?.name}</TableCell>
                    <TableCell>
                      {order.providers
                        ? `${order.providers.code_short} - ${order.providers.name}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-primary mr-1">
                        {order.tu_nodes?.code}
                      </span>
                      {order.tu_nodes?.name}
                    </TableCell>
                    <TableCell>
                      {order.qty_solicitada} {order.tu_nodes?.unit_default}
                    </TableCell>
                    <TableCell>{getStatusBadge(order.estado)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => processOrders([order])}>
                        Procesar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Procesar Orden de Compra</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedGroup && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-semibold">
                  {selectedGroup[0]?.providers?.name || "Sin proveedor"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedGroup.length} orden(es) a procesar
                </p>
              </div>
            )}
            <div>
              <Label>Fecha ETA del Proveedor</Label>
              <Input
                type="date"
                value={etaDate}
                onChange={(e) => setEtaDate(e.target.value)}
              />
            </div>
            <Button onClick={handleProcessOrder} className="w-full gap-2">
              <Check className="h-4 w-4" />
              Confirmar Pedido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
