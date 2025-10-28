import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ClientCardProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  rightMetric?: React.ReactNode;
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function ClientCard({
  title,
  subtitle,
  icon: Icon,
  rightMetric,
  children,
  onClick,
  className,
}: ClientCardProps) {
  return (
    <Card
      className={cn(
        "border-slate-200 shadow-sm rounded-2xl overflow-hidden",
        onClick && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3 flex-1">
            {Icon && (
              <div className="rounded-xl bg-blue-50 p-2.5">
                <Icon className="h-5 w-5 text-[hsl(var(--dovita-blue))]" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
          {rightMetric && (
            <div className="text-right ml-2 text-lg font-bold text-[hsl(var(--dovita-blue))]">
              {rightMetric}
            </div>
          )}
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
