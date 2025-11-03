import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { InteractiveMenu } from "@/components/ui/modern-mobile-menu";
import DovitaHeader from "@/components/client-app/DovitaHeader";
import { Home, Image, DollarSign, MessageCircle, FolderOpen, CalendarDays, Calendar } from "lucide-react";

const menuItems = [
  { label: "Inicio", icon: Home, path: "/app" },
  { label: "Fotos", icon: Image, path: "/app/photos" },
  { label: "Financiero", icon: DollarSign, path: "/app/financial" },
  { label: "Chat", icon: MessageCircle, path: "/app/chat" },
  { label: "Documentos", icon: FolderOpen, path: "/app/documents" },
  { label: "Cronograma", icon: CalendarDays, path: "/app/schedule" },
  { label: "Citas", icon: Calendar, path: "/app/appointments" },
];

export default function ClientApp() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeIndex = menuItems.findIndex(
    (item) => location.pathname === item.path || (item.path === "/app" && location.pathname === "/app/"),
  );

  const handleMenuClick = (index: number) => {
    navigate(menuItems[index].path);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DovitaHeader />

      <main className="h-[calc(100vh-80px-65px-env(safe-area-inset-top)-env(safe-area-inset-bottom))] overflow-hidden">
        <Outlet />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50">
        <InteractiveMenu
          items={menuItems.map((item) => ({ label: item.label, icon: item.icon }))}
          accentColor="hsl(var(--primary))"
          activeIndex={activeIndex >= 0 ? activeIndex : 0}
          onItemClick={handleMenuClick}
        />
      </footer>
    </div>
  );
}
