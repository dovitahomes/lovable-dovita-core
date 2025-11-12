import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Filter, X, CheckCircle, FileText, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

interface BudgetFiltersProps {
  activeFilters: string[];
  onFilterToggle: (filter: string) => void;
  onClearAll: () => void;
}

const FILTER_OPTIONS = [
  { id: 'publicado', label: 'Publicados', icon: CheckCircle, color: 'text-green-600 dark:text-green-400' },
  { id: 'borrador', label: 'Borradores', icon: FileText, color: 'text-amber-600 dark:text-amber-400' },
  { id: 'parametrico', label: 'Paramétrico', icon: TrendingUp, color: 'text-blue-600 dark:text-blue-400' },
  { id: 'ejecutivo', label: 'Ejecutivo', icon: TrendingUp, color: 'text-purple-600 dark:text-purple-400' },
  { id: 'con_alertas', label: 'Con Alertas', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400' },
];

export function BudgetFilters({ activeFilters, onFilterToggle, onClearAll }: BudgetFiltersProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");

  const FilterContent = () => (
    <div className="space-y-4 p-4">
      <div className="space-y-2">
        <h4 className="font-medium text-sm">Filtros disponibles</h4>
        <div className="flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => {
            const Icon = option.icon;
            const isActive = activeFilters.includes(option.id);
            return (
              <Button
                key={option.id}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onFilterToggle(option.id)}
                className={cn(
                  "gap-2 transition-all",
                  isActive && "shadow-md"
                )}
              >
                <Icon className={cn("h-4 w-4", !isActive && option.color)} />
                {option.label}
              </Button>
            );
          })}
        </div>
      </div>

      {activeFilters.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearAll}
          className="w-full text-muted-foreground hover:text-destructive"
        >
          <X className="h-4 w-4 mr-2" />
          Limpiar todos los filtros
        </Button>
      )}
    </div>
  );

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Filter Trigger Button */}
      {isDesktop ? (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 bg-background/95 backdrop-blur-sm border-border z-50" align="start">
            <FilterContent />
          </PopoverContent>
        </Popover>
      ) : (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
              {activeFilters.length > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 min-w-5 px-1.5">
                  {activeFilters.length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="bg-background/95 backdrop-blur-sm">
            <SheetHeader>
              <SheetTitle>Filtros de Presupuestos</SheetTitle>
            </SheetHeader>
            <FilterContent />
          </SheetContent>
        </Sheet>
      )}

      {/* Active Filter Chips */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {activeFilters.map((filterId) => {
            const option = FILTER_OPTIONS.find((opt) => opt.id === filterId);
            if (!option) return null;
            const Icon = option.icon;
            return (
              <Badge
                key={filterId}
                variant="secondary"
                className="gap-1.5 pr-1 animate-fade-in cursor-pointer hover:bg-secondary/80 transition-colors"
                onClick={() => onFilterToggle(filterId)}
              >
                <Icon className={cn("h-3 w-3", option.color)} />
                {option.label}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={(e) => {
                    e.stopPropagation();
                    onFilterToggle(filterId);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
