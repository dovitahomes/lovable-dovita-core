import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useClientsList } from "@/hooks/useClients";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Trash2, Eye } from "lucide-react";
import { ClientDialog } from "@/components/forms/ClientDialog";
import { LoadingError } from "@/components/common/LoadingError";
import { ResponsiveTable } from "@/components/common/ResponsiveTable";

export default function Clientes() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const queryClient = useQueryClient();
  const { data: clients, isLoading, error } = useClientsList(search);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('clients').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      toast.success("Cliente eliminado exitosamente");
    },
    onError: (error) => toast.error("Error al eliminar cliente: " + error.message)
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Clientes</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
        </Button>
      </div>

      <ClientDialog open={open} onOpenChange={setOpen} />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Lista de Clientes</CardTitle>
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </CardHeader>
        <CardContent>
          <LoadingError
            isLoading={isLoading}
            error={error}
            isEmpty={!clients || clients.length === 0}
            emptyMessage="Aún no hay clientes"
            onRetry={() => queryClient.invalidateQueries({ queryKey: ['clients'] })}
          />
          {!isLoading && !error && clients && clients.length > 0 && (
            <ResponsiveTable
              data={clients}
              keyExtractor={(c) => c.id}
              columns={[
                { 
                  header: "Tipo", 
                  key: "person_type",
                  render: (type) => (
                    <Badge variant={type === 'fisica' ? 'default' : 'secondary'}>
                      {type}
                    </Badge>
                  )
                },
                { 
                  header: "Nombre", 
                  key: "name",
                  render: (value) => <span className="font-medium">{value}</span>
                },
                { header: "Email", key: "email" },
                { header: "Teléfono", key: "phone", hideOnMobile: true },
                { 
                  header: "Fecha", 
                  key: "created_at",
                  hideOnMobile: true,
                  render: (date) => new Date(date).toLocaleDateString('es-MX')
                },
              ]}
              actions={(client) => (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate(`/clientes/${client.id}`)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(client.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              emptyMessage="Aún no hay clientes"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}