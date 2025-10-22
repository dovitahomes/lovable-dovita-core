import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, UserPlus } from "lucide-react";
import { ConvertLeadDialog } from "@/components/ConvertLeadDialog";

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
  const [editingLead, setEditingLead] = useState<any>(null);
  const [filterSucursal, setFilterSucursal] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [formData, setFormData] = useState({
    nombre_completo: "",
    telefono: "",
    email: "",
    estado: "",
    direccion: "",
    origen_lead: [] as string[],
    sucursal_id: "",
    terreno_m2: "",
    presupuesto_referencia: "",
    ubicacion_terreno: "",
    notas: "",
    status: "nuevo" as "nuevo" | "contactado" | "calificado" | "convertido" | "perdido"
  });

  const queryClient = useQueryClient();

  const { data: leads, isLoading } = useQuery({
    queryKey: ['leads', filterSucursal, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('leads')
        .select('*, sucursales(nombre)')
        .order('created_at', { ascending: false });
      
      if (filterSucursal) query = query.eq('sucursal_id', filterSucursal);
      if (filterStatus) query = query.eq('status', filterStatus as any);
      
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

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('leads').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success("Lead creado exitosamente");
      resetForm();
    },
    onError: (error) => toast.error("Error al crear lead: " + error.message)
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const { error } = await supabase.from('leads').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] });
      toast.success("Lead actualizado exitosamente");
      resetForm();
    },
    onError: (error) => toast.error("Error al actualizar lead: " + error.message)
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      nombre_completo: formData.nombre_completo,
      telefono: formData.telefono || null,
      email: formData.email || null,
      estado: formData.estado || null,
      direccion: formData.direccion || null,
      origen_lead: formData.origen_lead.length > 0 ? formData.origen_lead : null,
      sucursal_id: formData.sucursal_id || null,
      terreno_m2: formData.terreno_m2 ? parseFloat(formData.terreno_m2) : null,
      presupuesto_referencia: formData.presupuesto_referencia ? parseFloat(formData.presupuesto_referencia) : null,
      ubicacion_terreno_json: formData.ubicacion_terreno ? { descripcion: formData.ubicacion_terreno } : null,
      notas: formData.notas || null,
      status: formData.status
    };
    
    if (editingLead) {
      updateMutation.mutate({ id: editingLead.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const resetForm = () => {
    setFormData({ 
      nombre_completo: "", telefono: "", email: "", estado: "", direccion: "", 
      origen_lead: [], sucursal_id: "", terreno_m2: "", presupuesto_referencia: "", 
      ubicacion_terreno: "", notas: "", status: "nuevo" 
    });
    setEditingLead(null);
    setOpen(false);
  };

  const handleEdit = (lead: any) => {
    setEditingLead(lead);
    setFormData({
      nombre_completo: lead.nombre_completo || "",
      telefono: lead.telefono || "",
      email: lead.email || "",
      estado: lead.estado || "",
      direccion: lead.direccion || "",
      origen_lead: lead.origen_lead || [],
      sucursal_id: lead.sucursal_id || "",
      terreno_m2: lead.terreno_m2?.toString() || "",
      presupuesto_referencia: lead.presupuesto_referencia?.toString() || "",
      ubicacion_terreno: lead.ubicacion_terreno_json?.descripcion || "",
      notas: lead.notas || "",
      status: lead.status
    });
    setOpen(true);
  };

  const handleOrigenChange = (origen: string) => {
    setFormData(prev => {
      const newOrigenes = prev.origen_lead.includes(origen)
        ? prev.origen_lead.filter(o => o !== origen)
        : [...prev.origen_lead, origen];
      return { ...prev, origen_lead: newOrigenes };
    });
  };

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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setOpen(true); }}>
              <Plus className="mr-2 h-4 w-4" /> Nuevo Lead
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLead ? 'Editar' : 'Crear'} Lead</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nombre Completo *</Label>
                  <Input
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Select value={formData.estado} onValueChange={(value) => setFormData({ ...formData, estado: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {ESTADOS_MEXICO.map((estado) => (
                        <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Sucursal</Label>
                  <Select value={formData.sucursal_id} onValueChange={(value) => setFormData({ ...formData, sucursal_id: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sucursal" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Sin sucursal</SelectItem>
                      {sucursales?.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Dirección</Label>
                  <Input
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Origen del Lead (selecciona uno o más)</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {ORIGENES_LEAD.map((origen) => (
                      <div key={origen} className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.origen_lead.includes(origen)}
                          onCheckedChange={() => handleOrigenChange(origen)}
                        />
                        <label className="text-sm">{origen}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Terreno (m²)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.terreno_m2}
                    onChange={(e) => setFormData({ ...formData, terreno_m2: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Presupuesto Referencia</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.presupuesto_referencia}
                    onChange={(e) => setFormData({ ...formData, presupuesto_referencia: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Ubicación del Terreno</Label>
                  <Input
                    value={formData.ubicacion_terreno}
                    onChange={(e) => setFormData({ ...formData, ubicacion_terreno: e.target.value })}
                    placeholder="Descripción de la ubicación"
                  />
                </div>
                <div className="col-span-2">
                  <Label>Estado</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nuevo">Nuevo</SelectItem>
                      <SelectItem value="contactado">Contactado</SelectItem>
                      <SelectItem value="calificado">Calificado</SelectItem>
                      <SelectItem value="convertido">Convertido</SelectItem>
                      <SelectItem value="perdido">Perdido</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label>Notas Adicionales</Label>
                  <Textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    rows={4}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingLead ? 'Actualizar' : 'Crear'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
                <SelectItem value="">Todas</SelectItem>
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
                <SelectItem value="">Todos</SelectItem>
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
          {isLoading ? (
            <div>Cargando...</div>
          ) : (
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
                {leads?.map((lead) => (
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
                        <Button variant="outline" size="sm" onClick={() => handleEdit(lead)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
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