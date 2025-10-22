import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, X } from "lucide-react";

interface ConvertLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
  onSuccess: () => void;
}

export function ConvertLeadDialog({ open, onOpenChange, lead, onSuccess }: ConvertLeadDialogProps) {
  const [projects, setProjects] = useState([
    { 
      terreno_m2: lead.terreno_m2?.toString() || "", 
      ubicacion_json: lead.ubicacion_terreno_json || {},
      notas: "" 
    }
  ]);
  const [selectedSucursal, setSelectedSucursal] = useState(lead.sucursal_id || "");

  const { data: sucursales } = useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      const { data, error } = await supabase.from('sucursales').select('id, nombre').eq('activa', true);
      if (error) throw error;
      return data;
    }
  });

  const addProject = () => {
    setProjects([...projects, { terreno_m2: "", ubicacion_json: {}, notas: "" }]);
  };

  const removeProject = (index: number) => {
    setProjects(projects.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      // Create client
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .insert({
          person_type: 'fisica',
          name: lead.nombre_completo,
          email: lead.email,
          phone: lead.telefono,
          address_json: {
            direccion: lead.direccion,
            estado: lead.estado
          }
        })
        .select()
        .single();

      if (clientError) throw clientError;

      // Create projects
      const projectsToCreate = projects.map(p => ({
        client_id: client.id,
        sucursal_id: selectedSucursal || null,
        status: 'activo' as const,
        terreno_m2: p.terreno_m2 ? parseFloat(p.terreno_m2) : null,
        ubicacion_json: p.ubicacion_json,
        notas: p.notas || null
      }));

      const { error: projectsError } = await supabase
        .from('projects')
        .insert(projectsToCreate);

      if (projectsError) throw projectsError;

      // Update lead status
      const { error: updateError } = await supabase
        .from('leads')
        .update({ status: 'convertido', client_id: client.id })
        .eq('id', lead.id);

      if (updateError) throw updateError;

      toast.success("Lead convertido a cliente y proyecto(s) exitosamente");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Error al convertir lead: " + error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convertir Lead a Cliente y Proyecto(s)</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Datos del Cliente</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="font-medium">Nombre:</span> {lead.nombre_completo}</div>
              <div><span className="font-medium">Teléfono:</span> {lead.telefono || '-'}</div>
              <div><span className="font-medium">Email:</span> {lead.email || '-'}</div>
              <div><span className="font-medium">Estado:</span> {lead.estado || '-'}</div>
            </div>
          </div>

          <div>
            <Label>Sucursal para Proyecto(s)</Label>
            <Select value={selectedSucursal} onValueChange={setSelectedSucursal}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sucursal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin sucursal</SelectItem>
                {sucursales?.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-semibold">Proyectos a Crear</h3>
              <Button type="button" variant="outline" size="sm" onClick={addProject}>
                <Plus className="h-4 w-4 mr-1" /> Agregar Proyecto
              </Button>
            </div>

            {projects.map((project, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Proyecto {index + 1}</h4>
                  {projects.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeProject(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Terreno (m²)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={project.terreno_m2}
                      onChange={(e) => {
                        const newProjects = [...projects];
                        newProjects[index].terreno_m2 = e.target.value;
                        setProjects(newProjects);
                      }}
                    />
                  </div>
                  <div>
                    <Label>Ubicación</Label>
                    <Input
                      value={project.ubicacion_json.descripcion || ""}
                      onChange={(e) => {
                        const newProjects = [...projects];
                        newProjects[index].ubicacion_json = { descripcion: e.target.value };
                        setProjects(newProjects);
                      }}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Notas</Label>
                    <Textarea
                      value={project.notas}
                      onChange={(e) => {
                        const newProjects = [...projects];
                        newProjects[index].notas = e.target.value;
                        setProjects(newProjects);
                      }}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <Button type="submit">Convertir a Cliente y Crear Proyecto(s)</Button>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}