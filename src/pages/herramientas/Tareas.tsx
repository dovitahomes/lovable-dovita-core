import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, LayoutGrid, List, Search } from "lucide-react";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskKanban } from "@/components/tasks/TaskKanban";
import { TaskDetailsPanel } from "@/components/tasks/TaskDetailsPanel";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { useTasks } from "@/hooks/crm/useTasks";
import { Skeleton } from "@/components/ui/skeleton";

type ViewMode = 'list' | 'kanban';

export interface TaskFilterState {
  statuses: string[];
  priorities: string[];
  assignedTo: string[];
  relatedToType?: 'lead' | 'opportunity' | 'project';
  dateFrom?: Date;
  dateTo?: Date;
}

export default function Tareas() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState<TaskFilterState>({
    statuses: [],
    priorities: [],
    assignedTo: [],
  });

  const { data: tasks, isLoading } = useTasks(search);

  // Apply filters
  const filteredTasks = tasks?.filter((task) => {
    if (filters.statuses.length > 0 && !filters.statuses.includes(task.status)) {
      return false;
    }
    if (filters.priorities.length > 0 && !filters.priorities.includes(task.priority)) {
      return false;
    }
    if (filters.assignedTo.length > 0 && !filters.assignedTo.includes(task.assigned_to || '')) {
      return false;
    }
    if (filters.relatedToType && task.related_to_type !== filters.relatedToType) {
      return false;
    }
    if (filters.dateFrom && new Date(task.due_date || '') < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && new Date(task.due_date || '') > filters.dateTo) {
      return false;
    }
    return true;
  }) || [];

  const activeFiltersCount = 
    filters.statuses.length + 
    filters.priorities.length + 
    filters.assignedTo.length + 
    (filters.relatedToType ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-primary/5 to-primary/10 sticky top-0 z-10">
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Tareas</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Gestiona y organiza todas tus tareas del CRM
              </p>
            </div>

            <Button onClick={() => setCreateOpen(true)} size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Nueva Tarea
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-background rounded-lg border p-4 space-y-1">
              <p className="text-xs text-muted-foreground font-medium">Total</p>
              <p className="text-2xl font-bold">{filteredTasks.length}</p>
            </div>
            <div className="bg-background rounded-lg border p-4 space-y-1">
              <p className="text-xs text-red-600 dark:text-red-400 font-medium">Vencidas</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {filteredTasks.filter(t => t.due_date && new Date(t.due_date) < new Date() && t.status !== 'completada').length}
              </p>
            </div>
            <div className="bg-background rounded-lg border p-4 space-y-1">
              <p className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">Hoy</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {filteredTasks.filter(t => t.due_date && new Date(t.due_date).toDateString() === new Date().toDateString()).length}
              </p>
            </div>
            <div className="bg-background rounded-lg border p-4 space-y-1">
              <p className="text-xs text-green-600 dark:text-green-400 font-medium">Completadas</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {filteredTasks.filter(t => t.status === 'completada').length}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar tareas..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* View Toggle */}
            <div className="flex items-center rounded-lg border bg-background p-1">
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
                className="h-8 gap-2"
              >
                <List className="h-4 w-4" />
                <span className="hidden sm:inline">Lista</span>
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                onClick={() => setViewMode('kanban')}
                className="h-8 gap-2"
              >
                <LayoutGrid className="h-4 w-4" />
                <span className="hidden sm:inline">Kanban</span>
              </Button>
            </div>
          </div>

          {/* Active Filters Summary */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {filteredTasks.length} resultado{filteredTasks.length !== 1 ? 's' : ''} encontrado{filteredTasks.length !== 1 ? 's' : ''}
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-primary font-medium">
                {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} activo{activeFiltersCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex min-h-0">
        {/* Filters Sidebar */}
        <div className="w-72 border-r bg-muted/30 overflow-y-auto">
          <TaskFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : viewMode === 'list' ? (
            <TaskList
              tasks={filteredTasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
            />
          ) : (
            <TaskKanban
              tasks={filteredTasks}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
            />
          )}
        </div>

        {/* Details Panel */}
        {selectedTaskId && (
          <div className="w-96 border-l bg-background overflow-y-auto">
            <TaskDetailsPanel
              taskId={selectedTaskId}
              onClose={() => setSelectedTaskId(null)}
            />
          </div>
        )}
      </div>

      <CreateTaskDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
