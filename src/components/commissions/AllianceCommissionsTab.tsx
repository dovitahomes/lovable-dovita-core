import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle2, Clock, DollarSign } from "lucide-react";

export function AllianceCommissionsTab() {
  const queryClient = useQueryClient();

  const { data: commissions, isLoading } = useQuery({
    queryKey: ["alliance-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("commissions")
        .select(`
          *,
          alianzas:sujeto_id (nombre),
          budgets:deal_ref (id, project_id, projects(client_id, clients(name)))
        `)
        .eq("tipo", "alianza")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "calculada" | "pendiente" | "pagada" }) => {
      const { error } = await supabase
        .from("commissions")
        .update({ 
          status,
          paid_at: status === 'pagada' ? new Date().toISOString() : null
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alliance-commissions"] });
      toast.success("Estado actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar estado");
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      calculada: { variant: "secondary", icon: Clock },
      pendiente: { variant: "outline", icon: DollarSign },
      pagada: { variant: "default", icon: CheckCircle2 },
    };

    const config = variants[status] || variants.calculada;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (isLoading) {
    return <div>Cargando...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comisiones de Alianzas</CardTitle>
        <CardDescription>
          Gestiona las comisiones generadas por alianzas comerciales
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Alianza</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Monto Base</TableHead>
              <TableHead>Porcentaje</TableHead>
              <TableHead>Comisión</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha Creación</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {commissions?.map((commission: any) => (
              <TableRow key={commission.id}>
                <TableCell className="font-medium">
                  {commission.alianzas?.nombre || "N/A"}
                </TableCell>
                <TableCell>
                  {commission.budgets?.projects?.clients?.name || "N/A"}
                </TableCell>
                <TableCell>
                  ${Number(commission.base_amount).toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell>{commission.percent}%</TableCell>
                <TableCell className="font-semibold text-primary">
                  ${Number(commission.calculated_amount).toLocaleString("es-MX", {
                    minimumFractionDigits: 2,
                  })}
                </TableCell>
                <TableCell>{getStatusBadge(commission.status)}</TableCell>
                <TableCell>
                  {new Date(commission.created_at).toLocaleDateString("es-MX")}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {commission.status !== "pagada" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: commission.id,
                            status: commission.status === "calculada" ? "pendiente" : "pagada",
                          })
                        }
                      >
                        {commission.status === "calculada" ? "Marcar Pendiente" : "Marcar Pagada"}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {!commissions?.length && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No hay comisiones registradas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
