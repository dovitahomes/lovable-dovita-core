import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ChevronLeft, Bell, BellOff, Database, User, Lock, LogOut, Save, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/app/auth/AuthProvider';
import { useAuthClientId } from '@/hooks/client-app/useAuthClientId';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { appSignOut } from '@/lib/auth/logout';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const profileSchema = z.object({
  full_name: z.string().min(2, 'El nombre debe tener al menos 2 caracteres').max(100),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  newPassword: z.string().min(6, 'Mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Mínimo 6 caracteres'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: clientData } = useAuthClientId();
  
  const [pushEnabled, setPushEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [useMock, setUseMock] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Preferencias de notificaciones individuales
  const [preferences, setPreferences] = useState({
    chat: true,
    calendar: true,
    documents: true,
    photos: true,
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      full_name: '',
      phone: '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    // Cargar preferencias guardadas
    const savedPushEnabled = localStorage.getItem('pushNotificationsEnabled') === 'true';
    const savedUseMock = localStorage.getItem('clientapp.useMock') === 'true';
    const savedPreferences = localStorage.getItem('notificationPreferences');
    
    setPushEnabled(savedPushEnabled);
    setUseMock(savedUseMock);
    
    if (savedPreferences) {
      try {
        setPreferences(JSON.parse(savedPreferences));
      } catch (e) {
        console.error('Error parsing saved preferences:', e);
      }
    }
    
    // Verificar permiso actual de notificaciones del navegador
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Cargar datos del usuario
  useEffect(() => {
    if (clientData) {
      profileForm.reset({
        full_name: clientData.name || '',
        phone: '',
      });
    }
  }, [clientData]);

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Tu navegador no soporta notificaciones');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        setPushEnabled(true);
        localStorage.setItem('pushNotificationsEnabled', 'true');
        toast.success('Notificaciones activadas correctamente');
        
        // Show a test notification
        new Notification('Dovita', {
          body: 'Las notificaciones están activadas',
          icon: '/favicon.ico',
        });
      } else if (permission === 'denied') {
        toast.error('Permiso de notificaciones denegado');
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      toast.error('Error al solicitar permisos de notificación');
    }
  };

  const handleTogglePush = async () => {
    if (!pushEnabled && notificationPermission !== 'granted') {
      await requestNotificationPermission();
    } else {
      const newState = !pushEnabled;
      setPushEnabled(newState);
      localStorage.setItem('pushNotificationsEnabled', newState.toString());
      toast.success(newState ? 'Notificaciones activadas' : 'Notificaciones desactivadas');
    }
  };

  const handlePreferenceChange = (key: keyof typeof preferences) => {
    const newPreferences = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(newPreferences);
    localStorage.setItem('notificationPreferences', JSON.stringify(newPreferences));
    toast.success('Preferencias actualizadas');
  };

  const handleDataSourceToggle = (checked: boolean) => {
    setUseMock(checked);
    localStorage.setItem('clientapp.useMock', String(checked));
    toast.info('La fuente de datos se actualizará al cambiar de pantalla');
  };

  const handleProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    
    setUpdatingProfile(true);
    try {
      // Actualizar en tabla clients si existe clientData
      if (clientData?.id) {
        const { error } = await supabase
          .from('clients')
          .update({ name: data.full_name })
          .eq('id', clientData.id);
        
        if (error) throw error;
      }
      
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    setChangingPassword(true);
    try {
      // Actualizar contraseña
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      });
      
      if (error) throw error;
      
      toast.success('Contraseña actualizada correctamente');
      passwordForm.reset();
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Error al cambiar la contraseña');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    await appSignOut();
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center gap-3 px-4 py-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/client-app')}
              className="rounded-full"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-lg font-semibold">Ajustes</h1>
          </div>
        </div>

        {/* Content */}
        <main className="p-4 pb-24 space-y-4">
          {/* Datos Personales */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>Datos Personales</CardTitle>
              </div>
              <CardDescription>
                Actualiza tu información personal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(handleProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="full_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Juan Pérez" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+52 123 456 7890" type="tel" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="pt-2">
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <p className="text-sm font-medium mt-1">{user?.email || 'No disponible'}</p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={updatingProfile}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {updatingProfile ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Cambiar Contraseña */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-primary" />
                <CardTitle>Cambiar Contraseña</CardTitle>
              </div>
              <CardDescription>
                Actualiza tu contraseña de acceso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contraseña Actual</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="••••••••" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nueva Contraseña</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="••••••••" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                        <FormControl>
                          <Input {...field} type="password" placeholder="••••••••" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={changingPassword}
                  >
                    <Lock className="h-4 w-4 mr-2" />
                    {changingPassword ? 'Actualizando...' : 'Actualizar Contraseña'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Notificaciones Push */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                {pushEnabled && notificationPermission === 'granted' ? (
                  <Bell className="h-5 w-5 text-primary" />
                ) : (
                  <BellOff className="h-5 w-5 text-muted-foreground" />
                )}
                <CardTitle>Notificaciones Push</CardTitle>
              </div>
              <CardDescription>
                Recibe alertas en tiempo real
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="push-toggle" className="text-base">
                    Activar notificaciones
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {notificationPermission === 'granted' 
                      ? 'Las notificaciones están permitidas' 
                      : notificationPermission === 'denied'
                      ? 'Debes habilitar las notificaciones en la configuración de tu navegador'
                      : 'Permite que Dovita te envíe notificaciones'}
                  </p>
                </div>
                <Switch
                  id="push-toggle"
                  checked={pushEnabled}
                  onCheckedChange={handleTogglePush}
                  disabled={notificationPermission === 'denied'}
                />
              </div>

              {notificationPermission === 'denied' && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg text-sm">
                  <p className="font-medium">Notificaciones bloqueadas</p>
                  <p className="mt-1">
                    Para activar las notificaciones, ve a la configuración de tu navegador y permite las notificaciones para este sitio.
                  </p>
                </div>
              )}

              {pushEnabled && notificationPermission === 'granted' && (
                <>
                  <Separator />
                  
                  <div className="space-y-4">
                    <p className="text-sm font-medium">Tipos de notificaciones</p>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="chat-notif" className="text-sm font-normal">
                            Mensajes del chat
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Nuevos mensajes de tu equipo de construcción
                          </p>
                        </div>
                        <Switch
                          id="chat-notif"
                          checked={preferences.chat}
                          onCheckedChange={() => handlePreferenceChange('chat')}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="calendar-notif" className="text-sm font-normal">
                            Citas y calendario
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Recordatorios de citas y eventos
                          </p>
                        </div>
                        <Switch
                          id="calendar-notif"
                          checked={preferences.calendar}
                          onCheckedChange={() => handlePreferenceChange('calendar')}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="documents-notif" className="text-sm font-normal">
                            Documentos
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Nuevos archivos y documentos agregados
                          </p>
                        </div>
                        <Switch
                          id="documents-notif"
                          checked={preferences.documents}
                          onCheckedChange={() => handlePreferenceChange('documents')}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label htmlFor="photos-notif" className="text-sm font-normal">
                            Fotos de avance
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Nuevas fotos del progreso de tu proyecto
                          </p>
                        </div>
                        <Switch
                          id="photos-notif"
                          checked={preferences.photos}
                          onCheckedChange={() => handlePreferenceChange('photos')}
                        />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {pushEnabled && notificationPermission === 'granted' && (
            <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg">
              <div className="flex gap-3">
                <Check className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-sm">Notificaciones configuradas</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Recibirás notificaciones push según tus preferencias seleccionadas
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Fuente de Datos */}
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                <CardTitle>Fuente de Datos</CardTitle>
              </div>
              <CardDescription>
                Alternar entre datos de ejemplo y datos reales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="mock-toggle" className="text-base">
                    Usar datos de ejemplo (Mock)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {useMock ? 'Mostrando datos de ejemplo' : 'Conectado a Supabase'}
                  </p>
                </div>
                <Switch
                  id="mock-toggle"
                  checked={useMock}
                  onCheckedChange={handleDataSourceToggle}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cerrar Sesión */}
          <Card className="border-destructive/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <LogOut className="h-5 w-5 text-destructive" />
                <CardTitle className="text-destructive">Cerrar Sesión</CardTitle>
              </div>
              <CardDescription>
                Salir de tu cuenta de Dovita
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setShowLogoutDialog(true)}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar Sesión
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sesión?</AlertDialogTitle>
            <AlertDialogDescription>
              Se cerrará tu sesión y tendrás que volver a iniciar sesión para acceder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">
              Cerrar Sesión
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
