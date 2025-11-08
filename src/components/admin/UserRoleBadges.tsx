import { useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { cn } from "@/lib/utils";
import { useState } from "react";

type AppRole = 'admin' | 'colaborador' | 'contador' | 'cliente';

const ROLES: { value: AppRole; label: string; variant: "default" | "secondary" | "outline" }[] = [
  { value: 'admin', label: 'Admin', variant: 'default' },
  { value: 'colaborador', label: 'Colaborador', variant: 'secondary' },
  { value: 'contador', label: 'Contador', variant: 'outline' },
  { value: 'cliente', label: 'Cliente', variant: 'outline' },
];

interface UserRoleBadgesProps {
  userId: string;
  currentRoles: AppRole[];
  onRoleChange?: () => void;
  readOnly?: boolean;
}

export function UserRoleBadges({ userId, currentRoles, onRoleChange, readOnly = false }: UserRoleBadgesProps) {
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    role: AppRole | null;
    action: 'add' | 'remove' | null;
  }>({
    open: false,
    role: null,
    action: null,
  });
  
  const toggleRoleMutation = useMutation({
    mutationFn: async ({ role, enabled }: { role: AppRole; enabled: boolean }) => {
      const newRoles = enabled 
        ? [...new Set([...currentRoles, role])]
        : currentRoles.filter(r => r !== role);

      const { error } = await supabase.rpc("admin_set_user_roles", {
        target_user_id: userId,
        roles: newRoles,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Rol ${variables.role} ${variables.enabled ? 'asignado' : 'removido'} exitosamente`);
      onRoleChange?.();
    },
    onError: (error: any) => {
      toast.error("Error al modificar rol: " + error.message);
    },
  });

  const handleToggle = (role: AppRole) => {
    if (readOnly) return;
    
    const hasRole = currentRoles.includes(role);
    
    setConfirmDialog({
      open: true,
      role,
      action: hasRole ? 'remove' : 'add',
    });
  };
  
  const confirmToggle = () => {
    if (!confirmDialog.role) return;
    
    const enabled = confirmDialog.action === 'add';
    toggleRoleMutation.mutate({ role: confirmDialog.role, enabled });
    setConfirmDialog({ open: false, role: null, action: null });
  };

  return (
    <>
      <div className="flex gap-2 flex-wrap">
        {ROLES.map((role) => {
          const isActive = currentRoles.includes(role.value);
          return (
            <Badge
              key={role.value}
              variant={isActive ? role.variant : "outline"}
              className={cn(
                readOnly 
                  ? "cursor-default" 
                  : "cursor-pointer transition-all",
                isActive ? 'opacity-100' : 'opacity-50 hover:opacity-75'
              )}
              onClick={() => !readOnly && handleToggle(role.value)}
            >
              {role.label}
              {isActive && " ✓"}
            </Badge>
          );
        })}
      </div>
      
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ open: false, role: null, action: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === 'add' ? 'Asignar' : 'Remover'} Rol
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === 'add' ? (
                <>
                  ¿Estás seguro de que deseas <strong>asignar</strong> el rol de{' '}
                  <strong>{ROLES.find(r => r.value === confirmDialog.role)?.label}</strong> a este usuario?
                  <br /><br />
                  Esto le otorgará los permisos asociados a este rol.
                </>
              ) : (
                <>
                  ¿Estás seguro de que deseas <strong>remover</strong> el rol de{' '}
                  <strong>{ROLES.find(r => r.value === confirmDialog.role)?.label}</strong> de este usuario?
                  <br /><br />
                  {confirmDialog.role === 'admin' && (
                    <span className="text-destructive font-semibold">
                      ⚠️ ADVERTENCIA: Esto eliminará todos los privilegios de administrador. Asegúrate de que existan otros administradores en el sistema.
                    </span>
                  )}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggle}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
