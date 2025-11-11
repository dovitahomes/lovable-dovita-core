import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import type { TaskFilterState } from "@/pages/herramientas/Tareas";

interface TaskFiltersProps {
  filters: TaskFilterState;
  onFiltersChange: (filters: TaskFilterState) => void;
}

const STATUS_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_progreso", label: "En Progreso" },
  { value: "completada", label: "Completada" },
  { value: "cancelada", label: "Cancelada" },
];

const PRIORITY_OPTIONS = [
  { value: "baja", label: "Baja" },
  { value: "media", label: "Media" },
  { value: "alta", label: "Alta" },
];

const RELATED_TYPE_OPTIONS = [
  { value: "lead", label: "Leads" },
  { value: "opportunity", label: "Oportunidades" },
  { value: "project", label: "Proyectos" },
];

export function TaskFilters({ filters, onFiltersChange }: TaskFiltersProps) {
  const toggleStatus = (status: string) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onFiltersChange({ ...filters, statuses: newStatuses });
  };

  const togglePriority = (priority: string) => {
    const newPriorities = filters.priorities.includes(priority)
      ? filters.priorities.filter((p) => p !== priority)
      : [...filters.priorities, priority];
    onFiltersChange({ ...filters, priorities: newPriorities });
  };

  const clearFilters = () => {
    onFiltersChange({
      statuses: [],
      priorities: [],
      assignedTo: [],
      relatedToType: undefined,
      dateFrom: undefined,
      dateTo: undefined,
    });
  };

  const activeFiltersCount =
    filters.statuses.length +
    filters.priorities.length +
    filters.assignedTo.length +
    (filters.relatedToType ? 1 : 0) +
    (filters.dateFrom ? 1 : 0) +
    (filters.dateTo ? 1 : 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Filtros</h3>
        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Limpiar
          </Button>
        )}
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 pb-2 border-b">
          {filters.statuses.map((status) => (
            <Badge key={status} variant="secondary" className="gap-1">
              {STATUS_OPTIONS.find((s) => s.value === status)?.label}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => toggleStatus(status)}
              />
            </Badge>
          ))}
          {filters.priorities.map((priority) => (
            <Badge key={priority} variant="secondary" className="gap-1">
              {PRIORITY_OPTIONS.find((p) => p.value === priority)?.label}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => togglePriority(priority)}
              />
            </Badge>
          ))}
          {filters.relatedToType && (
            <Badge variant="secondary" className="gap-1">
              {RELATED_TYPE_OPTIONS.find((t) => t.value === filters.relatedToType)?.label}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => onFiltersChange({ ...filters, relatedToType: undefined })}
              />
            </Badge>
          )}
          {filters.dateFrom && (
            <Badge variant="secondary" className="gap-1">
              Desde {format(filters.dateFrom, "d MMM", { locale: es })}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => onFiltersChange({ ...filters, dateFrom: undefined })}
              />
            </Badge>
          )}
          {filters.dateTo && (
            <Badge variant="secondary" className="gap-1">
              Hasta {format(filters.dateTo, "d MMM", { locale: es })}
              <X
                className="h-3 w-3 cursor-pointer hover:text-destructive"
                onClick={() => onFiltersChange({ ...filters, dateTo: undefined })}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Estado */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Estado</Label>
        {STATUS_OPTIONS.map((status) => (
          <div key={status.value} className="flex items-center space-x-2">
            <Checkbox
              id={`status-${status.value}`}
              checked={filters.statuses.includes(status.value)}
              onCheckedChange={() => toggleStatus(status.value)}
            />
            <label
              htmlFor={`status-${status.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {status.label}
            </label>
          </div>
        ))}
      </div>

      {/* Prioridad */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Prioridad</Label>
        {PRIORITY_OPTIONS.map((priority) => (
          <div key={priority.value} className="flex items-center space-x-2">
            <Checkbox
              id={`priority-${priority.value}`}
              checked={filters.priorities.includes(priority.value)}
              onCheckedChange={() => togglePriority(priority.value)}
            />
            <label
              htmlFor={`priority-${priority.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {priority.label}
            </label>
          </div>
        ))}
      </div>

      {/* Relacionado a */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Relacionado a</Label>
        {RELATED_TYPE_OPTIONS.map((type) => (
          <div key={type.value} className="flex items-center space-x-2">
            <Checkbox
              id={`type-${type.value}`}
              checked={filters.relatedToType === type.value}
              onCheckedChange={(checked) =>
                onFiltersChange({
                  ...filters,
                  relatedToType: checked ? (type.value as any) : undefined,
                })
              }
            />
            <label
              htmlFor={`type-${type.value}`}
              className="text-sm font-normal cursor-pointer"
            >
              {type.label}
            </label>
          </div>
        ))}
      </div>

      {/* Date Range */}
      <div className="space-y-3">
        <Label className="text-sm font-semibold">Rango de Fechas</Label>
        
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Desde</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.dateFrom && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateFrom ? (
                  format(filters.dateFrom, "PPP", { locale: es })
                ) : (
                  <span>Seleccionar</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateFrom}
                onSelect={(date) => onFiltersChange({ ...filters, dateFrom: date })}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Hasta</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !filters.dateTo && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateTo ? (
                  format(filters.dateTo, "PPP", { locale: es })
                ) : (
                  <span>Seleccionar</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateTo}
                onSelect={(date) => onFiltersChange({ ...filters, dateTo: date })}
                disabled={(date) => filters.dateFrom ? date < filters.dateFrom : false}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
