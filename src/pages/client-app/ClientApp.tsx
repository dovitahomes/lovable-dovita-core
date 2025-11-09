import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { InteractiveMenu } from "@/components/ui/modern-mobile-menu";
import DovitaHeader from "@/components/client-app/DovitaHeader";
import { Home, Image, DollarSign, MessageCircle, FolderOpen, CalendarDays, Calendar } from "lucide-react";
import { CLIENT_APP_ROUTES } from "@/config/routes";

const menuItems = [
  { label: "Inicio", icon: Home, path: CLIENT_APP_ROUTES.BASE },
  { label: "Fotos", icon: Image, path: CLIENT_APP_ROUTES.PHOTOS },
  { label: "Financiero", icon: DollarSign, path: CLIENT_APP_ROUTES.FINANCIAL },
  { label: "Chat", icon: MessageCircle, path: CLIENT_APP_ROUTES.CHAT },
  { label: "Documentos", icon: FolderOpen, path: CLIENT_APP_ROUTES.DOCUMENTS },
  { label: "Cronograma", icon: CalendarDays, path: CLIENT_APP_ROUTES.SCHEDULE },
  { label: "Citas", icon: Calendar, path: CLIENT_APP_ROUTES.APPOINTMENTS },
];

export default function ClientApp() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeIndex = menuItems.findIndex(
    (item) => location.pathname === item.path || 
    (item.path === "/client" && (location.pathname === "/client" || location.pathname === "/client/dashboard"))
  );

  const handleMenuClick = (index: number) => {
    navigate(menuItems[index].path);
  };

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-background">
      <DovitaHeader />

      <main 
        id="main-content" 
        className="flex-1 overflow-y-auto overflow-x-hidden mt-[calc(68px+env(safe-area-inset-top))]"
        role="main"
        tabIndex={-1}
      >
        <Outlet />
      </main>

      <footer 
        className="fixed bottom-0 left-0 right-0 z-50 bg-card pb-[env(safe-area-inset-bottom)]"
        role="navigation"
        aria-label="Navegación principal"
      >
        <InteractiveMenu
          items={menuItems.map((item) => ({ 
            label: item.label, 
            icon: item.icon
          }))}
          accentColor="hsl(var(--primary))"
          activeIndex={activeIndex >= 0 ? activeIndex : 0}
          onItemClick={handleMenuClick}
        />
      </footer>
    </div>
  );
}
