import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { LeadFilters, getActiveFiltersCount } from "@/lib/leadFilters";
import { LeadStatus } from "@/hooks/useLeads";
import { cn } from "@/lib/utils";

interface LeadFiltersProps {
  filters: LeadFilters;
  onFiltersChange: (filters: LeadFilters) => void;
  totalLeads: number;
  filteredLeads: number;
}

const STATUS_OPTIONS: { value: LeadStatus; label: string }[] = [
  { value: 'nuevo', label: 'Nuevo' },
  { value: 'contactado', label: 'Contactado' },
  { value: 'calificado', label: 'Calificado' },
  { value: 'convertido', label: 'Convertido' },
  { value: 'perdido', label: 'Perdido' },
];

const DATE_PRESETS = [
  { label: 'Hoy', days: 0 },
  { label: 'Esta semana', days: 7 },
  { label: 'Este mes', days: 30 },
  { label: 'Este trimestre', days: 90 },
];

export function LeadFiltersComponent({ filters, onFiltersChange, totalLeads, filteredLeads }: LeadFiltersProps) {
  const [open, setOpen] = useState(false);

  // Fetch sucursales
  const { data: sucursales } = useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sucursales')
        .select('id, nombre')
        .order('nombre');
      if (error) throw error;
      return data;
    },
  });

  // Fetch unique origins
  const { data: origenes } = useQuery({
    queryKey: ['lead-origins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('leads')
        .select('origen_lead');
      if (error) throw error;
      
      const allOrigins = new Set<string>();
      data.forEach(lead => {
        if (lead.origen_lead && Array.isArray(lead.origen_lead)) {
          lead.origen_lead.forEach(origin => allOrigins.add(origin));
        }
      });
      
      return Array.from(allOrigins).sort();
    },
  });

  const activeFiltersCount = getActiveFiltersCount(filters);

  const handleClearAll = () => {
    onFiltersChange({
      presupuesto_min: undefined,
      presupuesto_max: undefined,
      fecha_desde: undefined,
      fecha_hasta: undefined,
      origenes: [],
      sucursal_id: undefined,
      terreno_min: undefined,
      terreno_max: undefined,
      statuses: [],
    });
  };

  const removeFilter = (key: keyof LeadFilters) => {
    onFiltersChange({
      ...filters,
      [key]: Array.isArray(filters[key]) ? [] : undefined,
    });
  };

  const handleDatePreset = (days: number) => {
    const today = new Date();
    const desde = new Date();
    desde.setDate(today.getDate() - days);
    
    onFiltersChange({
      ...filters,
      fecha_desde: desde,
      fecha_hasta: today,
    });
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      {/* Counter */}
      <div className="bg-muted/50 rounded-lg p-3">
        <p className="text-sm font-medium text-center">
          <span className="text-primary font-bold">{filteredLeads}</span> leads encontrados
          <span className="text-muted-foreground"> (de {totalLeads} totales)</span>
        </p>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Filtros activos</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="h-7 text-xs"
            >
              Limpiar todos
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(filters.presupuesto_min || filters.presupuesto_max) && (
              <Badge variant="secondary" className="gap-1">
                Presupuesto
                <button
                  onClick={() => {
                    onFiltersChange({
                      ...filters,
                      presupuesto_min: undefined,
                      presupuesto_max: undefined,
                    });
                  }}
                  className="ml-1 hover:bg-background/20 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(filters.fecha_desde || filters.fecha_hasta) && (
              <Badge variant="secondary" className="gap-1">
                Fecha
                <button
                  onClick={() => {
                    onFiltersChange({
                      ...filters,
                      fecha_desde: undefined,
                      fecha_hasta: undefined,
                    });
                  }}
                  className="ml-1 hover:bg-background/20 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.origenes && filters.origenes.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                Origen ({filters.origenes.length})
                <button
                  onClick={() => removeFilter('origenes')}
                  className="ml-1 hover:bg-background/20 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.sucursal_id && (
              <Badge variant="secondary" className="gap-1">
                Sucursal
                <button
                  onClick={() => removeFilter('sucursal_id')}
                  className="ml-1 hover:bg-background/20 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {(filters.terreno_min || filters.terreno_max) && (
              <Badge variant="secondary" className="gap-1">
                M² Terreno
                <button
                  onClick={() => {
                    onFiltersChange({
                      ...filters,
                      terreno_min: undefined,
                      terreno_max: undefined,
                    });
                  }}
                  className="ml-1 hover:bg-background/20 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {filters.statuses && filters.statuses.length > 0 && (
              <Badge variant="secondary" className="gap-1">
                Estado ({filters.statuses.length})
                <button
                  onClick={() => removeFilter('statuses')}
                  className="ml-1 hover:bg-background/20 rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Presupuesto Filter */}
      <div className="space-y-3">
        <Label>Presupuesto (MXN)</Label>
        <div className="space-y-2">
          <Slider
            min={0}
            max={10000000}
            step={100000}
            value={[filters.presupuesto_min || 0, filters.presupuesto_max || 10000000]}
            onValueChange={([min, max]) => {
              onFiltersChange({
                ...filters,
                presupuesto_min: min > 0 ? min : undefined,
                presupuesto_max: max < 10000000 ? max : undefined,
              });
            }}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
                maximumFractionDigits: 0
              }).format(filters.presupuesto_min || 0)}
            </span>
            <span>
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
                maximumFractionDigits: 0
              }).format(filters.presupuesto_max || 10000000)}
            </span>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="space-y-3">
        <Label>Fecha de creación</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {DATE_PRESETS.map((preset) => (
            <Button
              key={preset.label}
              variant="outline"
              size="sm"
              onClick={() => handleDatePreset(preset.days)}
              className="h-7 text-xs"
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !filters.fecha_desde && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.fecha_desde ? format(filters.fecha_desde, "PP", { locale: es }) : "Desde"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
              <Calendar
                mode="single"
                selected={filters.fecha_desde}
                onSelect={(date) => onFiltersChange({ ...filters, fecha_desde: date })}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "justify-start text-left font-normal",
                  !filters.fecha_hasta && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.fecha_hasta ? format(filters.fecha_hasta, "PP", { locale: es }) : "Hasta"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
              <Calendar
                mode="single"
                selected={filters.fecha_hasta}
                onSelect={(date) => onFiltersChange({ ...filters, fecha_hasta: date })}
                initialFocus
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Origen Filter */}
      <div className="space-y-3">
        <Label>Origen</Label>
        <div className="space-y-2 max-h-[200px] overflow-y-auto rounded-md border p-3">
          {(origenes || []).map((origen) => (
            <div key={origen} className="flex items-center space-x-2">
              <Checkbox
                id={`origen-${origen}`}
                checked={filters.origenes?.includes(origen)}
                onCheckedChange={(checked) => {
                  const newOrigenes = checked
                    ? [...(filters.origenes || []), origen]
                    : (filters.origenes || []).filter(o => o !== origen);
                  onFiltersChange({ ...filters, origenes: newOrigenes });
                }}
              />
              <label
                htmlFor={`origen-${origen}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {origen}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Sucursal Filter */}
      <div className="space-y-3">
        <Label>Sucursal</Label>
        <Select
          value={filters.sucursal_id || "all"}
          onValueChange={(value) => {
            onFiltersChange({
              ...filters,
              sucursal_id: value === "all" ? undefined : value,
            });
          }}
        >
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Todas las sucursales" />
          </SelectTrigger>
          <SelectContent className="bg-background z-50">
            <SelectItem value="all">Todas las sucursales</SelectItem>
            {(sucursales || []).map((sucursal) => (
              <SelectItem key={sucursal.id} value={sucursal.id}>
                {sucursal.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* M² Terreno Filter */}
      <div className="space-y-3">
        <Label>M² de Terreno</Label>
        <div className="space-y-2">
          <Slider
            min={0}
            max={5000}
            step={50}
            value={[filters.terreno_min || 0, filters.terreno_max || 5000]}
            onValueChange={([min, max]) => {
              onFiltersChange({
                ...filters,
                terreno_min: min > 0 ? min : undefined,
                terreno_max: max < 5000 ? max : undefined,
              });
            }}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{filters.terreno_min || 0} m²</span>
            <span>{filters.terreno_max || 5000} m²</span>
          </div>
        </div>
      </div>

      {/* Status Filter */}
      <div className="space-y-3">
        <Label>Estado</Label>
        <div className="space-y-2">
          {STATUS_OPTIONS.map((status) => (
            <div key={status.value} className="flex items-center space-x-2">
              <Checkbox
                id={`status-${status.value}`}
                checked={filters.statuses?.includes(status.value)}
                onCheckedChange={(checked) => {
                  const newStatuses = checked
                    ? [...(filters.statuses || []), status.value]
                    : (filters.statuses || []).filter(s => s !== status.value);
                  onFiltersChange({ ...filters, statuses: newStatuses });
                }}
              />
              <label
                htmlFor={`status-${status.value}`}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {status.label}
              </label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop: Collapsible Sidebar */}
      <div className="hidden lg:block">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setOpen(!open)}
          className="relative"
        >
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
        
        {open && (
          <div className="mt-4 border rounded-lg p-4 bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Filtros</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOpen(false)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <FiltersContent />
          </div>
        )}
      </div>

      {/* Mobile: Sheet */}
      <div className="lg:hidden">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="relative">
              <Filter className="h-4 w-4 mr-2" />
              Filtros
              {activeFiltersCount > 0 && (
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                >
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FiltersContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
