import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  UserPlus, 
  Phone, 
  Mail, 
  StickyNote, 
  CalendarCheck, 
  ArrowRight,
  Pencil,
  Trash2,
  Filter,
  Loader2
} from "lucide-react";
import { useCrmActivities, ActivityType } from "@/hooks/crm/useCrmActivities";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface ActivityTimelineProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
}

type ActivityFilter = 'all' | 'call_made' | 'email_sent' | 'note_added' | 'meeting_held';

const ACTIVITY_CONFIG: Record<ActivityType, { 
  icon: React.ElementType; 
  color: string; 
  label: string;
  bgColor: string;
}> = {
  created: { 
    icon: UserPlus, 
    color: "text-blue-500", 
    label: "Creado",
    bgColor: "bg-blue-500/10"
  },
  call_made: { 
    icon: Phone, 
    color: "text-green-500", 
    label: "Llamada",
    bgColor: "bg-green-500/10"
  },
  email_sent: { 
    icon: Mail, 
    color: "text-purple-500", 
    label: "Email",
    bgColor: "bg-purple-500/10"
  },
  note_added: { 
    icon: StickyNote, 
    color: "text-yellow-500", 
    label: "Nota",
    bgColor: "bg-yellow-500/10"
  },
  meeting_held: { 
    icon: CalendarCheck, 
    color: "text-orange-500", 
    label: "Reunión",
    bgColor: "bg-orange-500/10"
  },
  status_changed: { 
    icon: ArrowRight, 
    color: "text-muted-foreground", 
    label: "Estado cambiado",
    bgColor: "bg-muted"
  },
  updated: { 
    icon: Pencil, 
    color: "text-muted-foreground", 
    label: "Actualizado",
    bgColor: "bg-muted"
  },
  deleted: { 
    icon: Trash2, 
    color: "text-destructive", 
    label: "Eliminado",
    bgColor: "bg-destructive/10"
  },
};

export function ActivityTimeline({ open, onOpenChange, leadId, leadName }: ActivityTimelineProps) {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const [limit, setLimit] = useState(20);

  const { data: activities, isLoading } = useCrmActivities('lead', leadId);

  // Fetch user profiles for performed_by
  const { data: profiles } = useQuery({
    queryKey: ['profiles-for-activities', activities?.map(a => a.performed_by)],
    queryFn: async () => {
      if (!activities?.length) return [];
      
      const userIds = [...new Set(activities.map(a => a.performed_by))];
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!activities?.length,
  });

  const getUserName = (userId: string) => {
    const profile = profiles?.find(p => p.id === userId);
    return profile?.full_name || profile?.email || 'Usuario desconocido';
  };

  // Filter activities
  const filteredActivities = activities?.filter(activity => {
    if (filter === 'all') return true;
    return activity.activity_type === filter;
  }) || [];

  // Apply limit for infinite scroll
  const displayedActivities = filteredActivities.slice(0, limit);
  const hasMore = filteredActivities.length > limit;

  const loadMore = () => {
    setLimit(prev => prev + 20);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl h-[90vh] md:h-auto md:max-h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-semibold">
            Timeline de Actividades
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {leadName}
          </p>
        </DialogHeader>

        {/* Filtros rápidos */}
        <div className="px-6 py-4 border-b bg-muted/30">
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Filtrar:</span>
            
            <Button
              size="sm"
              variant={filter === 'all' ? 'default' : 'outline'}
              onClick={() => setFilter('all')}
              className="h-8"
            >
              Todos
              <Badge variant="secondary" className="ml-2">
                {activities?.length || 0}
              </Badge>
            </Button>

            <Button
              size="sm"
              variant={filter === 'call_made' ? 'default' : 'outline'}
              onClick={() => setFilter('call_made')}
              className="h-8"
            >
              <Phone className="h-3.5 w-3.5 mr-1.5" />
              Llamadas
              <Badge variant="secondary" className="ml-2">
                {activities?.filter(a => a.activity_type === 'call_made').length || 0}
              </Badge>
            </Button>

            <Button
              size="sm"
              variant={filter === 'email_sent' ? 'default' : 'outline'}
              onClick={() => setFilter('email_sent')}
              className="h-8"
            >
              <Mail className="h-3.5 w-3.5 mr-1.5" />
              Emails
              <Badge variant="secondary" className="ml-2">
                {activities?.filter(a => a.activity_type === 'email_sent').length || 0}
              </Badge>
            </Button>

            <Button
              size="sm"
              variant={filter === 'note_added' ? 'default' : 'outline'}
              onClick={() => setFilter('note_added')}
              className="h-8"
            >
              <StickyNote className="h-3.5 w-3.5 mr-1.5" />
              Notas
              <Badge variant="secondary" className="ml-2">
                {activities?.filter(a => a.activity_type === 'note_added').length || 0}
              </Badge>
            </Button>

            <Button
              size="sm"
              variant={filter === 'meeting_held' ? 'default' : 'outline'}
              onClick={() => setFilter('meeting_held')}
              className="h-8"
            >
              <CalendarCheck className="h-3.5 w-3.5 mr-1.5" />
              Reuniones
              <Badge variant="secondary" className="ml-2">
                {activities?.filter(a => a.activity_type === 'meeting_held').length || 0}
              </Badge>
            </Button>
          </div>
        </div>

        {/* Timeline */}
        <ScrollArea className="flex-1 px-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : displayedActivities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <StickyNote className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Sin actividades</h3>
              <p className="text-sm text-muted-foreground max-w-sm">
                {filter === 'all' 
                  ? 'No hay actividades registradas para este lead.'
                  : 'No hay actividades del tipo seleccionado.'
                }
              </p>
            </div>
          ) : (
            <div className="py-6 space-y-6">
              {displayedActivities.map((activity, index) => {
                const config = ACTIVITY_CONFIG[activity.activity_type];
                const Icon = config.icon;

                return (
                  <div
                    key={activity.id}
                    className="relative pl-8 pb-6 last:pb-0 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Línea vertical */}
                    {index < displayedActivities.length - 1 && (
                      <div className="absolute left-3 top-10 bottom-0 w-px bg-border" />
                    )}

                    {/* Ícono */}
                    <div className={cn(
                      "absolute left-0 top-0 rounded-full p-2",
                      config.bgColor
                    )}>
                      <Icon className={cn("h-4 w-4", config.color)} />
                    </div>

                    {/* Contenido */}
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant="outline" className="font-medium">
                              {config.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(activity.created_at), {
                                addSuffix: true,
                                locale: es,
                              })}
                            </span>
                          </div>
                          <p className="text-sm mt-2 text-foreground">
                            {activity.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <UserPlus className="h-3.5 w-3.5" />
                        <span>{getUserName(activity.performed_by)}</span>
                      </div>

                      {/* Metadata JSON si existe */}
                      {activity.metadata_json && (
                        <div className="mt-2 p-3 rounded-md bg-muted/50 text-xs">
                          <pre className="text-muted-foreground overflow-x-auto">
                            {JSON.stringify(activity.metadata_json, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Botón cargar más */}
              {hasMore && (
                <div className="flex justify-center pt-4">
                  <Button
                    variant="outline"
                    onClick={loadMore}
                    className="animate-fade-in"
                  >
                    Cargar más actividades
                  </Button>
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
