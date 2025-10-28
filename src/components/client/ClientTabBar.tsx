import { Home, FileText, PenTool, Image, Calendar, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ClientTabBar({ activeTab, onTabChange }: ClientTabBarProps) {
  const tabs = [
    { id: "overview", label: "Inicio", icon: Home },
    { id: "documentos", label: "Docs", icon: FileText },
    { id: "diseno", label: "Diseño", icon: PenTool },
    { id: "obra", label: "Obra", icon: Image },
    { id: "calendario", label: "Citas", icon: Calendar },
    { id: "chat", label: "Chat", icon: MessageSquare },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 safe-area-bottom"
      aria-label="Navegación del portal"
    >
      <div className="max-w-md mx-auto grid grid-cols-6 h-16 px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 transition-colors rounded-lg",
                isActive
                  ? "text-[hsl(var(--dovita-blue))]"
                  : "text-slate-400 hover:text-slate-600"
              )}
              aria-label={tab.label}
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
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
