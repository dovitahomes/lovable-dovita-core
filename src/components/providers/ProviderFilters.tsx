import { useState } from "react";
import { Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useMediaQuery } from "@/hooks/use-media-query";

export type FilterType = "activos" | "inactivos" | "con_terminos" | "sin_terminos";

interface ProviderFiltersProps {
  appliedFilters: FilterType[];
  onFilterChange: (filters: FilterType[]) => void;
}

interface TogglePillProps {
  value: FilterType;
  label: string;
  color: string;
  isActive: boolean;
  onToggle: () => void;
}

function TogglePill({ value, label, color, isActive, onToggle }: TogglePillProps) {
  return (
    <Button
      variant={isActive ? "default" : "outline"}
      size="sm"
      onClick={onToggle}
      className={cn(
        "transition-all",
        isActive && color
      )}
    >
      {label}
    </Button>
  );
}

function FilterContent({ appliedFilters, onFilterChange }: ProviderFiltersProps) {
  const toggleFilter = (filter: FilterType) => {
    if (appliedFilters.includes(filter)) {
      onFilterChange(appliedFilters.filter((f) => f !== filter));
    } else {
      onFilterChange([...appliedFilters, filter]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-semibold">Estado</Label>
        <div className="flex flex-wrap gap-2">
          <TogglePill
            value="activos"
            label="Activos"
            color="bg-green-500 hover:bg-green-600"
            isActive={appliedFilters.includes("activos")}
            onToggle={() => toggleFilter("activos")}
          />
          <TogglePill
            value="inactivos"
            label="Inactivos"
            color="bg-gray-500 hover:bg-gray-600"
            isActive={appliedFilters.includes("inactivos")}
            onToggle={() => toggleFilter("inactivos")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-semibold">Condiciones</Label>
        <div className="flex flex-wrap gap-2">
          <TogglePill
            value="con_terminos"
            label="Con Términos"
            color="bg-blue-500 hover:bg-blue-600"
            isActive={appliedFilters.includes("con_terminos")}
            onToggle={() => toggleFilter("con_terminos")}
          />
          <TogglePill
            value="sin_terminos"
            label="Sin Términos"
            color="bg-red-500 hover:bg-red-600"
            isActive={appliedFilters.includes("sin_terminos")}
            onToggle={() => toggleFilter("sin_terminos")}
          />
        </div>
      </div>
    </div>
  );
}

export function ProviderFilters({ appliedFilters, onFilterChange }: ProviderFiltersProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)");
  const [isOpen, setIsOpen] = useState(false);

  const clearAllFilters = () => {
    onFilterChange([]);
  };

  const removeFilter = (filter: FilterType) => {
    onFilterChange(appliedFilters.filter((f) => f !== filter));
  };

  const filterLabels: Record<FilterType, string> = {
    activos: "Activos",
    inactivos: "Inactivos",
    con_terminos: "Con Términos",
    sin_terminos: "Sin Términos",
  };

  const FilterButton = (
    <Button variant="outline" className="gap-2">
      <Filter className="h-4 w-4" />
      Filtros
      {appliedFilters.length > 0 && (
        <Badge variant="secondary" className="ml-1">
          {appliedFilters.length}
        </Badge>
      )}
    </Button>
  );

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Filter Trigger */}
      {isDesktop ? (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>{FilterButton}</PopoverTrigger>
          <PopoverContent className="w-80">
            <FilterContent
              appliedFilters={appliedFilters}
              onFilterChange={onFilterChange}
            />
          </PopoverContent>
        </Popover>
      ) : (
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>{FilterButton}</SheetTrigger>
          <SheetContent side="bottom" className="h-[70vh]">
            <SheetHeader>
              <SheetTitle>Filtros</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <FilterContent
                appliedFilters={appliedFilters}
                onFilterChange={onFilterChange}
              />
            </div>
            <div className="mt-6">
              <Button className="w-full" onClick={() => setIsOpen(false)}>
                Aplicar Filtros
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}

      {/* Active Filter Chips */}
      {appliedFilters.map((filter) => (
        <Badge
          key={filter}
          variant="secondary"
          className="gap-1 cursor-pointer hover:bg-secondary/80"
          onClick={() => removeFilter(filter)}
        >
          {filterLabels[filter]}
          <X className="h-3 w-3" />
        </Badge>
      ))}

      {/* Clear All Button */}
      {appliedFilters.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="text-muted-foreground hover:text-foreground"
        >
          Limpiar todo
        </Button>
      )}
    </div>
  );
}
