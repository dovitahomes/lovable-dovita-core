import { useState } from "react";
import { useProjectCollaborators, useAddCollaborator, useRemoveCollaborator } from "@/hooks/useProjectCollaborators";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, UserPlus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ProjectTeamTabProps {
  projectId: string;
}

const roleColors = {
  admin: "bg-red-500",
  colaborador: "bg-blue-500",
  viewer: "bg-gray-500",
};

const roleLabels = {
  admin: "Administrador",
  colaborador: "Colaborador",
  viewer: "Observador",
};

export default function ProjectTeamTab({ projectId }: ProjectTeamTabProps) {
  const { data: collaborators, isLoading } = useProjectCollaborators(projectId);
  const addCollaborator = useAddCollaborator();
  const removeCollaborator = useRemoveCollaborator();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedRole, setSelectedRole] = useState("colaborador");
  
  const { data: availableUsers } = useQuery({
    queryKey: ['available-users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
  });
  
  const handleAdd = async () => {
    if (!selectedUserId) return;
    
    await addCollaborator.mutateAsync({
      projectId,
      userId: selectedUserId,
      role: selectedRole,
    });
    
    setDialogOpen(false);
    setSelectedUserId("");
    setSelectedRole("colaborador");
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Equipo del Proyecto</h3>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Agregar Colaborador
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Agregar Colaborador</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm font-medium">Usuario</label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar usuario" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers?.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium">Rol</label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="colaborador">Colaborador</SelectItem>
                    <SelectItem value="viewer">Observador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleAdd} 
                disabled={!selectedUserId || addCollaborator.isPending}
                className="w-full"
              >
                {addCollaborator.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Agregar"
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium">Usuario</th>
                <th className="text-left p-4 font-medium">Rol</th>
                <th className="text-left p-4 font-medium">Fecha de Asignación</th>
                <th className="text-right p-4 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {collaborators?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center p-8 text-muted-foreground">
                    No hay colaboradores asignados
                  </td>
                </tr>
              ) : (
                collaborators?.map((collab) => (
                  <tr key={collab.id} className="border-b last:border-0 hover:bg-muted/50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{collab.profiles?.full_name || 'Sin nombre'}</div>
                        <div className="text-sm text-muted-foreground">{collab.profiles?.email}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={roleColors[collab.role]}>
                        {roleLabels[collab.role]}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(collab.created_at), "dd 'de' MMMM, yyyy", { locale: es })}
                    </td>
                    <td className="p-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCollaborator.mutate({ id: collab.id, projectId })}
                        disabled={removeCollaborator.isPending}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
