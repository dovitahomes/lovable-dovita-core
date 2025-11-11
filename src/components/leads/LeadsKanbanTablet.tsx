import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronDown } from "lucide-react";
import { LeadCardCompact } from "./LeadCardCompact";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/hooks/useLeads";

interface LeadsKanbanTabletProps {
  columns: { status: LeadStatus; title: string; color: string }[];
  columnQueries: Record<LeadStatus, any>;
  onOpenDetails: (leadId: string) => void;
}

type SimplifiedStatus = 'nuevo' | 'contactado' | 'propuesta' | 'convertido' | 'perdido';

export function LeadsKanbanTablet({
  columns,
  columnQueries,
  onOpenDetails
}: LeadsKanbanTabletProps) {
  const [expandedStates, setExpandedStates] = useState<Set<SimplifiedStatus>>(
    new Set(['nuevo', 'contactado'])
  );

  // Agrupar leads por columnas simplificadas
  const groupedLeads = {
    nuevo: {
      leads: columnQueries.nuevo.data || [],
      color: "bg-gray-500",
      title: "Nuevo"
    },
    contactado: {
      leads: [
        ...(columnQueries.contactado.data || []),
        ...(columnQueries.calificado.data || [])
      ],
      color: "bg-blue-500",
      title: "Contactado"
    },
    propuesta: {
      leads: [
        ...(columnQueries.propuesta.data || []),
        ...(columnQueries.negociacion.data || [])
      ],
      color: "bg-purple-500",
      title: "Propuesta"
    },
    convertido: {
      leads: [
        ...(columnQueries.convertido.data || []),
        ...(columnQueries.ganado.data || [])
      ],
      color: "bg-green-500",
      title: "Convertido"
    },
    perdido: {
      leads: columnQueries.perdido.data || [],
      color: "bg-red-500",
      title: "Perdido"
    }
  };

  const toggleState = (status: SimplifiedStatus) => {
    setExpandedStates(prev => {
      const newSet = new Set(prev);
      if (newSet.has(status)) {
        newSet.delete(status);
      } else {
        newSet.add(status);
      }
      return newSet;
    });
  };

  return (
    <div className="space-y-3">
      {(Object.keys(groupedLeads) as SimplifiedStatus[]).map((status) => {
        const { leads, color, title } = groupedLeads[status];
        
        return (
          <Collapsible
            key={status}
            open={expandedStates.has(status)}
            onOpenChange={() => toggleState(status)}
          >
            <Card>
              <CollapsibleTrigger className="w-full">
                <CardHeader className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", color)} />
                      <CardTitle className="text-sm">{title}</CardTitle>
                      <Badge variant="secondary">
                        {leads.length}
                      </Badge>
                    </div>
                    <ChevronDown 
                      className={cn(
                        "h-4 w-4 transition-transform",
                        expandedStates.has(status) && "rotate-180"
                      )}
                    />
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="p-3 space-y-2 max-h-[300px] overflow-y-auto">
                  {leads.map((lead: any) => (
                    <LeadCardCompact
                      key={lead.id}
                      lead={lead}
                      onOpenDetails={onOpenDetails}
                    />
                  ))}
                  {leads.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground py-4">
                      Sin leads
                    </p>
                  )}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        );
      })}
    </div>
  );
}
