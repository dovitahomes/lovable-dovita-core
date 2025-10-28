import { Home, DollarSign, Image, Calendar, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClientTabBarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ClientTabBar({ activeTab, onTabChange }: ClientTabBarProps) {
  const tabs = [
    { id: "resumen", label: "Inicio", icon: Home },
    { id: "finanzas", label: "Finanzas", icon: DollarSign },
    { id: "fotos", label: "Avances", icon: Image },
    { id: "calendario", label: "Citas", icon: Calendar },
    { id: "chat", label: "Chat", icon: MessageSquare },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t">
      <nav className="flex justify-around items-center h-16" aria-label="Navegación del portal">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label={tab.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
