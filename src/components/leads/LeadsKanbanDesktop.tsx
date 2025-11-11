import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { KanbanColumnCompact } from "./KanbanColumnCompact";
import { LeadCardCompact } from "./LeadCardCompact";
import type { LeadStatus } from "@/hooks/useLeads";

interface LeadsKanbanDesktopProps {
  columns: { status: LeadStatus; title: string; color: string }[];
  columnQueries: Record<LeadStatus, any>;
  onDragEnd: (event: DragEndEvent) => void;
  onOpenDetails: (leadId: string) => void;
  activeDragLead: any;
  onDragStart: (event: DragStartEvent) => void;
}

export function LeadsKanbanDesktop({
  columns,
  columnQueries,
  onDragEnd,
  onOpenDetails,
  activeDragLead,
  onDragStart
}: LeadsKanbanDesktopProps) {
  // Agrupar leads por columnas simplificadas
  const groupedLeads = {
    nuevo: columnQueries.nuevo.data || [],
    contactado: [
      ...(columnQueries.contactado.data || []),
      ...(columnQueries.calificado.data || [])
    ],
    propuesta: [
      ...(columnQueries.propuesta.data || []),
      ...(columnQueries.negociacion.data || [])
    ],
    convertido: [
      ...(columnQueries.convertido.data || []),
      ...(columnQueries.ganado.data || [])
    ],
    perdido: columnQueries.perdido.data || []
  };

  const isLoading = Object.values(columnQueries).some(q => q.isLoading);

  return (
    <DndContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
      {/* Primera fila: Nuevo, Contactado, Propuesta */}
      <div className="grid grid-cols-3 gap-4 h-[55vh] mb-4">
        <KanbanColumnCompact
          status="nuevo"
          title="Nuevo"
          leads={groupedLeads.nuevo}
          isLoading={isLoading}
          onOpenDetails={onOpenDetails}
          className="row-span-1"
        />
        <KanbanColumnCompact
          status="contactado"
          title="Contactado"
          leads={groupedLeads.contactado}
          isLoading={isLoading}
          onOpenDetails={onOpenDetails}
          className="row-span-1"
        />
        <KanbanColumnCompact
          status="propuesta"
          title="Propuesta"
          leads={groupedLeads.propuesta}
          isLoading={isLoading}
          onOpenDetails={onOpenDetails}
          className="row-span-1"
        />
      </div>

      {/* Segunda fila: Convertido (2 cols), Perdido (1 col) */}
      <div className="grid grid-cols-3 gap-4 h-[35vh]">
        <KanbanColumnCompact
          status="convertido"
          title="Convertido"
          leads={groupedLeads.convertido}
          isLoading={isLoading}
          onOpenDetails={onOpenDetails}
          className="col-span-2"
        />
        <KanbanColumnCompact
          status="perdido"
          title="Perdido"
          leads={groupedLeads.perdido}
          isLoading={isLoading}
          onOpenDetails={onOpenDetails}
          className="col-span-1"
        />
      </div>

      <DragOverlay>
        {activeDragLead && (
          <LeadCardCompact 
            lead={activeDragLead} 
            isDragging 
            onOpenDetails={() => {}} 
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
