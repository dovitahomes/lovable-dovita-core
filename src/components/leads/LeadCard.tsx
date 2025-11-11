import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, Mail, Phone, MapPin, Eye, Clock, CalendarClock, AlertCircle, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { useCrmActivities } from "@/hooks/crm/useCrmActivities";
import { useTasks } from "@/hooks/crm/useTasks";
import { LeadQuickActions } from "./LeadQuickActions";
import { CreateFollowUpDialog } from "./CreateFollowUpDialog";
import { ActivityTimeline } from "./ActivityTimeline";
import { cn } from "@/lib/utils";

interface LeadCardProps {
  lead: any;
  onConvert: () => void;
  isDragging?: boolean;
}

export function LeadCard({ lead, onConvert, isDragging }: LeadCardProps) {
  const navigate = useNavigate();
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const canConvert = ['nuevo', 'contactado', 'calificado', 'propuesta', 'negociacion'].includes(lead.status);
  const isConverted = lead.status === 'convertido';
  const isWon = lead.status === 'ganado';
  
  // Fetch activities and tasks for this lead
  const { data: activities } = useCrmActivities('lead', lead.id);
  const { data: tasks } = useTasks('', undefined, undefined, 'lead', lead.id);

  // Calculate days since last contact
  const daysSinceContact = useMemo(() => {
    if (!activities || activities.length === 0) return null;
    const lastActivity = activities[0]; // Already ordered by created_at DESC
    const daysDiff = Math.floor(
      (new Date().getTime() - new Date(lastActivity.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff;
  }, [activities]);

  // Get urgency badge
  const urgencyBadge = useMemo(() => {
    if (daysSinceContact === null) return null;
    if (daysSinceContact >= 7) {
      return { label: 'URGENTE', color: 'bg-red-500', icon: AlertCircle, animate: true };
    }
    if (daysSinceContact >= 3) {
      return { label: 'SEGUIR', color: 'bg-yellow-500', icon: Clock, animate: false };
    }
    return { label: 'ACTIVO', color: 'bg-green-500', icon: Clock, animate: false };
  }, [daysSinceContact]);

  // Get next pending task
  const nextTask = useMemo(() => {
    if (!tasks || tasks.length === 0) return null;
    const pendingTasks = tasks.filter(t => t.status === 'pendiente');
    return pendingTasks[0] || null;
  }, [tasks]);

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };
  
  return (
    <>
      <Card 
        className={cn(
          "cursor-grab active:cursor-grabbing transition-all duration-200 hover:shadow-lg hover:-translate-y-1",
          isDragging && "opacity-50"
        )}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {getInitials(lead.nombre_completo)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base font-semibold truncate">
                  {lead.nombre_completo}
                </CardTitle>
                {urgencyBadge && (
                  <Badge 
                    className={cn(
                      "mt-1 text-[10px] text-white border-0",
                      urgencyBadge.color,
                      urgencyBadge.animate && "animate-pulse"
                    )}
                  >
                    <urgencyBadge.icon className="h-3 w-3 mr-1" />
                    {urgencyBadge.label}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-3">
          {/* Last Contact */}
          {activities && activities.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground border-l-2 border-primary/20 pl-2">
              <Clock className="h-3 w-3" />
              <span>
                Hace {formatDistanceToNow(new Date(activities[0].created_at), { 
                  addSuffix: false,
                  locale: es 
                })}
              </span>
            </div>
          )}

          {/* Next Task */}
          {nextTask && (
            <div className="flex items-center gap-2 text-xs text-primary border-l-2 border-primary pl-2">
              <CalendarClock className="h-3 w-3" />
              <span className="truncate font-medium">{nextTask.subject}</span>
            </div>
          )}

          {lead.telefono && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Phone className="h-3 w-3" />
              <span>{lead.telefono}</span>
            </div>
          )}
          
          {lead.email && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-3 w-3" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          
          {lead.sucursales?.nombre && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{lead.sucursales.nombre}</span>
            </div>
          )}
          
          {lead.origen_lead && lead.origen_lead.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {lead.origen_lead.slice(0, 3).map((origen: string, idx: number) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {origen}
                </Badge>
              ))}
              {lead.origen_lead.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{lead.origen_lead.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          {/* Opportunity Fields */}
          {lead.amount && (
            <div className="pt-2 border-t space-y-1">
              <Badge variant="secondary" className="font-mono text-xs">
                💰 {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(lead.amount)}
              </Badge>
              {lead.probability && <Badge variant="outline" className="ml-1 text-xs">{lead.probability}%</Badge>}
            </div>
          )}

          {lead.presupuesto_referencia && !lead.amount && (
            <div className="pt-2 border-t">
              <Badge variant="secondary" className="font-mono text-xs">
                {new Intl.NumberFormat('es-MX', { 
                  style: 'currency', 
                  currency: 'MXN',
                  maximumFractionDigits: 0
                }).format(lead.presupuesto_referencia)}
              </Badge>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2 border-t">
            <LeadQuickActions 
              leadId={lead.id}
              leadName={lead.nombre_completo}
              leadEmail={lead.email}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setFollowUpOpen(true);
              }}
              className="text-xs h-7 px-2 flex-1"
            >
              <CalendarClock className="h-3 w-3 mr-1" />
              Recordatorio
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                setTimelineOpen(true);
              }}
              className="text-xs h-7 px-2"
            >
              <History className="h-3 w-3" />
            </Button>
          </div>
          
          {canConvert && (
            <Button 
              size="sm" 
              className="w-full" 
              onClick={(e) => {
                e.stopPropagation();
                onConvert();
              }}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Convertir
            </Button>
          )}
          
          {isConverted && lead.client_id && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/clientes/${lead.client_id}`);
              }}
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Cliente
            </Button>
          )}
        </CardContent>
      </Card>

      <CreateFollowUpDialog
        open={followUpOpen}
        onOpenChange={setFollowUpOpen}
        leadId={lead.id}
        leadName={lead.nombre_completo}
      />

      <ActivityTimeline
        open={timelineOpen}
        onOpenChange={setTimelineOpen}
        leadId={lead.id}
        leadName={lead.nombre_completo}
      />
    </>
  );
}
