import { useState } from 'react';
import { useAuth } from '@/app/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { UserAvatar } from './UserAvatar';
import { UserSettingsDialog } from './UserSettingsDialog';
import { ChangePasswordDialog } from './ChangePasswordDialog';
import { Settings, Key, Fingerprint, LogOut } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useBiometricAuth } from '@/hooks/useBiometricAuth';
import { toast } from 'sonner';

export function UserMenu() {
  const { user, signOut } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const { isSupported, isEnabled, register, disable, isLoading } = useBiometricAuth();

  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleBiometricToggle = async () => {
    if (isEnabled) {
      await disable();
    } else {
      await register();
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="focus:outline-none">
            <UserAvatar />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{profile?.full_name}</p>
              <p className="text-xs leading-none text-muted-foreground">{profile?.email || user?.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Configuraciones Personales</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setPasswordOpen(true)}>
            <Key className="mr-2 h-4 w-4" />
            <span>Cambiar Contraseña</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="cursor-default"
          >
            <Fingerprint className="mr-2 h-4 w-4" />
            <span className="flex-1">Login con Biométricos</span>
            <Switch
              checked={isEnabled || false}
              onCheckedChange={handleBiometricToggle}
              disabled={!isSupported || isLoading}
              className="ml-2"
            />
          </DropdownMenuItem>
          {!isSupported && (
            <p className="px-2 py-1 text-xs text-muted-foreground">
              Los biométricos solo funcionan en producción o localhost, no en el preview de Lovable
            </p>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Cerrar Sesión</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <UserSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}
