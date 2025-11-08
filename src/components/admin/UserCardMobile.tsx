import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Building, Key, Mail, MoreVertical, Trash2 } from 'lucide-react';

interface UserCardMobileProps {
  user: {
    id: string;
    avatar_url?: string;
    full_name?: string;
    email: string;
    roles: string[];
    sucursal_nombre?: string;
  };
  onView: () => void;
  onResetPassword: () => void;
  onResendInvite: () => void;
  onDelete: () => void;
}

export function UserCardMobile({
  user,
  onView,
  onResetPassword,
  onResendInvite,
  onDelete,
}: UserCardMobileProps) {
  return (
    <Card 
      onClick={onView}
      className="cursor-pointer active:scale-[0.98] transition-transform"
    >
      <CardContent className="p-3">
        <div className="flex gap-3">
          {/* Avatar */}
          <Avatar className="w-10 h-10 shrink-0">
            <AvatarImage src={user.avatar_url} />
            <AvatarFallback>
              {user.full_name?.charAt(0) || user.email.charAt(0)}
            </AvatarFallback>
          </Avatar>

          {/* Contenido principal */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">
              {user.full_name || 'Sin nombre'}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email}
            </p>

            {/* Roles */}
            {user.roles.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {user.roles.map((role) => (
                  <Badge 
                    key={role} 
                    variant="secondary"
                    className="text-xs px-1.5 py-0"
                  >
                    {role}
                  </Badge>
                ))}
              </div>
            )}

            {/* Sucursal */}
            {user.sucursal_nombre && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Building className="w-3 h-3" />
                {user.sucursal_nombre}
              </p>
            )}
          </div>

          {/* Dropdown de acciones */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button 
                variant="ghost" 
                size="sm"
                className="shrink-0 h-8 w-8 p-0"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onView();
              }}>
                Ver detalles
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onResetPassword();
              }}>
                <Key className="w-4 h-4 mr-2" />
                Restablecer contraseña
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onResendInvite();
              }}>
                <Mail className="w-4 h-4 mr-2" />
                Reenviar invitación
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
