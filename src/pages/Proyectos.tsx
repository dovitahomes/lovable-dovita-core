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
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Eye, LayoutGrid, LayoutList } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LoadingError } from "@/components/common/LoadingError";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Proyectos() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [filterSucursal, setFilterSucursal] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [viewMode, setViewMode] = useState<'cards' | 'table'>(isMobile ? 'cards' : 'cards'); // Default cards
  const [formData, setFormData] = useState({
    project_name: "",
    client_id: "",
    sucursal_id: "",
    status: "activo" as "activo" | "cerrado" | "archivado",
    terreno_m2: "",
    ubicacion_data: "",
    notas: ""
  });

  const queryClient = useQueryClient();

  const { data: projects, isLoading, error } = useQuery({
    queryKey: ['projects', filterSucursal, filterStatus],
    queryFn: async () => {
      let query = supabase
        .from('projects')
        .select('*, clients(name), sucursales(nombre)')
        .order('created_at', { ascending: false });
      
      if (filterSucursal && filterSucursal !== "all") query = query.eq('sucursal_id', filterSucursal);
      if (filterStatus && filterStatus !== "all") query = query.eq('status', filterStatus as any);
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const { data: clients } = useQuery({
    queryKey: ['clients'],
    queryFn: async () => {
      const { data, error } = await supabase.from('clients').select('id, name');
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
      const { error } = await supabase.from('projects').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success("Proyecto creado exitosamente");
      resetForm();
    },
    onError: (error) => toast.error("Error al crear proyecto: " + error.message)
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: any) => {
      const { error } = await supabase.from('projects').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success("Proyecto actualizado exitosamente");
      resetForm();
    },
    onError: (error) => toast.error("Error al actualizar proyecto: " + error.message)
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('projects').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success("Proyecto eliminado exitosamente");
    },
    onError: (error) => toast.error("Error al eliminar proyecto: " + error.message)
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const data = {
      project_name: formData.project_name || null,
      client_id: formData.client_id,
      sucursal_id: formData.sucursal_id === "none" ? null : formData.sucursal_id,
      status: formData.status,
      terreno_m2: formData.terreno_m2 ? parseFloat(formData.terreno_m2) : null,
      ubicacion_json: formData.ubicacion_data ? JSON.parse(formData.ubicacion_data) : null,
      notas: formData.notas || null
    };
    
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const resetForm = () => {
    setFormData({ project_name: "", client_id: "", sucursal_id: "", status: "activo", terreno_m2: "", ubicacion_data: "", notas: "" });
    setEditingProject(null);
    setOpen(false);
  };

  const handleEdit = (project: any) => {
    setEditingProject(project);
    setFormData({
      project_name: project.project_name || "",
      client_id: project.client_id,
      sucursal_id: project.sucursal_id || "",
      status: project.status,
      terreno_m2: project.terreno_m2?.toString() || "",
      ubicacion_data: project.ubicacion_json ? JSON.stringify(project.ubicacion_json, null, 2) : "",
      notas: project.notas || ""
    });
    setOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      activo: "default",
      cerrado: "secondary",
      archivado: "outline"
    };
    return <Badge variant={variants[status as keyof typeof variants] as any}>{status}</Badge>;
  };

  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Proyectos</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {/* Toggle vista (mobile fuerza cards) */}
          {!isMobile && (
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setOpen(true); }} className="flex-1 sm:flex-none">
                <Plus className="mr-2 h-4 w-4" /> Nuevo Proyecto
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Editar' : 'Crear'} Proyecto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="project_name">Nombre del Proyecto</Label>
                <Input
                  id="project_name"
                  type="text"
                  value={formData.project_name}
                  onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
                  placeholder="Ej: Casa en la Colina, Residencia Familiar García"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Nombre descriptivo para identificar el proyecto
                </p>
              </div>
              <div>
                <Label>Cliente</Label>
                <Select value={formData.client_id} onValueChange={(value) => setFormData({ ...formData, client_id: value })} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
                    <SelectItem value="none">Sin sucursal</SelectItem>
                    {sucursales?.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estado</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activo">Activo</SelectItem>
                    <SelectItem value="cerrado">Cerrado</SelectItem>
                    <SelectItem value="archivado">Archivado</SelectItem>
                  </SelectContent>
                </Select>
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
                <Label>Ubicación (JSON)</Label>
                <Textarea
                  value={formData.ubicacion_data}
                  onChange={(e) => setFormData({ ...formData, ubicacion_data: e.target.value })}
                  placeholder='{"lat": 0, "lng": 0, "direccion": "..."}'
                  rows={3}
                />
              </div>
              <div>
                <Label>Notas</Label>
                <Textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit">{editingProject ? 'Actualizar' : 'Crear'}</Button>
                <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
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
                <SelectItem value="activo">Activo</SelectItem>
                <SelectItem value="cerrado">Cerrado</SelectItem>
                <SelectItem value="archivado">Archivado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Proyectos</CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingError
            isLoading={isLoading}
            error={error}
            isEmpty={!projects || projects.length === 0}
            emptyMessage="Aún no hay proyectos"
            onRetry={() => queryClient.invalidateQueries({ queryKey: ['projects', filterSucursal, filterStatus] })}
          />
          
          {/* Vista Cards */}
          {!isLoading && !error && projects && projects.length > 0 && (isMobile || viewMode === 'cards') && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}

          {/* Vista Tabla (solo desktop) */}
          {!isLoading && !error && projects && projects.length > 0 && !isMobile && viewMode === 'table' && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Proyecto</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Terreno (m²)</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">
                      {project.project_name || 'Sin nombre'}
                    </TableCell>
                    <TableCell>{project.clients?.name}</TableCell>
                    <TableCell>{project.sucursales?.nombre || '-'}</TableCell>
                    <TableCell>{getStatusBadge(project.status)}</TableCell>
                    <TableCell>{project.terreno_m2 ? `${project.terreno_m2} m²` : '-'}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/proyectos/${project.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleEdit(project)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => deleteMutation.mutate(project.id)}>
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
    </div>
  );
}