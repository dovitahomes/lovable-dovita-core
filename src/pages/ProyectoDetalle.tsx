import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { WishlistForm } from "@/components/WishlistForm";
import { ProjectChat } from "@/components/chat/ProjectChat";
import { ProjectCalendarTab } from "@/components/project/ProjectCalendarTab";
import { ProjectDocumentsTab } from "@/components/project/ProjectDocumentsTab";
import { DesignTab } from "@/components/design/DesignTab";
import { ConstructionPhotosTab } from "@/components/construction/ConstructionPhotosTab";
import { useChecklistProgress } from "@/hooks/useChecklistProgress";
import { ArrowLeft, Building2, MapPin, User, HardHat, MessageSquare, Calendar, FileText, PenTool, Users, CalendarDays, Camera, CheckCircle2, Pencil, Check, X, Loader2 } from "lucide-react";
import { generateRoute } from "@/config/routes";
import { toast } from "sonner";

export default function ProyectoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = 'admin'; // Temporarily hardcoded - will be restored in Prompt 2
  const queryClient = useQueryClient();
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");

  const { data: project, isLoading, refetch } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*, clients(name, email, phone), sucursales(nombre)')
        .eq('id', id!)
        .single();
      if (error) throw error;
      return data;
    }
  });

  const { data: wishlist, refetch: refetchWishlist } = useQuery({
    queryKey: ['wishlist', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wishlists')
        .select('*')
        .eq('project_id', id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    }
  });

  const { data: checklistProgress } = useChecklistProgress(id || null);

  // Sincronizar editedName con project.project_name
  useEffect(() => {
    if (project?.project_name) {
      setEditedName(project.project_name);
    }
  }, [project?.project_name]);

  const updateProjectName = useMutation({
    mutationFn: async (newName: string) => {
      const { error } = await supabase
        .from('projects')
        .update({ project_name: newName })
        .eq('id', id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      setIsEditingName(false);
      toast.success("Nombre del proyecto actualizado");
    },
    onError: (error: any) => {
      toast.error("Error al actualizar: " + error.message);
    }
  });

  const handleSaveName = () => {
    if (!editedName.trim()) {
      toast.error("El nombre no puede estar vacío");
      return;
    }
    updateProjectName.mutate(editedName);
  };

  const handleCancelEdit = () => {
    setEditedName(project?.project_name || "");
    setIsEditingName(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  if (isLoading) {
    return <div className="container mx-auto p-6">Cargando...</div>;
  }

  if (!project) {
    return <div className="container mx-auto p-6">Proyecto no encontrado</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/proyectos')}>
            <ArrowLeft className="h-4 w-4 mr-2" /> Volver
          </Button>
          <h1 className="text-3xl font-bold">Expediente del Proyecto</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate(generateRoute.proyectoEquipo(id!))} className="gap-2">
            <Users className="h-4 w-4" />
            Equipo
          </Button>
          <Button variant="outline" onClick={() => navigate(`/mis-chats?project=${id}`)} className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </Button>
          <Button variant="outline" onClick={() => navigate(`/mi-calendario?project=${id}`)} className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Calendario
          </Button>
          <Button onClick={() => navigate(`/construccion/${id}`)} className="gap-2">
            <HardHat className="h-4 w-4" />
            Ir a Construcción
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" /> Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><span className="font-medium">Nombre:</span> {project.clients?.name}</div>
              {project.clients?.email && (
                <div><span className="font-medium">Email:</span> {project.clients.email}</div>
              )}
              {project.clients?.phone && (
                <div><span className="font-medium">Teléfono:</span> {project.clients.phone}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" /> Sucursal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm">
              {project.sucursales?.nombre || 'Sin sucursal asignada'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" /> Terreno
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              {project.terreno_m2 && (
                <div><span className="font-medium">Tamaño:</span> {project.terreno_m2} m²</div>
              )}
              {project.ubicacion_json && typeof project.ubicacion_json === 'object' && 'descripcion' in project.ubicacion_json && (
                <div><span className="font-medium">Ubicación:</span> {String(project.ubicacion_json.descripcion)}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" /> Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progreso Total</span>
                  <span className="font-medium">{checklistProgress?.completed || 0}/{checklistProgress?.total || 0}</span>
                </div>
                <Progress value={checklistProgress?.porcentajeTotal || 0} className="h-2" />
              </div>
              
              {checklistProgress && checklistProgress.obligatorios > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Obligatorios:</span>
                  <Badge 
                    variant={
                      checklistProgress.obligatoriosCompletos === checklistProgress.obligatorios 
                        ? "default" 
                        : "destructive"
                    }
                    className="text-xs"
                  >
                    {checklistProgress.obligatoriosCompletos}/{checklistProgress.obligatorios}
                  </Badge>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="documentos" className="w-full">
        <TabsList>
          <TabsTrigger value="documentos" className="gap-2">
            <FileText className="h-4 w-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="fotos" className="gap-2">
            <Camera className="h-4 w-4" />
            Fotos
          </TabsTrigger>
          <TabsTrigger value="diseno" className="gap-2">
            <PenTool className="h-4 w-4" />
            Diseño
          </TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          <TabsTrigger 
            value="chat" 
            className="gap-2"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/mis-chats?project=${id}`);
            }}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger 
            value="citas" 
            className="gap-2"
            onClick={(e) => {
              e.preventDefault();
              navigate(`/mi-calendario?project=${id}`);
            }}
          >
            <Calendar className="h-4 w-4" />
            Calendario
          </TabsTrigger>
          <TabsTrigger value="detalles">Detalles</TabsTrigger>
        </TabsList>
        
        <TabsContent value="documentos" className="mt-6">
          <ProjectDocumentsTab projectId={id!} />
        </TabsContent>
        
        <TabsContent value="fotos" className="mt-6">
          <ConstructionPhotosTab projectId={id!} />
        </TabsContent>
        
        <TabsContent value="diseno" className="mt-6">
          <DesignTab projectId={id!} />
        </TabsContent>
        
        <TabsContent value="wishlist" className="mt-6">
          <WishlistForm 
            projectId={id!} 
            existingWishlist={wishlist}
            onSaved={() => {
              refetchWishlist();
              refetch();
            }}
          />
        </TabsContent>
        
        
        <TabsContent value="citas" className="mt-6">
          <ProjectCalendarTab projectId={id!} />
        </TabsContent>
        
        <TabsContent value="detalles" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Proyecto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Nombre del Proyecto Editable */}
              <div className="pb-4 border-b">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-medium text-sm text-muted-foreground">Nombre del Proyecto:</span>
                </div>
                
                {!isEditingName ? (
                  <div className="flex items-center gap-2 group">
                    <span className="text-lg font-semibold">
                      {project.project_name || "Sin nombre"}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setIsEditingName(true)}
                    >
                      <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      value={editedName}
                      onChange={(e) => setEditedName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Nombre del proyecto"
                      className="max-w-md"
                      autoFocus
                      disabled={updateProjectName.isPending}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                      onClick={handleSaveName}
                      disabled={updateProjectName.isPending}
                    >
                      {updateProjectName.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={handleCancelEdit}
                      disabled={updateProjectName.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Grid existente de Estado y Fecha */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Estado:</span>
                  <span className="ml-2 capitalize">{project.status}</span>
                </div>
                <div>
                  <span className="font-medium">Fecha de creación:</span>
                  <span className="ml-2">{new Date(project.created_at).toLocaleDateString('es-MX')}</span>
                </div>
              </div>
              
              {/* Notas existentes */}
              {project.notas && (
                <div>
                  <span className="font-medium">Notas:</span>
                  <p className="mt-2 text-muted-foreground">{project.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}