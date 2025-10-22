import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";

interface ProjectTeamTabProps {
  projectId: string;
}

export function ProjectTeamTab({ projectId }: ProjectTeamTabProps) {
  const [members, setMembers] = useState<any[]>([]);
  const [crew, setCrew] = useState<any[]>([]);
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [equipment, setEquipment] = useState<any[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogType, setDialogType] = useState<"crew" | "subcontractor" | "equipment">("crew");
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    loadData();
  }, [projectId]);

  const loadData = async () => {
    // Load project members
    const { data: membersData } = await supabase
      .from("project_members")
      .select("*, users(full_name, email)")
      .eq("project_id", projectId);
    setMembers(membersData || []);

    // Load crew
    const { data: crewData } = await supabase
      .from("project_crew")
      .select("*")
      .eq("project_id", projectId);
    setCrew(crewData || []);

    // Load subcontractors
    const { data: subData } = await supabase
      .from("project_subcontractors")
      .select("*")
      .eq("project_id", projectId);
    setSubcontractors(subData || []);

    // Load equipment
    const { data: equipData } = await supabase
      .from("project_equipment")
      .select("*, providers(name)")
      .eq("project_id", projectId);
    setEquipment(equipData || []);

    // Load providers for equipment
    const { data: provData } = await supabase
      .from("providers")
      .select("id, name")
      .eq("activo", true);
    setProviders(provData || []);
  };

  const openDialog = (type: typeof dialogType, data?: any) => {
    setDialogType(type);
    setFormData(data || {});
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    try {
      const table =
        dialogType === "crew"
          ? "project_crew"
          : dialogType === "subcontractor"
          ? "project_subcontractors"
          : "project_equipment";

      if (formData.id) {
        const { error } = await supabase
          .from(table)
          .update(formData)
          .eq("id", formData.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(table)
          .insert({ ...formData, project_id: projectId });
        if (error) throw error;
      }

      toast.success("Guardado correctamente");
      setShowDialog(false);
      setFormData({});
      loadData();
    } catch (error: any) {
      toast.error("Error: " + error.message);
    }
  };

  const handleDelete = async (type: typeof dialogType, id: string) => {
    const table =
      type === "crew"
        ? "project_crew"
        : type === "subcontractor"
        ? "project_subcontractors"
        : "project_equipment";

    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      toast.error("Error al eliminar");
    } else {
      toast.success("Eliminado correctamente");
      loadData();
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="members">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="members">Miembros</TabsTrigger>
          <TabsTrigger value="crew">Cuadrillas</TabsTrigger>
          <TabsTrigger value="subcontractors">Subcontratistas</TabsTrigger>
          <TabsTrigger value="equipment">Maquinaria</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Miembros del Proyecto</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell>{m.users?.full_name}</TableCell>
                      <TableCell>{m.users?.email}</TableCell>
                      <TableCell>{m.role_en_proyecto}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crew">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Cuadrillas</CardTitle>
              <Button onClick={() => openDialog("crew")} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Añadir
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Personas</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {crew.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>{c.nombre}</TableCell>
                      <TableCell>{c.especialidad}</TableCell>
                      <TableCell>{c.numero_personas}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openDialog("crew", c)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete("crew", c.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subcontractors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Subcontratistas</CardTitle>
              <Button onClick={() => openDialog("subcontractor")} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Añadir
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Costo Aprox.</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subcontractors.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.nombre}</TableCell>
                      <TableCell>{s.especialidad}</TableCell>
                      <TableCell>${s.costo_aproximado}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openDialog("subcontractor", s)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete("subcontractor", s.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipment">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Maquinaria y Equipo</CardTitle>
              <Button onClick={() => openDialog("equipment")} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Añadir
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Costo Renta/Día</TableHead>
                    <TableHead>Proveedor</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipment.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell>{e.nombre}</TableCell>
                      <TableCell>{e.tipo}</TableCell>
                      <TableCell>{e.costo_renta_diario ? `$${e.costo_renta_diario}` : "-"}</TableCell>
                      <TableCell>{e.providers?.name || "-"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => openDialog("equipment", e)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete("equipment", e.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {formData.id ? "Editar" : "Añadir"}{" "}
              {dialogType === "crew" ? "Cuadrilla" : dialogType === "subcontractor" ? "Subcontratista" : "Equipo"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={formData.nombre || ""}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              />
            </div>
            
            {dialogType !== "equipment" && (
              <div>
                <Label>Especialidad</Label>
                <Input
                  value={formData.especialidad || ""}
                  onChange={(e) => setFormData({ ...formData, especialidad: e.target.value })}
                />
              </div>
            )}

            {dialogType === "crew" && (
              <div>
                <Label>Número de Personas</Label>
                <Input
                  type="number"
                  value={formData.numero_personas || ""}
                  onChange={(e) => setFormData({ ...formData, numero_personas: parseInt(e.target.value) })}
                />
              </div>
            )}

            {dialogType === "subcontractor" && (
              <div>
                <Label>Costo Aproximado</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.costo_aproximado || ""}
                  onChange={(e) => setFormData({ ...formData, costo_aproximado: parseFloat(e.target.value) })}
                />
              </div>
            )}

            {dialogType === "equipment" && (
              <>
                <div>
                  <Label>Tipo</Label>
                  <Select
                    value={formData.tipo || ""}
                    onValueChange={(v) => setFormData({ ...formData, tipo: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="propia">Propia</SelectItem>
                      <SelectItem value="rentada">Rentada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Descripción</Label>
                  <Textarea
                    value={formData.descripcion || ""}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Costo Renta Diario</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.costo_renta_diario || ""}
                    onChange={(e) => setFormData({ ...formData, costo_renta_diario: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Proveedor</Label>
                  <Select
                    value={formData.proveedor_id || ""}
                    onValueChange={(v) => setFormData({ ...formData, proveedor_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      {providers.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <Button onClick={handleSubmit} className="w-full">
              Guardar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
