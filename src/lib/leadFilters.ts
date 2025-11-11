import { LeadStatus } from "@/hooks/useLeads";

export interface LeadFilters {
  presupuesto_min?: number;
  presupuesto_max?: number;
  fecha_desde?: Date;
  fecha_hasta?: Date;
  origenes?: string[];
  sucursal_id?: string;
  terreno_min?: number;
  terreno_max?: number;
  statuses?: LeadStatus[];
}

export function getActiveFiltersCount(filters: LeadFilters): number {
  let count = 0;
  if (filters.presupuesto_min || filters.presupuesto_max) count++;
  if (filters.fecha_desde || filters.fecha_hasta) count++;
  if (filters.origenes && filters.origenes.length > 0) count++;
  if (filters.sucursal_id) count++;
  if (filters.terreno_min || filters.terreno_max) count++;
  if (filters.statuses && filters.statuses.length > 0) count++;
  return count;
}

export function getEmptyFilters(): LeadFilters {
  return {
    presupuesto_min: undefined,
    presupuesto_max: undefined,
    fecha_desde: undefined,
    fecha_hasta: undefined,
    origenes: [],
    sucursal_id: undefined,
    terreno_min: undefined,
    terreno_max: undefined,
    statuses: [],
  };
}
