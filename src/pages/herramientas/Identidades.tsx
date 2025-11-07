import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Users, UserPlus, Mail, Key, UserX, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type UserRole = "admin" | "colaborador" | "cliente";

interface UserFormData {
  full_name: string;
  email: string;
  phone: string;
  role: UserRole;
  sucursal_id?: string;
  fecha_nacimiento?: string;
}

const Identidades = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState<UserFormData>({
    full_name: "",
    email: "",
    phone: "",
    role: "colaborador",
    sucursal_id: "",
    fecha_nacimiento: "",
  });

  const { data: users, isLoading } = useQuery({
    queryKey: ["users-management"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vw_users_with_roles")
        .select("*")
        .order("full_name");

      if (error) throw error;
      return data;
    },
  });

  const { data: sucursales } = useQuery({
    queryKey: ["sucursales"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sucursales")
        .select("id, nombre")
        .eq("activa", true)
        .order("nombre");

      if (error) throw error;
      return data;
    },
  });

  const inviteUserMutation = useMutation({
    mutationFn: async (userData: UserFormData) => {
      // First, create the user in auth
      const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(
        userData.email,
        {
          data: {
            full_name: userData.full_name,
          },
        }
      );

      if (authError) throw authError;

      // Create profile
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        email: userData.email,
        full_name: userData.full_name,
        phone: userData.phone || null,
      });

      if (profileError) throw profileError;

      // Create user metadata
      if (userData.sucursal_id || userData.fecha_nacimiento) {
        const { error: metadataError } = await (supabase
          .from("user_metadata" as any)
          .insert({
            user_id: authData.user.id,
            sucursal_id: userData.sucursal_id || null,
            fecha_nacimiento: userData.fecha_nacimiento || null,
          }) as any);

        if (metadataError) throw metadataError;
      }

      // Assign role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role_name: userData.role,
      });

      if (roleError) throw roleError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-management"] });
      toast.success("Usuario creado e invitación enviada");
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al crear usuario");
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData: { id: string; data: Partial<UserFormData> }) => {
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          full_name: userData.data.full_name,
          phone: userData.data.phone,
        })
        .eq("id", userData.id);

      if (profileError) throw profileError;

      // Update or create user metadata
      const { error: metadataError } = await (supabase
        .from("user_metadata" as any)
        .upsert({
          user_id: userData.id,
          sucursal_id: userData.data.sucursal_id || null,
          fecha_nacimiento: userData.data.fecha_nacimiento || null,
        }) as any);

      if (metadataError) throw metadataError;

      // Update role if changed (using RPC for security)
      if (userData.data.role) {
        const { error: roleError } = await (supabase.rpc("admin_set_user_roles" as any, {
          target_user_id: userData.id,
          roles: [userData.data.role],
        }) as any);

        if (roleError) throw roleError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-management"] });
      toast.success("Usuario actualizado");
      setIsDialogOpen(false);
      setEditingUser(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al actualizar usuario");
    },
  });

  const deactivateUserMutation = useMutation({
    mutationFn: async (id: string) => {
      // Deactivate user in auth
      const { error } = await supabase.auth.admin.updateUserById(id, {
        ban_duration: "876000h", // ~100 years - effectively permanent
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users-management"] });
      toast.success("Usuario desactivado");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al desactivar usuario");
    },
  });

  const resendInviteMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.admin.inviteUserByEmail(email);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invitación reenviada");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al reenviar invitación");
    },
  });

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset`,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Email de recuperación enviado");
    },
    onError: (error: any) => {
      toast.error(error.message || "Error al enviar email");
    },
  });

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      role: "colaborador",
      sucursal_id: "",
      fecha_nacimiento: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUserMutation.mutate({
        id: editingUser.id,
        data: formData,
      });
    } else {
      inviteUserMutation.mutate(formData);
    }
  };

  const openEditDialog = (user: any) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: user.roles?.[0] || "colaborador",
      sucursal_id: user.sucursal_id || "",
      fecha_nacimiento: user.fecha_nacimiento || "",
    });
    setIsDialogOpen(true);
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "default";
      case "colaborador":
        return "secondary";
      case "cliente":
        return "outline";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
            <Users className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Identidades</h1>
            <p className="text-muted-foreground">Gestión de credenciales para clientes y colaboradores</p>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setEditingUser(null);
            resetForm();
          }
        }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Nuevo Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingUser ? "Editar Usuario" : "Crear Nuevo Usuario"}</DialogTitle>
              <DialogDescription>
                {editingUser 
                  ? "Actualiza la información del usuario" 
                  : "Se enviará una invitación por correo electrónico"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Nombre Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={!!editingUser}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Rol</Label>
                <Select value={formData.role} onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="colaborador">Colaborador</SelectItem>
                    <SelectItem value="cliente">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sucursal">Sucursal</Label>
                <Select value={formData.sucursal_id || "none"} onValueChange={(value) => setFormData({ ...formData, sucursal_id: value === "none" ? "" : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sin asignar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sin asignar</SelectItem>
                    {sucursales?.map((sucursal) => (
                      <SelectItem key={sucursal.id} value={sucursal.id}>
                        {sucursal.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                <Input
                  id="fecha_nacimiento"
                  type="date"
                  value={formData.fecha_nacimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_nacimiento: e.target.value })}
                />
              </div>

              <DialogFooter>
                <Button type="submit" disabled={inviteUserMutation.isPending || updateUserMutation.isPending}>
                  {editingUser ? "Actualizar" : "Crear e Invitar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios Registrados</CardTitle>
          <CardDescription>Administra todos los usuarios del sistema</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Cargando usuarios...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Sucursal</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Cumpleaños</TableHead>
                  <TableHead>Último Acceso</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map((user: any) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.roles?.[0] || "")}>
                        {user.roles?.[0] || "sin rol"}
                      </Badge>
                    </TableCell>
                    <TableCell>{user.sucursal_nombre || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="default">Activo</Badge>
                    </TableCell>
                    <TableCell>
                      {user.fecha_nacimiento 
                        ? format(new Date(user.fecha_nacimiento), "dd MMM", { locale: es })
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {user.last_login_at
                        ? format(new Date(user.last_login_at), "dd/MM/yyyy", { locale: es })
                        : "Nunca"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(user)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resendInviteMutation.mutate(user.email)}
                        >
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resetPasswordMutation.mutate(user.email)}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm("¿Estás seguro de que deseas desactivar este usuario?")) {
                              deactivateUserMutation.mutate(user.id);
                            }
                          }}
                        >
                          <UserX className="h-4 w-4" />
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
};

export default Identidades;
