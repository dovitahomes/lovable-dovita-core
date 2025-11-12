import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Handshake, Plus, Pencil, Trash2 } from "lucide-react";

interface Alianza {
  id: string;
  nombre: string;
  tipo: string;
  contacto_nombre: string | null;
  contacto_email: string | null;
  contacto_telefono: string | null;
  comision_porcentaje: number | null;
  fecha_inicio: string | null;
  fecha_fin: string | null;
  activa: boolean;
  notas: string | null;
}

const Alianzas = () => {
  const [alianzas, setAlianzas] = useState<Alianza[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Alianza, "id">>({
    nombre: "",
    tipo: "inmobiliaria",
    contacto_nombre: null,
    contacto_email: null,
    contacto_telefono: null,
    comision_porcentaje: 5.0, // Valor por defecto
    fecha_inicio: null,
    fecha_fin: null,
    activa: true,
    notas: null,
  });

  useEffect(() => {
    fetchAlianzas();
  }, []);

  const fetchAlianzas = async () => {
    const { data, error } = await supabase
      .from("alianzas")
      .select("*")
      .order("nombre");

    if (error) {
      toast.error("Error al cargar alianzas");
      return;
    }

    setAlianzas(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validar que comision_porcentaje sea obligatorio
    if (!formData.comision_porcentaje || formData.comision_porcentaje < 0) {
      toast.error("El porcentaje de comisión es obligatorio y debe ser mayor o igual a 0");
      setLoading(false);
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from("alianzas")
          .update(formData)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Alianza actualizada");
      } else {
        const { error } = await supabase
          .from("alianzas")
          .insert([formData]);

        if (error) throw error;
        toast.success("Alianza creada");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchAlianzas();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (alianza: Alianza) => {
    setEditingId(alianza.id);
    setFormData({
      nombre: alianza.nombre,
      tipo: alianza.tipo,
      contacto_nombre: alianza.contacto_nombre,
      contacto_email: alianza.contacto_email,
      contacto_telefono: alianza.contacto_telefono,
      comision_porcentaje: alianza.comision_porcentaje,
      fecha_inicio: alianza.fecha_inicio,
      fecha_fin: alianza.fecha_fin,
      activa: alianza.activa,
      notas: alianza.notas,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta alianza?")) return;

    const { error } = await supabase
      .from("alianzas")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error al eliminar");
    } else {
      toast.success("Alianza eliminada");
      fetchAlianzas();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      nombre: "",
      tipo: "inmobiliaria",
      contacto_nombre: null,
      contacto_email: null,
      contacto_telefono: null,
      comision_porcentaje: 5.0, // Valor por defecto
      fecha_inicio: null,
      fecha_fin: null,
      activa: true,
      notas: null,
    });
  };

  const getTipoLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      inmobiliaria: "Inmobiliaria",
      urbanizador: "Urbanizador",
      vendedor_externo: "Vendedor Externo",
    };
    return tipos[tipo] || tipo;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-secondary-hover flex items-center justify-center shadow-md">
            <Handshake className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Alianzas</h1>
            <p className="text-muted-foreground">Gestiona tus alianzas estratégicas</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Alianza
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Nueva"} Alianza</DialogTitle>
              <DialogDescription>
                {editingId ? "Modifica" : "Agrega"} la información de la alianza estratégica
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select value={formData.tipo} onValueChange={(value) => setFormData({ ...formData, tipo: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="inmobiliaria">Inmobiliaria</SelectItem>
                      <SelectItem value="urbanizador">Urbanizador</SelectItem>
                      <SelectItem value="vendedor_externo">Vendedor Externo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contacto_nombre">Contacto Nombre</Label>
                  <Input
                    id="contacto_nombre"
                    value={formData.contacto_nombre || ""}
                    onChange={(e) => setFormData({ ...formData, contacto_nombre: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contacto_telefono">Contacto Teléfono</Label>
                  <Input
                    id="contacto_telefono"
                    type="tel"
                    value={formData.contacto_telefono || ""}
                    onChange={(e) => setFormData({ ...formData, contacto_telefono: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contacto_email">Contacto Email</Label>
                <Input
                  id="contacto_email"
                  type="email"
                  value={formData.contacto_email || ""}
                  onChange={(e) => setFormData({ ...formData, contacto_email: e.target.value })}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="comision_porcentaje">
                    Comisión (%) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="comision_porcentaje"
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    required
                    value={formData.comision_porcentaje || ""}
                    onChange={(e) => setFormData({ ...formData, comision_porcentaje: e.target.value ? parseFloat(e.target.value) : 5.0 })}
                  />
                  <p className="text-sm text-muted-foreground">
                    Este % se aplicará automáticamente a presupuestos referidos por esta alianza
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha_inicio">Fecha Inicio</Label>
                  <Input
                    id="fecha_inicio"
                    type="date"
                    value={formData.fecha_inicio || ""}
                    onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fecha_fin">Fecha Fin</Label>
                  <Input
                    id="fecha_fin"
                    type="date"
                    value={formData.fecha_fin || ""}
                    onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  value={formData.notas || ""}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="activa"
                  checked={formData.activa}
                  onCheckedChange={(checked) => setFormData({ ...formData, activa: checked })}
                />
                <Label htmlFor="activa">Alianza activa</Label>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Guardando..." : "Guardar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Alianzas</CardTitle>
          <CardDescription>
            {alianzas.length} alianza{alianzas.length !== 1 ? "s" : ""} registrada{alianzas.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Comisión</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alianzas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hay alianzas registradas
                  </TableCell>
                </TableRow>
              ) : (
                alianzas.map((alianza) => (
                  <TableRow key={alianza.id}>
                    <TableCell className="font-medium">{alianza.nombre}</TableCell>
                    <TableCell>{getTipoLabel(alianza.tipo)}</TableCell>
                    <TableCell>{alianza.contacto_nombre || "-"}</TableCell>
                    <TableCell>{alianza.comision_porcentaje ? `${alianza.comision_porcentaje}%` : "-"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        alianza.activa
                          ? "bg-secondary/10 text-secondary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {alianza.activa ? "Activa" : "Inactiva"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(alianza)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(alianza.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default Alianzas;
