import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WishlistForm } from "@/components/WishlistForm";
import { DocumentManager } from "@/components/DocumentManager";
import { ProjectChat } from "@/components/chat/ProjectChat";
import { ProjectCalendar } from "@/components/calendar/ProjectCalendar";
import { ArrowLeft, Building2, MapPin, User, HardHat, MessageSquare, Calendar } from "lucide-react";

export default function ProyectoDetalle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const role = 'admin'; // Temporarily hardcoded - will be restored in Prompt 2

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
        <Button onClick={() => navigate(`/construccion/${id}`)} className="gap-2">
          <HardHat className="h-4 w-4" />
          Ir a Construcción
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
      </div>

      <Tabs defaultValue="documentos" className="w-full">
        <TabsList>
          <TabsTrigger value="documentos">Documentos</TabsTrigger>
          <TabsTrigger value="wishlist">Wishlist</TabsTrigger>
          <TabsTrigger value="chat" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="citas" className="gap-2">
            <Calendar className="h-4 w-4" />
            Citas
          </TabsTrigger>
          <TabsTrigger value="detalles">Detalles</TabsTrigger>
        </TabsList>
        
        <TabsContent value="documentos" className="mt-6">
          <DocumentManager projectId={id!} userRole={role || undefined} />
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
        
        <TabsContent value="chat" className="mt-6">
          <ProjectChat projectId={id!} />
        </TabsContent>
        
        <TabsContent value="citas" className="mt-6">
          <ProjectCalendar projectId={id!} />
        </TabsContent>
        
        <TabsContent value="detalles" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Proyecto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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