import Logo from '@/components/Logo';
import { Bell, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useLocation } from 'react-router-dom';

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
  const location = useLocation();
  const currentLabel = routeLabels[location.pathname] || 'Inicio';

  return (
    <header className="bg-card/80 backdrop-blur-xl border-b border-border/50 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-6">
        <Logo size="large" />
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>Mi Proyecto</span>
          <span>/</span>
          <span className="text-foreground font-medium">{currentLabel}</span>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar..." 
            className="pl-10 bg-background/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center bg-primary text-primary-foreground text-[10px]">
            3
          </Badge>
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
