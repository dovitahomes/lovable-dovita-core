import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { InteractiveMenu } from "@/components/ui/modern-mobile-menu";
import DovitaHeader from "@/components/client-app/DovitaHeader";
import { Home, Image, DollarSign, MessageCircle, FolderOpen, CalendarDays, Calendar } from "lucide-react";

const menuItems = [
  { label: "Inicio", icon: Home, path: "/client" },
  { label: "Fotos", icon: Image, path: "/client/photos" },
  { label: "Financiero", icon: DollarSign, path: "/client/financial" },
  { label: "Chat", icon: MessageCircle, path: "/client/chat" },
  { label: "Documentos", icon: FolderOpen, path: "/client/documents" },
  { label: "Cronograma", icon: CalendarDays, path: "/client/schedule" },
  { label: "Citas", icon: Calendar, path: "/client/appointments" },
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

      <main className="flex-1 overflow-y-auto overflow-x-hidden mt-[calc(68px+env(safe-area-inset-top))]">
        <Outlet />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50 bg-card pb-[env(safe-area-inset-bottom)]">
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
