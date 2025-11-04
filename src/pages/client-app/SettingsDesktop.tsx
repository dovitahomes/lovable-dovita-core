import { useState, useEffect } from 'react';
import { Bell, Check, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export default function SettingsDesktop() {
  const navigate = useNavigate();
  const [pushEnabled, setPushEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState({
    chat: true,
    calendar: true,
    documents: true,
    photos: true,
  });

  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }

    const savedPrefs = localStorage.getItem('notificationPreferences');
    if (savedPrefs) {
      setPreferences(JSON.parse(savedPrefs));
    }

    const savedPushEnabled = localStorage.getItem('pushNotificationsEnabled');
    if (savedPushEnabled) {
      setPushEnabled(savedPushEnabled === 'true');
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

  return (
    <div className="h-[calc(100vh-100px)] overflow-y-auto space-y-6 pr-2">
      <div className="max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/app')}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>

        <div className="mb-8">
          <h1 className="text-4xl font-bold">Configuración</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Gestiona tus preferencias de notificaciones
          </p>
        </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Bell className="h-6 w-6" />
                Notificaciones Push
              </CardTitle>
              <CardDescription className="text-base">
                Recibe notificaciones en tiempo real sobre tu proyecto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <Label htmlFor="push-toggle-desktop" className="text-base font-medium">
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
                  id="push-toggle-desktop"
                  checked={pushEnabled}
                  onCheckedChange={handleTogglePush}
                  disabled={notificationPermission === 'denied'}
                />
              </div>

              {notificationPermission === 'denied' && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-lg">
                  <p className="font-medium">Notificaciones bloqueadas</p>
                  <p className="mt-2 text-sm">
                    Para activar las notificaciones, ve a la configuración de tu navegador y permite las notificaciones para este sitio.
                  </p>
                </div>
              )}

              {pushEnabled && notificationPermission === 'granted' && (
                <>
                  <Separator />
                  
                  <div className="space-y-6">
                    <p className="font-medium">Tipos de notificaciones</p>
                    
                    <div className="grid gap-6">
                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-1">
                          <Label htmlFor="chat-notif-desktop" className="font-normal">
                            Mensajes del chat
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Nuevos mensajes de tu equipo de construcción
                          </p>
                        </div>
                        <Switch
                          id="chat-notif-desktop"
                          checked={preferences.chat}
                          onCheckedChange={() => handlePreferenceChange('chat')}
                        />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-1">
                          <Label htmlFor="calendar-notif-desktop" className="font-normal">
                            Citas y calendario
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Recordatorios de citas y eventos
                          </p>
                        </div>
                        <Switch
                          id="calendar-notif-desktop"
                          checked={preferences.calendar}
                          onCheckedChange={() => handlePreferenceChange('calendar')}
                        />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-1">
                          <Label htmlFor="documents-notif-desktop" className="font-normal">
                            Documentos
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Nuevos archivos y documentos agregados
                          </p>
                        </div>
                        <Switch
                          id="documents-notif-desktop"
                          checked={preferences.documents}
                          onCheckedChange={() => handlePreferenceChange('documents')}
                        />
                      </div>

                      <div className="flex items-center justify-between py-2">
                        <div className="space-y-1">
                          <Label htmlFor="photos-notif-desktop" className="font-normal">
                            Fotos de avance
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            Nuevas fotos del progreso de tu proyecto
                          </p>
                        </div>
                        <Switch
                          id="photos-notif-desktop"
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
            <div className="bg-primary/5 border border-primary/20 p-6 rounded-lg mt-6">
              <div className="flex gap-4">
                <Check className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Notificaciones configuradas</p>
                  <p className="text-muted-foreground mt-1">
                    Recibirás notificaciones push según tus preferencias seleccionadas
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
