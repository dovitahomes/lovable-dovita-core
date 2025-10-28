import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "lucide-react";

interface KpiFiltersProps {
  dateRange: string;
  onDateRangeChange: (value: string) => void;
}

export function KpiFilters({ dateRange, onDateRangeChange }: KpiFiltersProps) {
  return (
    <div className="flex items-center gap-2">
      <Calendar className="h-4 w-4 text-muted-foreground" />
      <Select value={dateRange} onValueChange={onDateRangeChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30">Últimos 30 días</SelectItem>
          <SelectItem value="90">Últimos 90 días</SelectItem>
          <SelectItem value="180">Últimos 6 meses</SelectItem>
          <SelectItem value="365">Último año</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
