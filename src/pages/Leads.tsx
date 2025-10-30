import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { LeadDialog } from "@/components/forms/LeadDialog";
import { ConvertLeadDialog } from "@/components/leads/ConvertLeadDialog";
import { KanbanColumn } from "@/components/leads/KanbanColumn";
import { LeadCard } from "@/components/leads/LeadCard";
import { useLeadsByStatus, useUpdateLeadStatus, type LeadStatus } from "@/hooks/useLeads";

const COLUMNS: { status: LeadStatus; title: string }[] = [
  { status: "nuevo", title: "Nuevo" },
  { status: "contactado", title: "Contactado" },
  { status: "calificado", title: "Calificado" },
  { status: "convertido", title: "Convertido" },
  { status: "perdido", title: "Perdido" },
];

export default function Leads() {
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [convertOpen, setConvertOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [activeDragLead, setActiveDragLead] = useState<any>(null);

  const updateStatusMutation = useUpdateLeadStatus();

  // Fetch leads for each column
  const nuevoQuery = useLeadsByStatus("nuevo", search);
  const contactadoQuery = useLeadsByStatus("contactado", search);
  const calificadoQuery = useLeadsByStatus("calificado", search);
  const convertidoQuery = useLeadsByStatus("convertido", search);
  const perdidoQuery = useLeadsByStatus("perdido", search);

  const columnQueries = {
    nuevo: nuevoQuery,
    contactado: contactadoQuery,
    calificado: calificadoQuery,
    convertido: convertidoQuery,
    perdido: perdidoQuery,
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const allLeads = [
      ...(nuevoQuery.data || []),
      ...(contactadoQuery.data || []),
      ...(calificadoQuery.data || []),
      ...(convertidoQuery.data || []),
      ...(perdidoQuery.data || []),
    ];
    const lead = allLeads.find(l => l.id === active.id);
    setActiveDragLead(lead);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragLead(null);

    if (!over || active.id === over.id) return;

    const newStatus = over.id as LeadStatus;
    updateStatusMutation.mutate({ leadId: active.id as string, status: newStatus });
  };

  const handleConvert = (lead: any) => {
    setSelectedLead(lead);
    setConvertOpen(true);
  };

  return (
    <div className="h-full flex flex-col p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Leads</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Lead
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre, email o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Kanban Board */}
      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex-1 overflow-x-auto">
          <div className="flex gap-4 h-full pb-4">
            {COLUMNS.map(({ status, title }) => (
              <KanbanColumn
                key={status}
                status={status}
                title={title}
                leads={columnQueries[status].data || []}
                isLoading={columnQueries[status].isLoading}
                onConvert={handleConvert}
              />
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeDragLead ? (
            <LeadCard lead={activeDragLead} onConvert={() => {}} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Dialogs */}
      <LeadDialog open={createOpen} onOpenChange={setCreateOpen} />
      
      {selectedLead && (
        <ConvertLeadDialog
          open={convertOpen}
          onOpenChange={setConvertOpen}
          lead={selectedLead}
        />
      )}
    </div>
  );
}
