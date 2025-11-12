import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  gradient?: string;
  badge?: {
    text: string;
    color: string;
  };
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  gradient = "from-primary/10 to-secondary/10",
  badge,
  className,
}: StatsCardProps) {
  return (
    <Card
      className={cn(
        "group hover:scale-[1.02] transition-all duration-200 hover:shadow-md animate-fade-in",
        `bg-gradient-to-br ${gradient}`,
        className
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground mb-2">{title}</p>
            <p className="text-2xl md:text-3xl font-bold text-foreground">
              {value}
            </p>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className="p-2 rounded-lg bg-background/50">
              <Icon className="h-5 w-5 text-primary" />
            </div>
            {badge && (
              <Badge 
                className={cn(
                  "text-xs font-semibold",
                  badge.color
                )}
              >
                {badge.text}
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
