import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useNotifications } from '@/contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Calendar, FileText, Image, CheckCheck, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface NotificationPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const notificationIcons = {
  chat: MessageSquare,
  calendar: Calendar,
  document: FileText,
  photo: Image
};

const notificationColors = {
  chat: 'text-blue-500',
  calendar: 'text-green-500',
  document: 'text-purple-500',
  photo: 'text-orange-500'
};

export default function NotificationPanel({ open, onOpenChange }: NotificationPanelProps) {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-[85vw] sm:w-[400px] md:w-[500px] p-0"
        aria-describedby="notifications-description"
      >
        <SheetHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              Notificaciones
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2" aria-label={`${unreadCount} sin leer`}>
                  {unreadCount}
                </Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs focus-ring"
                aria-label="Marcar todas las notificaciones como leídas"
              >
                <CheckCheck className="h-4 w-4 mr-1" aria-hidden="true" />
                Marcar todas
              </Button>
            )}
          </div>
          <p id="notifications-description" className="sr-only">
            Panel de notificaciones. {unreadCount > 0 ? `Tienes ${unreadCount} notificaciones sin leer.` : 'No tienes notificaciones sin leer.'}
          </p>
        </SheetHeader>

        <Separator aria-hidden="true" />

        <ScrollArea className="h-[calc(100vh-120px)]">
          <div className="p-4 space-y-2" role="list" aria-label="Lista de notificaciones">
            {notifications.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground" role="status">
                <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" aria-hidden="true" />
                <p>No tienes notificaciones</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = notificationIcons[notification.type];
                const colorClass = notificationColors[notification.type];
                
                return (
                  <div
                    key={notification.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors hover:bg-accent focus-ring ${
                      !notification.read ? 'bg-primary/5 border-primary/20' : 'bg-background'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleNotificationClick(notification);
                      }
                    }}
                    role="listitem button"
                    tabIndex={0}
                    aria-label={`${notification.title}. ${notification.message}. ${!notification.read ? 'Sin leer' : 'Leída'}`}
                  >
                    <div className="flex gap-3">
                      <div className={`mt-1 ${colorClass}`} aria-hidden="true">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-medium text-sm">{notification.title}</h4>
                          {!notification.read && (
                            <div 
                              className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" 
                              aria-label="Sin leer"
                              role="status"
                            />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                          {notification.message}
                        </p>
                        <time className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(notification.timestamp), {
                            addSuffix: true,
                            locale: es
                          })}
                        </time>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
