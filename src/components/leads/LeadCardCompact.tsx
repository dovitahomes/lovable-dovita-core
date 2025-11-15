import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Phone, Mail, Clock, Eye, AlertCircle, GripVertical } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useCrmActivities } from "@/hooks/crm/useCrmActivities";
import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { useEmailAvailability } from "@/hooks/useEmailAvailability";
import { EmailComposerDialog } from "@/components/crm/EmailComposerDialog";

interface LeadCardCompactProps {
  lead: any;
  onOpenDetails: (leadId: string) => void;
  isDragging?: boolean;
  dragHandleProps?: any;
}

export function LeadCardCompact({ lead, onOpenDetails, isDragging, dragHandleProps }: LeadCardCompactProps) {
  const { data: activities } = useCrmActivities('lead', lead.id);
  const [emailOpen, setEmailOpen] = useState(false);
  const { hasEmailConfigured } = useEmailAvailability();

  // Calculate days since last contact
  const daysSinceContact = useMemo(() => {
    if (!activities || activities.length === 0) return null;
    const lastActivity = activities[0];
    const daysDiff = Math.floor(
      (new Date().getTime() - new Date(lastActivity.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff;
  }, [activities]);

  // Get urgency badge
  const urgencyBadge = useMemo(() => {
    if (daysSinceContact === null) return null;
    if (daysSinceContact >= 7) {
      return { label: 'URGENTE', color: 'bg-red-500 text-white', animate: true };
    }
    if (daysSinceContact >= 3) {
      return { label: 'SEGUIR', color: 'bg-yellow-500 text-white', animate: false };
    }
    return { label: 'ACTIVO', color: 'bg-green-500 text-white', animate: false };
  }, [daysSinceContact]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lead.telefono) {
      window.location.href = `tel:${lead.telefono}`;
    }
  };

  const handleEmail = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEmailOpen(true);
  };

  return (
    <>
      <EmailComposerDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        leadId={lead.id}
        leadName={lead.nombre_completo}
        leadEmail={lead.email || ""}
      />
      
      <Card
      className={cn(
        "hover:shadow-lg transition-all cursor-pointer group relative",
        isDragging && "opacity-50"
      )}
      onClick={() => onOpenDetails(lead.id)}
    >
      <CardContent className="p-2.5 space-y-1.5">
        {/* Drag Handle (solo visible en desktop Kanban) */}
        {dragHandleProps && (
          <div
            {...dragHandleProps}
            className="absolute top-1 left-1 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
        
        {/* Header: Avatar + Nombre + Urgencia */}
        <div className="flex items-center gap-2">
          <Avatar className={cn("h-6 w-6 shrink-0", dragHandleProps && "ml-5")}>
            <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
              {getInitials(lead.nombre_completo)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{lead.nombre_completo}</p>
          </div>
          {urgencyBadge && (
            <Badge className={cn(
              "h-4 px-1.5 text-[9px] border-0",
              urgencyBadge.color,
              urgencyBadge.animate && "animate-pulse"
            )}>
              {urgencyBadge.label}
            </Badge>
          )}
        </div>

        {/* Teléfono */}
        {lead.telefono && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Phone className="h-3 w-3" />
            <span className="truncate">{lead.telefono}</span>
          </div>
        )}

        {/* Último Contacto */}
        {activities && activities.length > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            <span>
              Hace {formatDistanceToNow(new Date(activities[0].created_at), { 
                addSuffix: false,
                locale: es 
              })}
            </span>
          </div>
        )}

        {/* Quick Actions (solo iconos, aparecen al hover) */}
        <div className="flex items-center gap-1 pt-1 border-t opacity-0 group-hover:opacity-100 transition-opacity">
          {lead.telefono && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6" 
              onClick={handleCall}
            >
              <Phone className="h-3 w-3" />
            </Button>
          )}
          {hasEmailConfigured && lead.email && (
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-6 w-6" 
              onClick={handleEmail}
            >
              <Mail className="h-3 w-3" />
            </Button>
          )}
          <Button 
            size="icon" 
            variant="ghost" 
            className="h-6 w-6 ml-auto" 
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(lead.id);
            }}
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
    </>
  );
}
