import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  X, 
  Calendar, 
  User2, 
  Briefcase, 
  Building2, 
  CheckCircle2, 
  Circle,
  Pencil,
  Trash2,
  Clock
} from "lucide-react";
import { useTaskById, useUpdateTask, useDeleteTask } from "@/hooks/crm/useTasks";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { CreateTaskDialog } from "./CreateTaskDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface TaskDetailsPanelProps {
  taskId: string;
  onClose: () => void;
}

const PRIORITY_CONFIG = {
  baja: { label: 'Baja', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500' },
  media: { label: 'Media', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500' },
  alta: { label: 'Alta', color: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500' },
};

const STATUS_CONFIG = {
  pendiente: { label: 'Pendiente', color: 'bg-blue-500/10 text-blue-700 dark:text-blue-400' },
  en_progreso: { label: 'En Progreso', color: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400' },
  completada: { label: 'Completada', color: 'bg-green-500/10 text-green-700 dark:text-green-400' },
  cancelada: { label: 'Cancelada', color: 'bg-gray-500/10 text-gray-700 dark:text-gray-400' },
};

export function TaskDetailsPanel({ taskId, onClose }: TaskDetailsPanelProps) {
  const { data: task, isLoading } = useTaskById(taskId);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  // Fetch related entity
  const { data: relatedEntity } = useQuery({
    queryKey: ['task-related-entity', task?.related_to_id, task?.related_to_type],
    queryFn: async () => {
      if (!task?.related_to_id || !task?.related_to_type) return null;

      let query;
      if (task.related_to_type === 'lead') {
        query = supabase.from('leads').select('id, nombre_completo').eq('id', task.related_to_id).single();
      } else if (task.related_to_type === 'opportunity') {
        query = supabase.from('opportunities').select('id, name').eq('id', task.related_to_id).single();
      } else if (task.related_to_type === 'project') {
        query = supabase.from('projects').select('id, project_name').eq('id', task.related_to_id).single();
      } else {
        return null;
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!task?.related_to_id && !!task?.related_to_type,
  });

  // Fetch assigned user
  const { data: assignedUser } = useQuery({
    queryKey: ['task-assigned-user', task?.assigned_to],
    queryFn: async () => {
      if (!task?.assigned_to) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', task.assigned_to)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!task?.assigned_to,
  });

  // Fetch creator
  const { data: creator } = useQuery({
    queryKey: ['task-creator', task?.created_by],
    queryFn: async () => {
      if (!task?.created_by) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('id', task.created_by)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!task?.created_by,
  });

  const handleToggleComplete = async () => {
    if (!task) return;
    await updateTask.mutateAsync({
      id: task.id,
      status: task.status === 'completada' ? 'pendiente' : 'completada',
    });
  };

  const handleDelete = async () => {
    await deleteTask.mutateAsync(taskId);
    onClose();
  };

  const getRelatedEntityIcon = () => {
    if (task?.related_to_type === 'lead') return User2;
    if (task?.related_to_type === 'opportunity') return Briefcase;
    if (task?.related_to_type === 'project') return Building2;
    return null;
  };

  const getRelatedEntityName = () => {
    if (!relatedEntity) return null;
    if ('nombre_completo' in relatedEntity) return relatedEntity.nombre_completo;
    if ('name' in relatedEntity) return relatedEntity.name;
    if ('project_name' in relatedEntity) return relatedEntity.project_name;
    return null;
  };

  if (isLoading || !task) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  const RelatedIcon = getRelatedEntityIcon();
  const relatedName = getRelatedEntityName();

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b space-y-4">
        <div className="flex items-start justify-between">
          <h2 className="text-xl font-semibold pr-8 flex-1 leading-tight">
            {task.subject}
          </h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Badge
            variant="outline"
            className={PRIORITY_CONFIG[task.priority].color}
          >
            {PRIORITY_CONFIG[task.priority].label}
          </Badge>
          <Badge variant="outline" className={STATUS_CONFIG[task.status].color}>
            {STATUS_CONFIG[task.status].label}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Description */}
        {task.description && (
          <div>
            <h3 className="font-semibold text-sm mb-2">Descripción</h3>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        )}

        <Separator />

        {/* Details */}
        <div className="space-y-4">
          <h3 className="font-semibold text-sm">Detalles</h3>

          {task.due_date && (
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Vencimiento</p>
                <p className="text-sm font-medium">
                  {format(parseISO(task.due_date), "d 'de' MMMM 'de' yyyy", { locale: es })}
                </p>
              </div>
            </div>
          )}

          {relatedName && RelatedIcon && (
            <div className="flex items-center gap-3">
              <RelatedIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Relacionado a</p>
                <p className="text-sm font-medium">{relatedName}</p>
              </div>
            </div>
          )}

          {assignedUser && (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {assignedUser.full_name?.substring(0, 2).toUpperCase() || 'AS'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground">Asignado a</p>
                <p className="text-sm font-medium">
                  {assignedUser.full_name || assignedUser.email}
                </p>
              </div>
            </div>
          )}

          {creator && (
            <div className="flex items-center gap-3">
              <User2 className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Creado por</p>
                <p className="text-sm font-medium">
                  {creator.full_name || creator.email}
                </p>
              </div>
            </div>
          )}

          {task.created_at && (
            <div className="flex items-center gap-3">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Creado</p>
                <p className="text-sm font-medium">
                  {format(parseISO(task.created_at), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                </p>
              </div>
            </div>
          )}

          {task.completed_at && (
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-muted-foreground">Completado</p>
                <p className="text-sm font-medium">
                  {format(parseISO(task.completed_at), "d 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-6 border-t space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleToggleComplete}
        >
          {task.status === 'completada' ? (
            <>
              <Circle className="h-4 w-4 mr-2" />
              Marcar como Pendiente
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Marcar como Completada
            </>
          )}
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => setEditOpen(true)}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Editar Tarea
        </Button>

        <Button
          variant="outline"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={() => setDeleteOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Eliminar Tarea
        </Button>
      </div>

      <CreateTaskDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        taskId={taskId}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar tarea?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La tarea "{task.subject}" será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
