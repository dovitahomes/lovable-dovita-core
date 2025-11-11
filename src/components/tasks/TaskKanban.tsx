import { useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CalendarClock, User2, Briefcase, Building2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useUpdateTask } from "@/hooks/crm/useTasks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import type { Task, TaskStatus } from "@/hooks/crm/useTasks";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";

interface TaskKanbanProps {
  tasks: Task[];
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
}

const COLUMNS: { id: TaskStatus; label: string; color: string; gradient: string }[] = [
  { id: 'pendiente', label: 'Pendiente', color: 'border-t-blue-500', gradient: 'from-blue-500/10 to-blue-500/5' },
  { id: 'en_progreso', label: 'En Progreso', color: 'border-t-yellow-500', gradient: 'from-yellow-500/10 to-yellow-500/5' },
  { id: 'completada', label: 'Completada', color: 'border-t-green-500', gradient: 'from-green-500/10 to-green-500/5' },
  { id: 'cancelada', label: 'Cancelada', color: 'border-t-gray-500', gradient: 'from-gray-500/10 to-gray-500/5' },
];

const PRIORITY_CONFIG = {
  baja: { label: 'Baja', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400', icon: '🟢' },
  media: { label: 'Media', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400', icon: '🟡' },
  alta: { label: 'Alta', color: 'bg-red-500/10 text-red-700 dark:text-red-400', icon: '🔴' },
};

function SortableTaskCard({ task, onClick, isSelected }: { 
  task: Task; 
  onClick: () => void;
  isSelected: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

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

  const getRelatedEntityName = () => {
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

  const getRelatedEntityIcon = () => {
    if (task.related_to_type === 'lead') return User2;
    if (task.related_to_type === 'opportunity') return Briefcase;
    if (task.related_to_type === 'project') return Building2;
    return null;
  };

  const relatedName = getRelatedEntityName();
  const RelatedIcon = getRelatedEntityIcon();

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "p-4 cursor-grab active:cursor-grabbing transition-all hover:shadow-lg animate-fade-in",
        isSelected && "ring-2 ring-primary bg-accent/50"
      )}
      onClick={onClick}
    >
      <div className="space-y-3">
        <div className="flex items-start gap-2">
          <span className="text-base shrink-0">{PRIORITY_CONFIG[task.priority].icon}</span>
          <h4 className="font-semibold text-sm line-clamp-2 flex-1">
            {task.subject}
          </h4>
        </div>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 pl-6">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap pl-6">
          {task.due_date && (
            <div className="flex items-center gap-1.5">
              <CalendarClock className="h-4 w-4" />
              <span className="font-medium">
                {format(parseISO(task.due_date), "d MMM", { locale: es })}
              </span>
            </div>
          )}

          {relatedName && RelatedIcon && (
            <div className="flex items-center gap-1.5">
              <RelatedIcon className="h-4 w-4" />
              <span className="truncate max-w-[100px] font-medium">{relatedName}</span>
            </div>
          )}

          {task.assigned_to && (
            <Avatar className="h-6 w-6 border-2 border-background">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-semibold">
                AS
              </AvatarFallback>
            </Avatar>
          )}
        </div>
      </div>
    </Card>
  );
}

export function TaskKanban({ tasks, selectedTaskId, onSelectTask }: TaskKanbanProps) {
  const updateTask = useUpdateTask();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const tasksByStatus = useMemo(() => {
    const groups: Record<TaskStatus, Task[]> = {
      pendiente: [],
      en_progreso: [],
      completada: [],
      cancelada: [],
    };

    tasks.forEach(task => {
      groups[task.status].push(task);
    });

    return groups;
  }, [tasks]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    const task = tasks.find(t => t.id === taskId);

    if (task && task.status !== newStatus) {
      await updateTask.mutateAsync({
        id: taskId,
        status: newStatus,
      });
    }
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {COLUMNS.map(column => (
            <div key={column.id} className="flex flex-col h-full">
              <div className={cn(
                "rounded-t-lg border-t-4 bg-gradient-to-br p-4 mb-4 shadow-sm",
                column.color,
                column.gradient
              )}>
                <h3 className="font-semibold flex items-center justify-between">
                  <span>{column.label}</span>
                  <Badge variant="secondary" className="animate-pulse">
                    {tasksByStatus[column.id].length}
                  </Badge>
                </h3>
              </div>

              <SortableContext
                id={column.id}
                items={tasksByStatus[column.id].map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-3 min-h-[400px]">
                  {tasksByStatus[column.id].map(task => (
                    <SortableTaskCard
                      key={task.id}
                      task={task}
                      onClick={() => onSelectTask(task.id)}
                      isSelected={selectedTaskId === task.id}
                    />
                  ))}

                  {tasksByStatus[column.id].length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="rounded-full bg-muted p-4 mb-3">
                        <CalendarClock className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">Sin tareas</p>
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeTask ? (
          <Card className="p-3 opacity-90 cursor-grabbing shadow-lg">
            <h4 className="font-semibold text-sm">{activeTask.subject}</h4>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
