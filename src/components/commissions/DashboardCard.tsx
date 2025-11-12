import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  gradient: string;
  onClick: () => void;
}

export function DashboardCard({
  title,
  description,
  icon: Icon,
  gradient,
  onClick,
}: DashboardCardProps) {
  return (
    <Card
      className={cn(
        "cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg",
        "border-border/50 overflow-hidden relative group"
      )}
      onClick={onClick}
    >
      {/* Gradient background */}
      <div className={cn("absolute inset-0 opacity-10", gradient)} />
      
      <CardContent className="p-6 relative">
        <div className="flex items-start gap-4">
          {/* Icon container */}
          <div
            className={cn(
              "flex items-center justify-center w-14 h-14 rounded-xl",
              "bg-gradient-to-br shadow-sm transition-transform group-hover:scale-110",
              gradient
            )}
          >
            <Icon className="h-7 w-7 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1 space-y-1">
            <h3 className="text-xl font-semibold text-foreground">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {description}
            </p>
          </div>

          {/* Arrow indicator */}
          <div className="text-muted-foreground group-hover:text-foreground transition-colors">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="transition-transform group-hover:translate-x-1"
            >
              <path
                d="M7.5 15L12.5 10L7.5 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
