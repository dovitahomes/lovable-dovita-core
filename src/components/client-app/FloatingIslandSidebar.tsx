import { useNavigate, useLocation } from "react-router-dom";
import { Home, Image, DollarSign, MessageCircle, FolderOpen, CalendarDays, Calendar } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

const menuItems = [
  { label: "Inicio", icon: Home, path: "/app" },
  { label: "Fotos", icon: Image, path: "/app/photos" },
  { label: "Financiero", icon: DollarSign, path: "/app/financial" },
  { label: "Chat", icon: MessageCircle, path: "/app/chat" },
  { label: "Documentos", icon: FolderOpen, path: "/app/documents" },
  { label: "Cronograma", icon: CalendarDays, path: "/app/schedule" },
  { label: "Citas", icon: Calendar, path: "/app/appointments" },
];

export default function FloatingIslandSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/app") {
      return location.pathname === "/app" || location.pathname === "/app/";
    }
    return location.pathname === path;
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside className="hidden md:flex fixed left-4 top-20 w-16 bg-card/80 backdrop-blur-xl rounded-full shadow-2xl border border-border/50 flex-col items-center py-3 gap-1 z-40 transition-all duration-300">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Tooltip key={item.path}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => navigate(item.path)}
                  className={`
                    relative w-12 h-12 rounded-full 
                    flex items-center justify-center
                    transition-all duration-200
                    ${active 
                      ? 'bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.5)]' 
                      : 'hover:bg-primary/10 hover:scale-110'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
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
