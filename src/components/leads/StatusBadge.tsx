import { Badge } from "@/components/ui/badge";
import { LeadStatus } from "@/hooks/useLeads";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: LeadStatus;
  className?: string;
}

const STATUS_CONFIG: Record<LeadStatus, { 
  label: string; 
  className: string; 
  dotColor: string;
}> = {
  nuevo: { 
    label: 'Nuevo', 
    className: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    dotColor: 'bg-blue-500'
  },
  contactado: { 
    label: 'Contactado', 
    className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20',
    dotColor: 'bg-yellow-500'
  },
  calificado: { 
    label: 'Calificado', 
    className: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20',
    dotColor: 'bg-purple-500'
  },
  convertido: { 
    label: 'Convertido', 
    className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    dotColor: 'bg-green-500'
  },
  perdido: { 
    label: 'Perdido', 
    className: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
    dotColor: 'bg-red-500'
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];
  
  return (
    <Badge 
      variant="outline" 
      className={cn(config.className, "font-medium", className)}
    >
      <div className={cn("h-2 w-2 rounded-full mr-1.5", config.dotColor)} />
      {config.label}
    </Badge>
  );
}
