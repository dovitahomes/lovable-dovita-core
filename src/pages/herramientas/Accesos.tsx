import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AVAILABLE_MODULES = [
  { id: "dashboard", name: "Dashboard" },
  { id: "proyectos", name: "Proyectos" },
  { id: "presupuestos", name: "Presupuestos" },
  { id: "documentos", name: "Documentos" },
  { id: "construccion", name: "Construcción" },
  { id: "finanzas", name: "Finanzas" },
  { id: "contabilidad", name: "Contabilidad" },
  { id: "comisiones", name: "Comisiones" },
  { id: "leads", name: "Leads" },
  { id: "clientes", name: "Clientes" },
  { id: "proveedores", name: "Proveedores" },
];

export default function Accesos() {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<string>("");

  const { data: users } = useQuery({
    queryKey: ["users-with-roles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select(`
          *,
          user_roles (role)
        `)
        .order("full_name");

      if (error) throw error;
      return data;
    },
  });

  const { data: permissions, isLoading } = useQuery({
    queryKey: ["user-permissions", selectedUser],
    queryFn: async () => {
      if (!selectedUser) return [];

      const { data, error } = await supabase
        .from("user_module_permissions")
        .select("*")
        .eq("user_id", selectedUser);

      if (error) throw error;
      return data;
    },
    enabled: !!selectedUser,
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async ({
      moduleName,
      field,
      value,
    }: {
      moduleName: string;
      field: string;
      value: boolean;
    }) => {
      const existing = permissions?.find((p) => p.module_name === moduleName);

      if (existing) {
        const { error } = await supabase
          .from("user_module_permissions")
          .update({ [field]: value })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from("user_module_permissions").insert({
          user_id: selectedUser,
          module_name: moduleName,
          [field]: value,
        });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-permissions"] });
      toast.success("Permiso actualizado");
    },
    onError: () => {
      toast.error("Error al actualizar permiso");
    },
  });

  const getPermissionValue = (moduleName: string, field: string): boolean => {
    const perm = permissions?.find((p) => p.module_name === moduleName);
    return perm ? perm[field as keyof typeof perm] as boolean : false;
  };

  const selectedUserData = users?.find((u) => u.profile_id === selectedUser);
  const userRole = (selectedUserData?.user_roles as any)?.[0]?.role;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2">
        <ShieldCheck className="h-8 w-8" />
        <div>
          <h1 className="text-3xl font-bold">Gestión de Accesos</h1>
          <p className="text-muted-foreground">
            Configura permisos granulares por usuario y módulo
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Seleccionar Usuario</CardTitle>
          <CardDescription>
            Elige un usuario para configurar sus permisos de acceso a módulos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-96">
                <SelectValue placeholder="Seleccionar usuario..." />
              </SelectTrigger>
              <SelectContent>
                {users?.map((user) => (
                  <SelectItem key={user.profile_id} value={user.profile_id || ""}>
                    {user.full_name} ({user.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {userRole && (
              <Badge variant={userRole === "admin" ? "default" : "secondary"}>
                {userRole}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedUser && (
        <Card>
          <CardHeader>
            <CardTitle>Permisos de Módulos</CardTitle>
            <CardDescription>
              Configura qué puede hacer el usuario en cada módulo
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div>Cargando permisos...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Módulo</TableHead>
                    <TableHead className="text-center">Ver</TableHead>
                    <TableHead className="text-center">Crear</TableHead>
                    <TableHead className="text-center">Editar</TableHead>
                    <TableHead className="text-center">Eliminar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {AVAILABLE_MODULES.map((module) => (
                    <TableRow key={module.id}>
                      <TableCell className="font-medium">{module.name}</TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={getPermissionValue(module.id, "can_view")}
                          onCheckedChange={(checked) =>
                            updatePermissionMutation.mutate({
                              moduleName: module.id,
                              field: "can_view",
                              value: !!checked,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={getPermissionValue(module.id, "can_create")}
                          onCheckedChange={(checked) =>
                            updatePermissionMutation.mutate({
                              moduleName: module.id,
                              field: "can_create",
                              value: !!checked,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={getPermissionValue(module.id, "can_edit")}
                          onCheckedChange={(checked) =>
                            updatePermissionMutation.mutate({
                              moduleName: module.id,
                              field: "can_edit",
                              value: !!checked,
                            })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={getPermissionValue(module.id, "can_delete")}
                          onCheckedChange={(checked) =>
                            updatePermissionMutation.mutate({
                              moduleName: module.id,
                              field: "can_delete",
                              value: !!checked,
                            })
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
