import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Users, Search, UserPlus } from "lucide-react";
import { UserRoleBadges } from "@/components/admin/UserRoleBadges";
import { PermissionMatrix } from "@/components/admin/PermissionMatrix";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
};

export default function Usuarios() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);

  const { data: users, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      // Read from vw_users_basic view created in migration
      const { data, error } = await supabase
        .from('vw_users_basic')
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
      const { data, error } = await supabase.auth.admin.inviteUserByEmail(email, {
        data: { full_name: fullName }
      });
      if (error) throw error;
      return data;
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
                    filteredUsers.map((user) => (
                      <TableRow 
                        key={user.id}
                        className={selectedUserId === user.id ? "bg-muted" : ""}
                      >
                        <TableCell className="font-medium">{user.email}</TableCell>
                        <TableCell>{user.full_name || "-"}</TableCell>
                        <TableCell>
                          <div className="flex gap-1 flex-wrap">
                            {user.roles.length > 0 ? (
                              user.roles.map((role) => (
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
                          <Button
                            variant={selectedUserId === user.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedUserId(user.id)}
                          >
                            {selectedUserId === user.id ? "Seleccionado" : "Seleccionar"}
                          </Button>
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
        </>
      )}
    </div>
  );
}
