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
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="flex flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Tareas</h1>
              <p className="text-sm text-muted-foreground mt-1">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'tarea' : 'tareas'}
                {activeFiltersCount > 0 && ` (${activeFiltersCount} ${activeFiltersCount === 1 ? 'filtro' : 'filtros'} activo${activeFiltersCount === 1 ? '' : 's'})`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center rounded-lg border bg-background p-1">
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('list')}
                  className="h-8"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'kanban' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('kanban')}
                  className="h-8"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>

              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tarea
              </Button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar tareas..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
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
