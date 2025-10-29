import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, UserPlus } from "lucide-react";
import { ConvertLeadDialog } from "@/components/ConvertLeadDialog";
import { LeadDialog } from "@/components/forms/LeadDialog";
import { LoadingError } from "@/components/common/LoadingError";

const ESTADOS_MEXICO = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas",
  "Chihuahua", "Ciudad de México", "Coahuila", "Colima", "Durango", "Guanajuato",
  "Guerrero", "Hidalgo", "Jalisco", "México", "Michoacán", "Morelos", "Nayarit",
  "Nuevo León", "Oaxaca", "Puebla", "Querétaro", "Quintana Roo", "San Luis Potosí",
  "Sinaloa", "Sonora", "Tabasco", "Tamaulipas", "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas"
];

const ORIGENES_LEAD = [
  "Facebook", "Instagram", "Google", "Referido", "Sitio Web", "Llamada", 
  "WhatsApp", "Email", "Evento", "Alianza", "Otro"
];

export default function Leads() {
  const [open, setOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [filterSucursal, setFilterSucursal] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const queryClient = useQueryClient();

  const { data: leads, isLoading, error } = useQuery({
    queryKey: ['leads', filterSucursal, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*, sucursales(nombre)')
        .order('created_at', { ascending: false });
      
      if (filterSucursal && filterSucursal !== "all") query = query.eq('sucursal_id', filterSucursal);
      if (filterStatus && filterStatus !== "all") query = query.eq('status', filterStatus as any);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: sucursales } = useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sucursales').select('id, nombre').eq('activa', true);
      if (error) throw error;
      return data;
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success("Lead eliminado exitosamente");
    },
    onError: (error) => toast.error("Error al eliminar lead: " + error.message)
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      nuevo: "default",
      contactado: "secondary",
      calificado: "outline",
      convertido: "default",
      perdido: "destructive"
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Leads</h1>
        <Button onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Lead
        </Button>
      </div>

      <LeadDialog open={open} onOpenChange={setOpen} />

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-4">
          <div className="flex-1">
            <Label>Sucursal</Label>
            <Select value={filterSucursal} onValueChange={setFilterSucursal}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {sucursales?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <Label>Estado</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="nuevo">Nuevo</SelectItem>
                <SelectItem value="contactado">Contactado</SelectItem>
                <SelectItem value="calificado">Calificado</SelectItem>
                <SelectItem value="convertido">Convertido</SelectItem>
                <SelectItem value="perdido">Perdido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Leads</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingError
            isLoading={isLoading}
            error={error}
            isEmpty={!leads || leads.length === 0}
            emptyMessage="Aún no hay leads"
            onRetry={() => queryClient.invalidateQueries({ queryKey: ['leads', filterSucursal, filterStatus] })}
          />
          {!isLoading && !error && leads && leads.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado/Sucursal</TableHead>
                  <TableHead>Presupuesto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    <TableCell>{lead.nombre_completo || '-'}</TableCell>
                    <TableCell>
                      {lead.telefono && <div>{lead.telefono}</div>}
                      {lead.email && <div className="text-sm text-muted-foreground">{lead.email}</div>}
                    </TableCell>
                    <TableCell>
                      {lead.estado && <div>{lead.estado}</div>}
                      {lead.sucursales?.nombre && <div className="text-sm text-muted-foreground">{lead.sucursales.nombre}</div>}
                    </TableCell>
                    <TableCell>
                      {lead.presupuesto_referencia 
                        ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(lead.presupuesto_referencia)
                        : '-'
                      }
                    </TableCell>
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {lead.status !== 'convertido' && (
                          <Button 
                            variant="default" 
                            size="sm" 
                            onClick={() => {
                              setSelectedLead(lead);
                              setConvertOpen(true);
                            }}
                          >
                            <UserPlus className="h-4 w-4" />
                          </Button>
                        )}
                        <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(lead.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {selectedLead && (
        <ConvertLeadDialog
          open={convertOpen}
          onOpenChange={setConvertOpen}
          lead={selectedLead}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['leads'] });
            queryClient.invalidateQueries({ queryKey: ['clients'] });
            queryClient.invalidateQueries({ queryKey: ['projects'] });
          }}
        />
      )}
    </div>
  );
}