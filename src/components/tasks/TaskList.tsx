import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarClock, AlertCircle, Briefcase, User2, Building2 } from "lucide-react";
import { format, isToday, isThisWeek, isPast, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useUpdateTask } from "@/hooks/crm/useTasks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Task } from "@/hooks/crm/useTasks";

interface TaskListProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
}

type TaskGroup = 'overdue' | 'today' | 'thisWeek' | 'upcoming';

const PRIORITY_CONFIG = {
  baja: { label: 'Baja', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  media: { label: 'Media', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
  alta: { label: 'Alta', color: 'bg-red-500/10 text-red-700 dark:text-red-400' },
};

const GROUP_CONFIG: Record<TaskGroup, { label: string; color: string; icon: React.ElementType }> = {
  overdue: { label: 'Vencidas', color: 'text-red-500', icon: AlertCircle },
  today: { label: 'Hoy', color: 'text-yellow-500', icon: CalendarClock },
  thisWeek: { label: 'Esta semana', color: 'text-green-500', icon: CalendarClock },
  upcoming: { label: 'Próximas', color: 'text-muted-foreground', icon: CalendarClock },
};

export function TaskList({ tasks, selectedTaskId, onSelectTask }: TaskListProps) {
  const updateTask = useUpdateTask();

  // Fetch related entity names
  const { data: leads } = useQuery({
    queryKey: ['leads-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('leads').select('id, nombre_completo');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: opportunities } = useQuery({
    queryKey: ['opportunities-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('opportunities').select('id, name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects-for-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase.from('projects').select('id, project_name');
      if (error) throw error;
      return data || [];
    },
  });

  const getRelatedEntityName = (task: Task) => {
    if (!task.related_to_id || !task.related_to_type) return null;
    
    if (task.related_to_type === 'lead') {
      return leads?.find(l => l.id === task.related_to_id)?.nombre_completo;
    } else if (task.related_to_type === 'opportunity') {
      return opportunities?.find(o => o.id === task.related_to_id)?.name;
    } else if (task.related_to_type === 'project') {
      return projects?.find(p => p.id === task.related_to_id)?.project_name;
    }
    return null;
  };

  const getRelatedEntityIcon = (type?: string) => {
    if (type === 'lead') return User2;
    if (type === 'opportunity') return Briefcase;
    if (type === 'project') return Building2;
    return null;
  };

  // Group tasks by due date
  const groupedTasks = useMemo(() => {
    const groups: Record<TaskGroup, Task[]> = {
      overdue: [],
      today: [],
      thisWeek: [],
      upcoming: [],
    };

    tasks
      .filter(t => t.status !== 'completada' && t.status !== 'cancelada')
      .forEach(task => {
        if (!task.due_date) {
          groups.upcoming.push(task);
          return;
        }

        const dueDate = parseISO(task.due_date);
        
        if (isPast(dueDate) && !isToday(dueDate)) {
          groups.overdue.push(task);
        } else if (isToday(dueDate)) {
          groups.today.push(task);
        } else if (isThisWeek(dueDate)) {
          groups.thisWeek.push(task);
        } else {
          groups.upcoming.push(task);
        }
      });

    return groups;
  }, [tasks]);

  const handleComplete = async (task: Task, completed: boolean) => {
    await updateTask.mutateAsync({
      id: task.id,
      status: completed ? 'completada' : 'pendiente',
    });
  };

  const renderTask = (task: Task) => {
    const isCompleted = task.status === 'completada';
    const relatedName = getRelatedEntityName(task);
    const RelatedIcon = getRelatedEntityIcon(task.related_to_type);

    return (
      <Card
        key={task.id}
        className={cn(
          "p-4 cursor-pointer transition-all hover:shadow-md animate-fade-in",
          selectedTaskId === task.id && "ring-2 ring-primary",
          isCompleted && "opacity-60"
        )}
        onClick={() => onSelectTask(task.id)}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={(checked) => handleComplete(task, !!checked)}
            onClick={(e) => e.stopPropagation()}
            className="mt-1"
          />

          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h4 className={cn(
                "font-semibold text-sm",
                isCompleted && "line-through text-muted-foreground"
              )}>
                {task.subject}
              </h4>
              <Badge
                variant="outline"
                className={PRIORITY_CONFIG[task.priority].color}
              >
                {PRIORITY_CONFIG[task.priority].label}
              </Badge>
            </div>

            {task.description && (
              <p className="text-xs text-muted-foreground line-clamp-2">
                {task.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              {task.due_date && (
                <div className="flex items-center gap-1">
                  <CalendarClock className="h-3.5 w-3.5" />
                  <span>
                    {format(parseISO(task.due_date), "d MMM yyyy", { locale: es })}
                  </span>
                </div>
              )}

              {relatedName && RelatedIcon && (
                <div className="flex items-center gap-1">
                  <RelatedIcon className="h-3.5 w-3.5" />
                  <span className="truncate max-w-[150px]">{relatedName}</span>
                </div>
              )}

              {task.assigned_to && (
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                      AS
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="p-6 space-y-8">
      {Object.entries(groupedTasks).map(([group, groupTasks]) => {
        if (groupTasks.length === 0) return null;
        
        const config = GROUP_CONFIG[group as TaskGroup];
        const Icon = config.icon;

        return (
          <div key={group} className="space-y-3">
            <div className="flex items-center gap-2">
              <Icon className={cn("h-5 w-5", config.color)} />
              <h3 className={cn("font-semibold text-lg", config.color)}>
                {config.label}
              </h3>
              <Badge variant="secondary" className="ml-2">
                {groupTasks.length}
              </Badge>
            </div>

            <div className="space-y-2">
              {groupTasks.map(renderTask)}
            </div>
          </div>
        );
      })}

      {/* Completed Tasks */}
      {tasks.filter(t => t.status === 'completada').length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg text-muted-foreground">
              Completadas
            </h3>
            <Badge variant="secondary">
              {tasks.filter(t => t.status === 'completada').length}
            </Badge>
          </div>

          <div className="space-y-2">
            {tasks
              .filter(t => t.status === 'completada')
              .map(renderTask)}
          </div>
        </div>
      )}

      {tasks.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <CalendarClock className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold text-lg mb-2">No hay tareas</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            Crea tu primera tarea para comenzar a organizarte.
          </p>
        </div>
      )}
    </div>
  );
}
