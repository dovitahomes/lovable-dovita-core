import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { InteractiveMenu } from '@/components/ui/modern-mobile-menu';
import DovitaHeader from '@/components/client-app/DovitaHeader';
import MobileFrame from '@/components/client-app/MobileFrame';
import { Home, Image, DollarSign, MessageCircle, FolderOpen, CalendarDays, Calendar } from 'lucide-react';

const menuItems = [
  { label: 'Inicio', icon: Home, path: '/app' },
  { label: 'Fotos', icon: Image, path: '/app/photos' },
  { label: 'Financiero', icon: DollarSign, path: '/app/financial' },
  { label: 'Chat', icon: MessageCircle, path: '/app/chat' },
  { label: 'Documentos', icon: FolderOpen, path: '/app/documents' },
  { label: 'Cronograma', icon: CalendarDays, path: '/app/schedule' },
  { label: 'Citas', icon: Calendar, path: '/app/appointments' },
];

export default function ClientApp() {
  const location = useLocation();
  const navigate = useNavigate();
  
  const activeIndex = menuItems.findIndex(item => 
    location.pathname === item.path || 
    (item.path === '/app' && location.pathname === '/app/')
  );
  
  const handleMenuClick = (index: number) => {
    navigate(menuItems[index].path);
  };

  return (
    <MobileFrame>
      <div className="min-h-screen flex flex-col bg-background">
        <DovitaHeader />
        
        <main className="flex-1 overflow-y-auto pb-24">
          <Outlet />
        </main>
        
        <InteractiveMenu 
          items={menuItems.map(item => ({ label: item.label, icon: item.icon }))}
          accentColor="hsl(var(--primary))"
          activeIndex={activeIndex >= 0 ? activeIndex : 0}
          onItemClick={handleMenuClick}
        />
      </div>
    </MobileFrame>
  );
}
