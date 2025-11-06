import { useNavigate, useLocation } from "react-router-dom";
import { Home, Image, DollarSign, MessageCircle, FolderOpen, CalendarDays, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const menuItems = [
  { label: "Inicio", icon: Home, path: "/client" },
  { label: "Fotos", icon: Image, path: "/client/photos" },
  { label: "Financiero", icon: DollarSign, path: "/client/financial" },
  { label: "Chat", icon: MessageCircle, path: "/client/chat" },
  { label: "Documentos", icon: FolderOpen, path: "/client/documents" },
  { label: "Cronograma", icon: CalendarDays, path: "/client/schedule" },
  { label: "Citas", icon: Calendar, path: "/client/appointments" },
];

export default function FloatingIslandSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/client") {
      return location.pathname === "/client" || location.pathname === "/client/";
    }
    return location.pathname === path;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="hidden md:flex fixed left-[12px] top-1/2 -translate-y-1/2 w-14 bg-card/80 backdrop-blur-xl rounded-full shadow-2xl border border-border/50 flex-col items-center py-3 gap-1 z-40 transition-all duration-300">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate(item.path)}
                  className={`
                    relative w-10 h-12 rounded-full 
                    flex items-center justify-center
                    transition-all duration-200
                    ${active 
                      ? 'bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)]' 
                      : 'hover:bg-primary/10 hover:scale-110'
                    }
                  `}
                >
                  <Icon className="w-4 h-5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right" className="ml-2">
                {item.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </aside>
    </TooltipProvider>
  );
}
