import { Home, Image, Calendar, Folder } from "lucide-react";
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
  { label: "Inicio", to: "/portal", icon: Home },
  { label: "Avances", to: "/portal/avances", icon: Image },
  { label: "Calendario", to: "/portal/calendario", icon: Calendar },
  { label: "Documentos", to: "/portal/documentos", icon: Folder },
];

export function ClientBottomNav({ items = defaultItems }: ClientBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 md:hidden"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0px)" }}
    >
      <div className="max-w-md mx-auto grid grid-cols-4 h-16 px-2">
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
