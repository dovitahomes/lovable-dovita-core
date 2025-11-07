import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, Search, UserPlus, Trash2 } from "lucide-react";
import { UserRoleBadges } from "@/components/admin/UserRoleBadges";
import { PermissionMatrix } from "@/components/admin/PermissionMatrix";
import { RoleChangeHistory } from "@/components/admin/RoleChangeHistory";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { inviteUser, deleteUser } from "@/lib/userManagement";
import { useAuth } from "@/app/auth/AuthProvider";

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
};

export default function Usuarios() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Read from vw_users_with_roles view created in migration
      const { data, error } = await supabase
        .from('vw_users_with_roles')
        .select('id, email, full_name, roles');
      
      if (error) {
        console.warn('Could not load users:', error.message);
        return [];
      }
      
      return (data ?? []).map((r: any) => ({
        id: r.id,
        email: r.email,
        full_name: r.full_name ?? '',
        roles: Array.isArray(r.roles) ? r.roles : [],
      }));
    },
  });

  const inviteUserMutation = useMutation({
    mutationFn: async ({ email, fullName }: { email: string; fullName: string }) => {
      const result = await inviteUser({ email, full_name: fullName });
      if (!result.success) {
        throw new Error(result.error || 'Failed to invite user');
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Invitación enviada exitosamente");
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteName("");
    },
    onError: (error: any) => {
      toast.error("Error al invitar usuario: " + error.message);
    },
  });

  const handleInvite = () => {
    if (!inviteEmail) {
      toast.error("El email es requerido");
      return;
    }
    inviteUserMutation.mutate({ email: inviteEmail, fullName: inviteName });
  };

  const handleDeleteClick = (userRow: UserRow) => {
    setUserToDelete(userRow);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    
    const result = await deleteUser(userToDelete.id);

    if (result.success) {
      toast.success("Usuario eliminado exitosamente");
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      
      // If deleted user was selected, clear selection
      if (selectedUserId === userToDelete.id) {
        setSelectedUserId(null);
      }
    } else {
      toast.error(result.error || "Error al eliminar usuario");
    }
    
    setIsDeleting(false);
  };

  const filteredUsers = users?.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const selectedUser = users?.find(u => u.id === selectedUserId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8" />
          <div>
            <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
            <p className="text-muted-foreground">
              Administra roles y permisos de usuarios
            </p>
          </div>
        </div>

        <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invitar Usuario
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invitar Nuevo Usuario</DialogTitle>
              <DialogDescription>
                El usuario recibirá un correo para establecer su contraseña
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre Completo</Label>
                <Input
                  id="name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Nombre completo (opcional)"
                />
              </div>
              <Button 
                onClick={handleInvite} 
                className="w-full"
                disabled={inviteUserMutation.isPending}
              >
                {inviteUserMutation.isPending ? "Enviando..." : "Enviar Invitación"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios del Sistema</CardTitle>
          <CardDescription>
            Selecciona un usuario para gestionar sus roles y permisos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por email o nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-sm"
              />
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Cargando usuarios...
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Roles</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        {isLoading ? 'Cargando usuarios...' : 'No hay usuarios disponibles'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((userRow) => (
                      <TableRow 
                        key={userRow.id}
                        className={selectedUserId === userRow.id ? "bg-muted" : ""}
                      >
                        <TableCell className="font-medium">{userRow.email}</TableCell>
                        <TableCell>{userRow.full_name || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {userRow.roles.length > 0 ? (
                              userRow.roles.map((role) => (
                                <span
                                  key={role}
                                  className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary"
                                >
                                  {role}
                                </span>
                              ))
                            ) : (
                              <span className="text-muted-foreground text-sm">Sin roles</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant={selectedUserId === userRow.id ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedUserId(userRow.id)}
                            >
                              {selectedUserId === userRow.id ? "Seleccionado" : "Seleccionar"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(userRow);
                              }}
                              disabled={userRow.id === user?.id}
                              title={userRow.id === user?.id ? "No puedes eliminar tu propio usuario" : "Eliminar usuario"}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Roles de {selectedUser.email}</CardTitle>
              <CardDescription>
                Activa o desactiva roles para este usuario
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserRoleBadges
                userId={selectedUser.id}
                currentRoles={selectedUser.roles as any[]}
                onRoleChange={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Permisos por Módulo</CardTitle>
              <CardDescription>
                Configura permisos granulares para cada módulo del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PermissionMatrix userId={selectedUser.id} />
            </CardContent>
          </Card>

          <RoleChangeHistory userId={selectedUser.id} />
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuario?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Esta acción es <strong>irreversible</strong> y eliminará completamente:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>La cuenta de usuario ({userToDelete?.email})</li>
                <li>Todos sus roles y permisos</li>
                <li>Su perfil y datos asociados</li>
                <li>El acceso a la plataforma será revocado inmediatamente</li>
              </ul>
              <p className="font-semibold mt-4">
                ¿Estás seguro que deseas continuar?
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Eliminando..." : "Sí, eliminar usuario"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
