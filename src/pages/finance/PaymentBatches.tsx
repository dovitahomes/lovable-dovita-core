import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePayBatches } from "@/hooks/usePayments";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export default function PaymentBatches() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  const { data: batches, isLoading } = usePayBatches({
    search,
    status: statusFilter || undefined,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
      borrador: "outline",
      programado: "secondary",
      pagado: "default",
      cancelado: "destructive",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Pagos a Proveedores</h1>
          <p className="text-muted-foreground">Gestión de lotes de pagos</p>
        </div>
        <Button onClick={() => navigate("/finance/payments/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Nuevo Lote
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Todos</SelectItem>
                <SelectItem value="borrador">Borrador</SelectItem>
                <SelectItem value="programado">Programado</SelectItem>
                <SelectItem value="pagado">Pagado</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de lotes */}
      <div className="grid gap-4">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))
        ) : batches && batches.length > 0 ? (
          batches.map((batch: any) => (
            <Card
              key={batch.id}
              className="hover:bg-accent/50 cursor-pointer transition-colors"
              onClick={() => navigate(`/finance/payments/${batch.id}`)}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">
                        {batch.title || `Lote ${batch.id.substring(0, 8)}`}
                      </h3>
                      {getStatusBadge(batch.status)}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                      {batch.scheduled_date && (
                        <div>
                          <span className="font-medium">Programado:</span>{" "}
                          {format(new Date(batch.scheduled_date), "dd/MM/yyyy")}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Creado:</span>{" "}
                        {format(new Date(batch.created_at), "dd/MM/yyyy")}
                      </div>
                    </div>
                    {batch.notes && (
                      <p className="text-sm text-muted-foreground italic">{batch.notes}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <p className="text-muted-foreground">
                No se encontraron lotes de pago. Crea uno nuevo para comenzar.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
