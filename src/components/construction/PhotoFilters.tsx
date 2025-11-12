import { useState } from 'react';
import { Filter, X, Calendar, Image, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { PHOTO_CATEGORIES } from '@/lib/constants/photo-categories';

export interface PhotoFiltersState {
  searchText: string;
  stageId: string | null;
  categoria: string | null;
  dateFrom: string | null;
  dateTo: string | null;
}

interface PhotoFiltersProps {
  filters: PhotoFiltersState;
  onFiltersChange: (filters: PhotoFiltersState) => void;
  stages: any[];
}

export function PhotoFilters({ filters, onFiltersChange, stages }: PhotoFiltersProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const activeFiltersCount = [
    filters.searchText,
    filters.stageId,
    filters.categoria,
    filters.dateFrom,
    filters.dateTo
  ].filter(Boolean).length;

  const handleClearFilter = (key: keyof PhotoFiltersState) => {
    onFiltersChange({
      ...filters,
      [key]: key === 'searchText' ? '' : null
    });
  };

  const handleClearAll = () => {
    onFiltersChange({
      searchText: '',
      stageId: null,
      categoria: null,
      dateFrom: null,
      dateTo: null
    });
  };

  const FilterContent = () => (
    <div className="space-y-6 p-4">
      {/* Search */}
      <div className="space-y-2">
        <Label>Buscar en descripciones</Label>
        <Input
          placeholder="Buscar..."
          value={filters.searchText}
          onChange={(e) => onFiltersChange({ ...filters, searchText: e.target.value })}
          className="w-full"
        />
      </div>

      {/* Stage Filter */}
      <div className="space-y-2">
        <Label>Etapa de Construcción</Label>
        <Select
          value={filters.stageId || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ ...filters, stageId: value === 'all' ? null : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas las etapas" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las etapas</SelectItem>
            {stages.map((stage) => (
              <SelectItem key={stage.id} value={stage.id}>
                {stage.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Category Filter */}
      <div className="space-y-2">
        <Label>Categoría</Label>
        <Select
          value={filters.categoria || 'all'}
          onValueChange={(value) => 
            onFiltersChange({ ...filters, categoria: value === 'all' ? null : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Todas las categorías" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las categorías</SelectItem>
            {PHOTO_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                <div className="flex items-center gap-2">
                  <cat.icon className="h-4 w-4" />
                  <span>{cat.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Date Range */}
      <div className="space-y-2">
        <Label>Rango de Fechas</Label>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs text-muted-foreground">Desde</Label>
            <Input
              type="date"
              value={filters.dateFrom || ''}
              onChange={(e) => onFiltersChange({ ...filters, dateFrom: e.target.value || null })}
            />
          </div>
          <div>
            <Label className="text-xs text-muted-foreground">Hasta</Label>
            <Input
              type="date"
              value={filters.dateTo || ''}
              onChange={(e) => onFiltersChange({ ...filters, dateTo: e.target.value || null })}
            />
          </div>
        </div>
      </div>

      {/* Clear All Button */}
      {activeFiltersCount > 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={handleClearAll}
        >
          Limpiar todos los filtros
        </Button>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filter Trigger Button */}
      <div className="flex items-center gap-2">
        {isMobile ? (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85vh]">
              <SheetHeader>
                <SheetTitle>Filtros de Fotografías</SheetTitle>
              </SheetHeader>
              <FilterContent />
            </SheetContent>
          </Sheet>
        ) : (
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filtros
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-1 rounded-full h-5 w-5 p-0 flex items-center justify-center">
                    {activeFiltersCount}
                  </Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="start">
              <FilterContent />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Active Filter Pills */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.searchText && (
            <Badge variant="secondary" className="gap-2 pr-1">
              <span className="text-xs">Búsqueda: {filters.searchText}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleClearFilter('searchText')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
          
          {filters.stageId && (
            <Badge variant="secondary" className="gap-2 pr-1">
              <Tag className="h-3 w-3" />
              <span className="text-xs">
                {stages.find(s => s.id === filters.stageId)?.name || 'Etapa'}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleClearFilter('stageId')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {filters.categoria && (
            <Badge variant="secondary" className="gap-2 pr-1">
              <Image className="h-3 w-3" />
              <span className="text-xs">
                {PHOTO_CATEGORIES.find(c => c.value === filters.categoria)?.label || filters.categoria}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleClearFilter('categoria')}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}

          {(filters.dateFrom || filters.dateTo) && (
            <Badge variant="secondary" className="gap-2 pr-1">
              <Calendar className="h-3 w-3" />
              <span className="text-xs">
                {filters.dateFrom && filters.dateTo
                  ? `${filters.dateFrom} - ${filters.dateTo}`
                  : filters.dateFrom
                  ? `Desde ${filters.dateFrom}`
                  : `Hasta ${filters.dateTo}`}
              </span>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => {
                  onFiltersChange({
                    ...filters,
                    dateFrom: null,
                    dateTo: null
                  });
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
