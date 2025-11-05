import { Outlet } from "react-router-dom";
import { ModernMobileMenu } from "@/components/ui/modern-mobile-menu";
import DovitaHeader from "@/components/client-app/DovitaHeader";
import { Home, Image, DollarSign, MessageCircle, FolderOpen, CalendarDays, Calendar } from "lucide-react";

const menuItems = [
  { label: "Inicio", icon: Home, href: "/app" },
  { label: "Fotos", icon: Image, href: "/app/photos" },
  { label: "Financiero", icon: DollarSign, href: "/app/financial" },
  { label: "Chat", icon: MessageCircle, href: "/app/chat" },
  { label: "Documentos", icon: FolderOpen, href: "/app/documents" },
  { label: "Cronograma", icon: CalendarDays, href: "/app/schedule" },
  { label: "Citas", icon: Calendar, href: "/app/appointments" },
];

export default function ClientApp() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DovitaHeader />

      <main className="h-[calc(100vh-68px-env(safe-area-inset-top)-65px-env(safe-area-inset-bottom))] overflow-hidden mt-[calc(68px+env(safe-area-inset-top))]">
        <Outlet />
      </main>

      <footer className="fixed bottom-0 left-0 right-0 z-50">
        <ModernMobileMenu
          items={menuItems}
          accentColor="hsl(var(--primary))"
        />
      </footer>
    </div>
  );
}
