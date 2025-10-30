import { useMutation } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { adminSetUserRole } from "@/services/adminUsers";

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
}

export function UserRoleBadges({ userId, currentRoles, onRoleChange }: UserRoleBadgesProps) {
  const toggleRoleMutation = useMutation({
    mutationFn: async ({ role, enabled }: { role: AppRole; enabled: boolean }) => {
      await adminSetUserRole(userId, role, enabled);
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
    const hasRole = currentRoles.includes(role);
    toggleRoleMutation.mutate({ role, enabled: !hasRole });
  };

  return (
    <div className="flex gap-2 flex-wrap">
      {ROLES.map((role) => {
        const isActive = currentRoles.includes(role.value);
        return (
          <Badge
            key={role.value}
            variant={isActive ? role.variant : "outline"}
            className={`cursor-pointer transition-all ${
              isActive ? 'opacity-100' : 'opacity-50 hover:opacity-75'
            }`}
            onClick={() => handleToggle(role.value)}
          >
            {role.label}
            {isActive && " ✓"}
          </Badge>
        );
      })}
    </div>
  );
}
