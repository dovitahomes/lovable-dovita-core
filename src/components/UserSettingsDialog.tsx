import { useState, useEffect } from 'react';
import { useAuth } from '@/app/auth/AuthProvider';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useUpdateUserProfile } from '@/hooks/useUpdateUserProfile';
import { useUploadAvatar } from '@/hooks/useUploadAvatar';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import { UserAvatar } from './UserAvatar';

interface UserSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserSettingsDialog({ open, onOpenChange }: UserSettingsDialogProps) {
  const { user } = useAuth();
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const { data: profile } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && open,
  });

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    fecha_nacimiento: profile?.fecha_nacimiento || '',
  });

  const updateProfile = useUpdateUserProfile();
  const uploadAvatar = useUploadAvatar();

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    try {
      // Upload avatar if changed
      if (avatarFile) {
        await uploadAvatar.mutateAsync({ userId: user.id, file: avatarFile });
      }

      // Update profile
      await updateProfile.mutateAsync({
        userId: user.id,
        data: {
          full_name: formData.full_name,
          phone: formData.phone || null,
          fecha_nacimiento: formData.fecha_nacimiento || null,
        },
      });

      toast.success('Configuración actualizada exitosamente');
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Error al actualizar la configuración');
    }
  };

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        fecha_nacimiento: profile.fecha_nacimiento || '',
      });
    }
  }, [profile]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configuraciones Personales</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="personal">Información Personal</TabsTrigger>
            <TabsTrigger value="preferences">Preferencias</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4 py-4">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Preview"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                ) : (
                  <div className="scale-150">
                    <UserAvatar />
                  </div>
                )}
                <div>
                  <input
                    type="file"
                    id="avatar-upload"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => document.getElementById('avatar-upload')?.click()}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Cambiar Foto
                  </Button>
                </div>
              </div>

              {/* Form Fields */}
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
                  value={profile?.email || user?.email || ''}
                  disabled
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Teléfono</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+52 123 456 7890"
                />
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

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateProfile.isPending || uploadAvatar.isPending}>
                  {(updateProfile.isPending || uploadAvatar.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="preferences" className="space-y-4">
            <div className="py-8 text-center text-muted-foreground">
              <p>Próximamente: Configuración de zona horaria, idioma y notificaciones</p>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
