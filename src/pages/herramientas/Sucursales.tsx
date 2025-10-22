import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { MapPin, Plus, Pencil, Trash2 } from "lucide-react";

interface Sucursal {
  id: string;
  nombre: string;
  direccion: string;
  ciudad: string | null;
  estado: string | null;
  codigo_postal: string | null;
  telefono: string | null;
  email: string | null;
  responsable: string | null;
  activa: boolean;
}

const Sucursales = () => {
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Sucursal, "id">>({
    nombre: "",
    direccion: "",
    ciudad: null,
    estado: null,
    codigo_postal: null,
    telefono: null,
    email: null,
    responsable: null,
    activa: true,
  });

  useEffect(() => {
    fetchSucursales();
  }, []);

  const fetchSucursales = async () => {
    const { data, error } = await supabase
      .from("sucursales")
      .select("*")
      .order("nombre");

    if (error) {
      toast.error("Error al cargar sucursales");
      return;
    }

    setSucursales(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingId) {
        const { error } = await supabase
          .from("sucursales")
          .update(formData)
          .eq("id", editingId);

        if (error) throw error;
        toast.success("Sucursal actualizada");
      } else {
        const { error } = await supabase
          .from("sucursales")
          .insert([formData]);

        if (error) throw error;
        toast.success("Sucursal creada");
      }

      setIsDialogOpen(false);
      resetForm();
      fetchSucursales();
    } catch (error: any) {
      toast.error(error.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sucursal: Sucursal) => {
    setEditingId(sucursal.id);
    setFormData({
      nombre: sucursal.nombre,
      direccion: sucursal.direccion,
      ciudad: sucursal.ciudad,
      estado: sucursal.estado,
      codigo_postal: sucursal.codigo_postal,
      telefono: sucursal.telefono,
      email: sucursal.email,
      responsable: sucursal.responsable,
      activa: sucursal.activa,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta sucursal?")) return;

    const { error } = await supabase
      .from("sucursales")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Error al eliminar");
    } else {
      toast.success("Sucursal eliminada");
      fetchSucursales();
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      nombre: "",
      direccion: "",
      ciudad: null,
      estado: null,
      codigo_postal: null,
      telefono: null,
      email: null,
      responsable: null,
      activa: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-hover flex items-center justify-center shadow-md">
            <MapPin className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Sucursales</h1>
            <p className="text-muted-foreground">Gestiona las sucursales de tu empresa</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Sucursal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar" : "Nueva"} Sucursal</DialogTitle>
              <DialogDescription>
                {editingId ? "Modifica" : "Agrega"} la información de la sucursal
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
                  <Label htmlFor="responsable">Responsable</Label>
                  <Input
                    id="responsable"
                    value={formData.responsable || ""}
                    onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección *</Label>
                <Input
                  id="direccion"
                  value={formData.direccion}
                  onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    value={formData.ciudad || ""}
                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estado">Estado</Label>
                  <Input
                    id="estado"
                    value={formData.estado || ""}
                    onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="codigo_postal">Código Postal</Label>
                  <Input
                    id="codigo_postal"
                    value={formData.codigo_postal || ""}
                    onChange={(e) => setFormData({ ...formData, codigo_postal: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    type="tel"
                    value={formData.telefono || ""}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="activa"
                  checked={formData.activa}
                  onCheckedChange={(checked) => setFormData({ ...formData, activa: checked })}
                />
                <Label htmlFor="activa">Sucursal activa</Label>
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
          <CardTitle>Lista de Sucursales</CardTitle>
          <CardDescription>
            {sucursales.length} sucursal{sucursales.length !== 1 ? "es" : ""} registrada{sucursales.length !== 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Responsable</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sucursales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hay sucursales registradas
                  </TableCell>
                </TableRow>
              ) : (
                sucursales.map((sucursal) => (
                  <TableRow key={sucursal.id}>
                    <TableCell className="font-medium">{sucursal.nombre}</TableCell>
                    <TableCell>{sucursal.direccion}</TableCell>
                    <TableCell>{sucursal.ciudad || "-"}</TableCell>
                    <TableCell>{sucursal.responsable || "-"}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        sucursal.activa
                          ? "bg-secondary/10 text-secondary"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {sucursal.activa ? "Activa" : "Inactiva"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(sucursal)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(sucursal.id)}
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

export default Sucursales;
