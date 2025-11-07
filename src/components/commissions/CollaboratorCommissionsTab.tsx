import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Clock, DollarSign } from "lucide-react";

export function CollaboratorCommissionsTab() {
  const queryClient = useQueryClient();
  const [selectedCollaborator, setSelectedCollaborator] = useState<string>("all");

  const { data: collaborators } = useQuery({
    queryKey: ["collaborators"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name");

      if (error) throw error;
      return data;
    },
  });

  const { data: commissions, isLoading } = useQuery({
    queryKey: ["collaborator-commissions", selectedCollaborator],
    queryFn: async () => {
      let query = supabase
        .from("commissions")
        .select(`
          *,
          profiles:sujeto_id (full_name),
          projects:deal_ref (id, client_id, clients(name))
        `)
        .eq("tipo", "colaborador")
        .order("created_at", { ascending: false });

      if (selectedCollaborator !== "all") {
        query = query.eq("sujeto_id", selectedCollaborator);
      }

      const { data, error } = await query;
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
      queryClient.invalidateQueries({ queryKey: ["collaborator-commissions"] });
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

  const totalPending = commissions?.filter((c: any) => c.status !== 'pagada')
    .reduce((sum: number, c: any) => sum + Number(c.calculated_amount), 0) || 0;

  const totalPaid = commissions?.filter((c: any) => c.status === 'pagada')
    .reduce((sum: number, c: any) => sum + Number(c.calculated_amount), 0) || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comisiones de Colaboradores</CardTitle>
        <CardDescription>
          Gestiona las comisiones generadas por colaboradores en proyectos
        </CardDescription>
        <div className="flex gap-4 mt-4">
          <Select value={selectedCollaborator} onValueChange={setSelectedCollaborator}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Filtrar por colaborador" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los colaboradores</SelectItem>
              {collaborators?.map((collab) => (
                <SelectItem key={collab.id} value={collab.id}>
                  {collab.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex gap-4 ml-auto">
            <div className="text-sm">
              <div className="text-muted-foreground">Pendiente</div>
              <div className="font-semibold text-lg">
                ${totalPending.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-sm">
              <div className="text-muted-foreground">Pagado</div>
              <div className="font-semibold text-lg text-primary">
                ${totalPaid.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Colaborador</TableHead>
              <TableHead>Proyecto</TableHead>
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
                  {commission.profiles?.full_name || "N/A"}
                </TableCell>
                <TableCell>{commission.projects?.id?.slice(0, 8) || "N/A"}</TableCell>
                <TableCell>
                  {commission.projects?.clients?.name || "N/A"}
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
                <TableCell colSpan={9} className="text-center text-muted-foreground">
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
