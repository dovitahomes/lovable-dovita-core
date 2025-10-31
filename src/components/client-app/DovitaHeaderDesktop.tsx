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
    <header className="bg-primary text-white px-4 py-2 flex items-center justify-between sticky top-0 z-30 border-b border-primary/20">
      <div className="flex items-center gap-6">
        <Logo size="small" className="brightness-0 invert" />
        <div className="flex items-center gap-2 text-xs text-white/70">
          <span>Mi Proyecto</span>
          <span>/</span>
          <span className="text-white font-medium">{currentLabel}</span>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-8">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/50" />
          <Input 
            placeholder="Buscar..." 
            className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/10">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center bg-secondary text-primary text-[10px]">
            3
          </Badge>
        </Button>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}
