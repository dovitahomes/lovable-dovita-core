import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { adminSetModulePermission } from "@/services/adminUsers";
import { MODULES } from "@/config/modules";

interface PermissionMatrixProps {
  userId: string;
}

type ModulePermission = {
  module_name: string;
  can_view: boolean;
  can_create: boolean;
  can_edit: boolean;
  can_delete: boolean;
};

export function PermissionMatrix({ userId }: PermissionMatrixProps) {
  const queryClient = useQueryClient();

  const { data: permissions, isLoading } = useQuery({
    queryKey: ["user-module-permissions", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_module_permissions")
        .select("*")
        .eq("user_id", userId);

      if (error) throw error;
      return data as ModulePermission[];
    },
  });

  const updatePermissionMutation = useMutation({
    mutationFn: async ({
      module,
      field,
      value,
    }: {
      module: string;
      field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete';
      value: boolean;
    }) => {
      const existing = permissions?.find((p) => p.module_name === module);
      
      const perms = {
        can_view: existing?.can_view ?? false,
        can_create: existing?.can_create ?? false,
        can_edit: existing?.can_edit ?? false,
        can_delete: existing?.can_delete ?? false,
        [field]: value,
      };

      await adminSetModulePermission(userId, module, perms);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-module-permissions", userId] });
      toast.success("Permiso actualizado");
    },
    onError: (error: any) => {
      toast.error("Error al actualizar permiso: " + error.message);
    },
  });

  const getPermissionValue = (moduleName: string, field: keyof ModulePermission): boolean => {
    const perm = permissions?.find((p) => p.module_name === moduleName);
    return perm ? (perm[field] as boolean) : false;
  };

  // Filter out client_portal from the matrix
  const displayModules = MODULES.filter(m => m.key !== 'client_portal');

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando permisos...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">Módulo</TableHead>
            <TableHead className="text-center w-[100px]">Ver</TableHead>
            <TableHead className="text-center w-[100px]">Crear</TableHead>
            <TableHead className="text-center w-[100px]">Editar</TableHead>
            <TableHead className="text-center w-[100px]">Eliminar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayModules.map((module) => (
            <TableRow key={module.key}>
              <TableCell className="font-medium">{module.label}</TableCell>
              <TableCell className="text-center">
                <Checkbox
                  checked={getPermissionValue(module.key, "can_view")}
                  onCheckedChange={(checked) =>
                    updatePermissionMutation.mutate({
                      module: module.key,
                      field: "can_view",
                      value: !!checked,
                    })
                  }
                />
              </TableCell>
              <TableCell className="text-center">
                <Checkbox
                  checked={getPermissionValue(module.key, "can_create")}
                  onCheckedChange={(checked) =>
                    updatePermissionMutation.mutate({
                      module: module.key,
                      field: "can_create",
                      value: !!checked,
                    })
                  }
                />
              </TableCell>
              <TableCell className="text-center">
                <Checkbox
                  checked={getPermissionValue(module.key, "can_edit")}
                  onCheckedChange={(checked) =>
                    updatePermissionMutation.mutate({
                      module: module.key,
                      field: "can_edit",
                      value: !!checked,
                    })
                  }
                />
              </TableCell>
              <TableCell className="text-center">
                <Checkbox
                  checked={getPermissionValue(module.key, "can_delete")}
                  onCheckedChange={(checked) =>
                    updatePermissionMutation.mutate({
                      module: module.key,
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
    </div>
  );
}
