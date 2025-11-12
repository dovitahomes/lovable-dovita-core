import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatItem {
  label: string;
  value: string | number;
}

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  stats: StatItem[];
  onClick: () => void;
  disabled?: boolean;
}

export function DashboardCard({
  title,
  description,
  icon: Icon,
  gradient,
  stats,
  onClick,
  disabled = false,
}: DashboardCardProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all duration-300 cursor-pointer",
        "hover:scale-[1.02] hover:shadow-xl",
        disabled && "opacity-50 cursor-not-allowed"
      )}
      onClick={disabled ? undefined : onClick}
    >
      {/* Gradient background */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-5 group-hover:opacity-10 transition-opacity",
          gradient
        )}
      />

      <div className="relative p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-1">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
          <div
            className={cn(
              "p-3 rounded-xl bg-gradient-to-br group-hover:scale-110 transition-transform",
              gradient
            )}
          >
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/50">
          {stats.map((stat, idx) => (
            <div key={idx} className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                {stat.label}
              </p>
              <Badge variant="secondary" className="font-bold text-base">
                {stat.value}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
