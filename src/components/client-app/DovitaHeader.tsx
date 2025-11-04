import { useState } from 'react';
import { Menu, Bell, X, Settings, LogOut, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import logo from '@/assets/logo-dovita.png';
import ProjectSelector from './ProjectSelector';

export default function DovitaHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-primary text-white fixed top-0 left-0 right-0 z-50 flex-shrink-0 border-b border-primary/20 pt-[env(safe-area-inset-top)]">
      <div className="h-[68px] px-6 flex items-center justify-between">
        <img 
          src={logo} 
          alt="Dovita" 
          className="h-8 w-auto object-contain brightness-0 invert"
        />
        
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 relative">
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-secondary text-primary text-[10px]">
              3
            </Badge>
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white hover:bg-white/10"
            onClick={() => setMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="w-[300px] sm:w-[400px]">
          <SheetHeader>
            <SheetTitle>Menú</SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            <div>
              <p className="text-sm font-medium mb-2 text-muted-foreground">Proyecto Actual</p>
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
    </header>
  );
}
