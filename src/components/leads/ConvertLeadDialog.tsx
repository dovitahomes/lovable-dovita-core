import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useConvertLead } from "@/hooks/useLeads";
import { Loader2, Plus, X } from "lucide-react";

interface ConvertLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lead: any;
}

export function ConvertLeadDialog({ open, onOpenChange, lead }: ConvertLeadDialogProps) {
  const [personType, setPersonType] = useState<'fisica' | 'moral'>('fisica');
  const [clientName, setClientName] = useState(lead?.nombre_completo || "");
  const [clientEmail, setClientEmail] = useState(lead?.email || "");
  const [clientPhone, setClientPhone] = useState(lead?.telefono || "");
  const [sucursalId, setSucursalId] = useState(lead?.sucursal_id || "");
  const [projects, setProjects] = useState([
    { 
      terreno_m2: lead?.terreno_m2 || undefined, 
      ubicacion_json: lead?.ubicacion_terreno_json || {},
      notas: "" 
    }
  ]);

  const { data: sucursales } = useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sucursales')
        .select('id, nombre')
        .eq('activa', true)
        .order('nombre');
      if (error) throw error;
      return data;
    }
  });

  const convertMutation = useConvertLead();

  const addProject = () => {
    setProjects([...projects, { terreno_m2: undefined, ubicacion_json: {}, notas: "" }]);
  };

  const removeProject = (index: number) => {
    if (projects.length > 1) {
      setProjects(projects.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await convertMutation.mutateAsync({
      leadId: lead.id,
      lead,
      personType,
      clientName,
      clientEmail,
      clientPhone,
      sucursalId: sucursalId === "none" ? undefined : sucursalId,
      projects
    });
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Convertir Lead a Cliente y Proyecto(s)</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
            <h3 className="font-semibold">Datos del Cliente</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tipo de Persona *</Label>
                <Select value={personType} onValueChange={(v) => setPersonType(v as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fisica">Física</SelectItem>
                    <SelectItem value="moral">Moral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Nombre / Razón Social *</Label>
                <Input
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  required
                />
              </div>
              
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                />
              </div>
              
              <div>
                <Label>Teléfono</Label>
                <Input
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>
            <Label>Sucursal para Proyecto(s)</Label>
            <Select value={sucursalId || "none"} onValueChange={setSucursalId}>
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
              <div key={index} className="border rounded-lg p-4 space-y-3 bg-background">
                <div className="flex justify-between items-center">
                  <h4 className="font-medium">Proyecto {index + 1}</h4>
                  {projects.length > 1 && (
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => removeProject(index)}
                    >
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
                      value={project.terreno_m2 || ""}
                      onChange={(e) => {
                        const newProjects = [...projects];
                        newProjects[index].terreno_m2 = e.target.value ? parseFloat(e.target.value) : undefined;
                        setProjects(newProjects);
                      }}
                    />
                  </div>
                  
                  <div>
                    <Label>Ubicación</Label>
                    <Input
                      placeholder="Descripción de ubicación"
                      value={project.ubicacion_json?.descripcion || ""}
                      onChange={(e) => {
                        const newProjects = [...projects];
                        newProjects[index].ubicacion_json = { 
                          ...newProjects[index].ubicacion_json,
                          descripcion: e.target.value 
                        };
                        setProjects(newProjects);
                      }}
                    />
                  </div>
                </div>
                
                <div>
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
            ))}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={convertMutation.isPending}>
              {convertMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Convertir a Cliente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
