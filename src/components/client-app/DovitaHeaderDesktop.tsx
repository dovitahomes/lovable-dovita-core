import { useState } from 'react';
import Logo from '@/components/Logo';
import { Bell, Search, User, Menu, Settings, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { useLocation } from 'react-router-dom';
import ProjectSelector from './ProjectSelector';
import GlobalSearch from './GlobalSearch';
import { useProject } from '@/contexts/ProjectContext';

const routeLabels: Record<string, string> = {
  '/app': 'Inicio',
  '/app/photos': 'Fotos',
  '/app/financial': 'Financiero',
  '/app/chat': 'Chat',
  '/app/documents': 'Documentos',
  '/app/schedule': 'Cronograma',
  '/app/appointments': 'Citas',
};

export default function DovitaHeaderDesktop() {
  const { currentProject } = useProject();
  const location = useLocation();
  const currentLabel = routeLabels[location.pathname] || 'Inicio';
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="bg-primary text-white px-4 py-2 flex items-center justify-between sticky top-0 z-30 border-b border-primary/20">
      <div className="flex items-center gap-6">
        <Logo size="small" className="brightness-0 invert" />
        <div className="hidden lg:flex items-center gap-2 text-xs text-white/70">
          <ProjectSelector variant="desktop" />
          <span>/</span>
          <span className="text-white font-medium">{currentLabel}</span>
        </div>
        <div className="lg:hidden flex items-center gap-2 text-xs text-white/70">
          <span className="text-white font-medium">{currentLabel}</span>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-8 hidden md:block">
        <div className="relative cursor-pointer" onClick={() => setSearchOpen(true)}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50 pointer-events-none" />
          <Input 
            placeholder="Buscar..." 
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50 cursor-pointer"
            readOnly
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="md:hidden text-white hover:bg-white/10"
          onClick={() => setSearchOpen(true)}
        >
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-secondary text-primary text-[10px]">
            3
          </Badge>
        </Button>
        <Button variant="ghost" size="icon" className="hidden lg:flex text-white hover:bg-white/10">
          <User className="h-5 w-5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden text-white hover:bg-white/10"
          onClick={() => setMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Tablet Menu - same as mobile */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>Menú</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            <div>
              <p className="text-sm font-medium mb-2 text-muted-foreground">Proyecto Actual</p>
              <p className="text-base font-semibold">{currentProject?.name}</p>
              <ProjectSelector variant="mobile" />
            </div>

            <Separator />

            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start gap-3">
                <User className="h-4 w-4" />
                Mi Perfil
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3">
                <Settings className="h-4 w-4" />
                Configuración
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive">
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </header>
  );
}
