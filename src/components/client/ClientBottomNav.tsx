import { Home, Calendar, Folder, MessageSquare, CreditCard } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  to: string;
  icon: typeof Home;
}

interface ClientBottomNavProps {
  items?: NavItem[];
}

const defaultItems: NavItem[] = [
  { label: "Inicio", to: "/client/home", icon: Home },
  { label: "Calendario", to: "/client/calendario", icon: Calendar },
  { label: "Docs", to: "/client/docs", icon: Folder },
  { label: "Chat", to: "/client/chat", icon: MessageSquare },
  { label: "Pagos", to: "/client/pagos", icon: CreditCard },
];

export function ClientBottomNav({ items = defaultItems }: ClientBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
      aria-label="Navegación principal del portal cliente"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 h-16 px-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;

          return (
            <button
              key={item.to}
              onClick={() => navigate(item.to)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors rounded-lg relative",
                isActive
                  ? "text-[#0B5ED7]"
                  : "text-slate-400 hover:text-slate-600"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={cn(
                  "transition-all",
                  isActive ? "h-5 w-5" : "h-5 w-5"
                )}
                strokeWidth={isActive ? 2.5 : 2}
                aria-hidden="true"
              />
              <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>
                {item.label}
              </span>
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#FFCC00] rounded-full"
                  aria-hidden="true"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
