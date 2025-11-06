import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { InteractiveMenu } from "@/components/ui/modern-mobile-menu";
import DovitaHeader from "@/components/client-app/DovitaHeader";
import { Home, Image, DollarSign, MessageCircle, FolderOpen, CalendarDays, Calendar } from "lucide-react";

const menuItems = [
  { label: "Inicio", icon: Home, path: "/" },
  { label: "Fotos", icon: Image, path: "/photos" },
  { label: "Financiero", icon: DollarSign, path: "/financial" },
  { label: "Chat", icon: MessageCircle, path: "/chat" },
  { label: "Documentos", icon: FolderOpen, path: "/documents" },
  { label: "Cronograma", icon: CalendarDays, path: "/schedule" },
  { label: "Citas", icon: Calendar, path: "/appointments" },
];

export default function ClientApp() {
  const location = useLocation();
  const navigate = useNavigate();

  const activeIndex = menuItems.findIndex(
    (item) => location.pathname === item.path || (item.path === "/" && (location.pathname === "/" || location.pathname === "")),
  );

  const handleMenuClick = (index: number) => {
    navigate(menuItems[index].path);
  };

  // Check if preview mode is active for layout adjustment
  const isPreviewMode = localStorage.getItem("clientapp.previewMode") === "true" || 
                        new URLSearchParams(window.location.search).has("preview");
  const previewBarHeight = isPreviewMode ? 48 : 0;

  return (
    <div className="min-h-screen flex flex-col bg-background" style={{ paddingTop: `${previewBarHeight}px` }}>
      <DovitaHeader />

      <main className="h-[calc(100vh-68px-env(safe-area-inset-top)-65px-env(safe-area-inset-bottom))] overflow-hidden mt-[calc(68px+env(safe-area-inset-top))]">
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
