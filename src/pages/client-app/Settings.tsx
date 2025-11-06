import { useState, useEffect } from 'react';
import { Bell, Database, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function Settings() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [useMock, setUseMock] = useState(true);
  const [preferences, setPreferences] = useState({
    chat: true,
    calendar: true,
    documents: true,
    photos: true,
  });

  useEffect(() => {
    // Check current notification permission
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    // Load saved preferences from localStorage
    const savedPrefs = localStorage.getItem('notificationPreferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }

    const savedPushEnabled = localStorage.getItem('pushNotificationsEnabled');
    if (savedPushEnabled) {
      setPushEnabled(savedPushEnabled === 'true');
    }

    // Load data source preference
    const savedUseMock = localStorage.getItem('clientapp.useMock');
    if (savedUseMock !== null) {
      setUseMock(savedUseMock === 'true');
    }
  }, []);

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
    localStorage.setItem('clientapp.useMock', checked.toString());
    toast.info('La fuente de datos se actualizará al cambiar de pantalla');
  };

  return (
    <div className="min-h-screen bg-background pb-safe">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Configuración</h1>
          <p className="text-muted-foreground mt-2">
            Gestiona tus preferencias de notificaciones
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones Push
            </CardTitle>
            <CardDescription>
              Recibe notificaciones en tiempo real sobre tu proyecto
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

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Fuente de Datos
            </CardTitle>
            <CardDescription>
              Alternar entre datos de ejemplo y datos reales de Supabase
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
      </div>
    </div>
  );
}
