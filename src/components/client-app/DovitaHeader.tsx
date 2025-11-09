import { useState } from 'react';
import { Menu, Bell, X, Settings, LogOut, User, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import logo from '@/assets/logo-dovita.png';
import ProjectSelector from './ProjectSelector';
import GlobalSearch from './GlobalSearch';
import NotificationPanel from './NotificationPanel';
import { useProject } from '@/contexts/client-app/ProjectContext';
import { useNotifications } from '@/contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';

export default function DovitaHeader() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { currentProject, hasMultipleProjects } = useProject();
  const { unreadCount } = useNotifications();

  return (
    <>
      <a href="#main-content" className="skip-to-main focus-ring">
        Saltar al contenido principal
      </a>
      <header 
        className="bg-primary text-white fixed top-0 left-0 right-0 z-50 flex-shrink-0 border-b border-primary/20 pt-[env(safe-area-inset-top)]"
        role="banner"
      >
        <div className="h-[68px] px-6 flex items-center justify-between">
          <img 
            src={logo} 
            alt="Dovita - Portal del Cliente" 
            className="h-9 w-auto object-contain brightness-0 invert"
          />
          
          <nav aria-label="Acciones principales" className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:text-[hsl(var(--dovita-yellow))] hover:bg-transparent focus-ring"
              onClick={() => setSearchOpen(true)}
              aria-label="Abrir búsqueda global"
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:text-[hsl(var(--dovita-yellow))] hover:bg-transparent relative focus-ring"
              onClick={() => setNotificationsOpen(true)}
              aria-label={unreadCount > 0 ? `Notificaciones (${unreadCount} sin leer)` : "Notificaciones"}
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge 
                  className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-[hsl(var(--dovita-yellow))] text-primary text-[10px]"
                  aria-label={`${unreadCount} notificaciones sin leer`}
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-white hover:text-[hsl(var(--dovita-yellow))] hover:bg-transparent focus-ring"
              onClick={() => setMenuOpen(true)}
              aria-label="Abrir menú principal"
              aria-expanded={menuOpen}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </nav>
        </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[400px]" aria-describedby="menu-description">
          <SheetHeader>
            <SheetTitle>Menú Principal</SheetTitle>
            <p id="menu-description" className="sr-only">
              Opciones de navegación y configuración de la aplicación
            </p>
          </SheetHeader>
          
          <nav aria-label="Menú de usuario" className="mt-6 space-y-6">
            <div>
              <p className="text-sm font-medium mb-4 text-muted-foreground" id="current-project-label">
                Proyecto Actual
              </p>
              <div aria-labelledby="current-project-label">
                <ProjectSelector variant="mobile" />
              </div>
            </div>

            <Separator aria-hidden="true" />

            <div className="space-y-2" role="menu" aria-label="Opciones de usuario">
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 focus-ring"
                role="menuitem"
                aria-label="Ver mi perfil"
              >
                <User className="h-4 w-4" aria-hidden="true" />
                Mi Perfil
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 focus-ring"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/settings');
                }}
                role="menuitem"
                aria-label="Ir a configuración"
              >
                <Settings className="h-4 w-4" aria-hidden="true" />
                Configuración
              </Button>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-destructive hover:text-destructive focus-ring"
                role="menuitem"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Cerrar Sesión
              </Button>
            </div>
          </nav>
        </SheetContent>
      </Sheet>

        {/* Global Search Dialog */}
        <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        
        {/* Notifications Panel */}
        <NotificationPanel open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      </header>
    </>
  );
}
