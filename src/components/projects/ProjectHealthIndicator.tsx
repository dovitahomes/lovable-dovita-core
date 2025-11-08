import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle, AlertTriangle } from "lucide-react";
import type { ProjectHealth } from "@/lib/project-utils";

interface ProjectHealthIndicatorProps {
  status: ProjectHealth;
  details?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}

const healthConfig = {
  'on-time': {
    label: 'En tiempo',
    icon: CheckCircle,
    variant: 'default' as const,
    className: 'bg-green-500/10 text-green-700 border-green-500/20 dark:text-green-400',
  },
  'at-risk': {
    label: 'En riesgo',
    icon: AlertTriangle,
    variant: 'secondary' as const,
    className: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20 dark:text-yellow-400',
  },
  'delayed': {
    label: 'Retrasado',
    icon: AlertCircle,
    variant: 'destructive' as const,
    className: 'bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400',
  },
};

export function ProjectHealthIndicator({ 
  status, 
  details, 
  showLabel = true,
  size = "md" 
}: ProjectHealthIndicatorProps) {
  const config = healthConfig[status];
  const Icon = config.icon;

  const iconSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  if (!showLabel) {
    return (
      <div 
        className={cn(
          "inline-flex items-center justify-center rounded-full p-1.5",
          config.className
        )}
        title={details || config.label}
      >
        <Icon className={iconSizes[size]} />
      </div>
    );
  }

  return (
    <Badge 
      variant={config.variant}
      className={cn("flex items-center gap-1.5", config.className)}
      title={details}
    >
      <Icon className={iconSizes[size]} />
      {config.label}
    </Badge>
  );
}
