import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Filter, X } from "lucide-react";
import { useMediaQuery } from "@/hooks/use-media-query";
import { format } from "date-fns";

interface CommissionFiltersProps {
  filters: {
    status?: 'calculada' | 'pendiente' | 'pagada' | 'all';
    startDate?: string;
    endDate?: string;
    alianzaId?: string;
  };
  onFiltersChange: (filters: any) => void;
  alliances?: Array<{ id: string; nombre: string }>;
}

export function CommissionFilters({
  filters,
  onFiltersChange,
  alliances = [],
}: CommissionFiltersProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [localFilters, setLocalFilters] = useState(filters);

  const handleApply = () => {
    onFiltersChange(localFilters);
  };

  const handleClear = () => {
    const clearedFilters = { status: 'all' as const };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFiltersCount = Object.keys(filters).filter(
    key => filters[key as keyof typeof filters] && filters[key as keyof typeof filters] !== 'all'
  ).length;

  const FilterContent = () => (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <Label>Estado</Label>
        <Select
          value={localFilters.status || 'all'}
          onValueChange={(value) =>
            setLocalFilters({ ...localFilters, status: value as any })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Seleccionar estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="calculada">Calculada</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="pagada">Pagada</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {alliances.length > 0 && (
        <div className="space-y-2">
          <Label>Alianza</Label>
          <Select
            value={localFilters.alianzaId || 'all'}
            onValueChange={(value) =>
              setLocalFilters({
                ...localFilters,
                alianzaId: value === 'all' ? undefined : value,
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Todas las alianzas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {alliances.map((alliance) => (
                <SelectItem key={alliance.id} value={alliance.id}>
                  {alliance.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Label>Fecha Inicio</Label>
        <Input
          type="date"
          value={localFilters.startDate || ''}
          onChange={(e) =>
            setLocalFilters({ ...localFilters, startDate: e.target.value })
          }
        />
      </div>

      <div className="space-y-2">
        <Label>Fecha Fin</Label>
        <Input
          type="date"
          value={localFilters.endDate || ''}
          onChange={(e) =>
            setLocalFilters({ ...localFilters, endDate: e.target.value })
          }
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={handleApply} className="flex-1">
          Aplicar Filtros
        </Button>
        <Button onClick={handleClear} variant="outline">
          Limpiar
        </Button>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[80vh]">
          <SheetHeader>
            <SheetTitle>Filtrar Comisiones</SheetTitle>
            <SheetDescription>
              Refina la búsqueda de comisiones
            </SheetDescription>
          </SheetHeader>
          <FilterContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="relative">
          <Filter className="h-4 w-4 mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-2 mb-4">
          <h4 className="font-semibold">Filtrar Comisiones</h4>
          <p className="text-sm text-muted-foreground">
            Refina la búsqueda de comisiones
          </p>
        </div>
        <FilterContent />
      </PopoverContent>
    </Popover>
  );
}
