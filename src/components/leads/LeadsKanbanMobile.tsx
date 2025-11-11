import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ChevronDown } from "lucide-react";
import { LeadCardCompact } from "./LeadCardCompact";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/hooks/useLeads";

interface LeadsKanbanMobileProps {
  columns: { status: LeadStatus; title: string; color: string }[];
  columnQueries: Record<LeadStatus, any>;
  onOpenDetails: (leadId: string) => void;
}

type SimplifiedStatus = 'nuevo' | 'contactado' | 'propuesta' | 'convertido' | 'perdido';

export function LeadsKanbanMobile({
  columns,
  columnQueries,
  onOpenDetails
}: LeadsKanbanMobileProps) {
  const [selectedStatus, setSelectedStatus] = useState<SimplifiedStatus>('nuevo');
  const [selectorOpen, setSelectorOpen] = useState(false);

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

  const currentData = groupedLeads[selectedStatus];

  return (
    <div className="flex flex-col h-full">
      {/* Estado Selector (Sheet bottom drawer) */}
      <Sheet open={selectorOpen} onOpenChange={setSelectorOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between mb-3"
          >
            <div className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-full", currentData.color)} />
              <span className="font-semibold">
                {currentData.title}
              </span>
              <Badge variant="secondary">{currentData.leads.length}</Badge>
            </div>
            <ChevronDown className="h-4 w-4" />
          </Button>
        </SheetTrigger>

        <SheetContent side="bottom" className="h-[50vh]">
          <SheetHeader>
            <SheetTitle>Seleccionar Estado</SheetTitle>
          </SheetHeader>
          <div className="grid grid-cols-1 gap-2 mt-4">
            {(Object.keys(groupedLeads) as SimplifiedStatus[]).map((status) => {
              const data = groupedLeads[status];
              return (
                <Button
                  key={status}
                  variant={selectedStatus === status ? 'default' : 'outline'}
                  className="justify-start h-auto p-3"
                  onClick={() => {
                    setSelectedStatus(status);
                    setSelectorOpen(false);
                  }}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-3 h-3 rounded-full", data.color)} />
                      <span>{data.title}</span>
                    </div>
                    <Badge variant="secondary">
                      {data.leads.length}
                    </Badge>
                  </div>
                </Button>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>

      {/* Lead Cards List */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {currentData.leads.map((lead: any) => (
          <LeadCardCompact
            key={lead.id}
            lead={lead}
            onOpenDetails={onOpenDetails}
          />
        ))}
        {currentData.leads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No hay leads en este estado
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
