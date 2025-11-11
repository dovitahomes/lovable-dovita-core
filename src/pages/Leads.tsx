import { useState, useMemo } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Search, AlertCircle, Clock, CheckCircle2 } from "lucide-react";
import { LeadDialog } from "@/components/forms/LeadDialog";
import { ConvertLeadDialog } from "@/components/leads/ConvertLeadDialog";
import { ConvertLeadToOpportunityDialog } from "@/components/crm/ConvertLeadToOpportunityDialog";
import { KanbanColumn } from "@/components/leads/KanbanColumn";
import { LeadCard } from "@/components/leads/LeadCard";
import { useLeadsByStatus, useUpdateLeadStatus, type LeadStatus } from "@/hooks/useLeads";
import { useCrmActivities } from "@/hooks/crm/useCrmActivities";
import { cn } from "@/lib/utils";

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
  const [convertToOppOpen, setConvertToOppOpen] = useState(false);
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

  // Get all activities to calculate alerts
  const { data: allActivities } = useCrmActivities();

  // Calculate alert counts
  const alertCounts = useMemo(() => {
    const allLeads = [
      ...(nuevoQuery.data || []),
      ...(contactadoQuery.data || []),
      ...(calificadoQuery.data || []),
    ];

    let urgent = 0;
    let followUp = 0;
    let active = 0;

    allLeads.forEach(lead => {
      const leadActivities = allActivities?.filter(
        a => a.entity_type === 'lead' && a.entity_id === lead.id
      ) || [];
      
      if (leadActivities.length === 0) {
        urgent++;
        return;
      }

      const lastActivity = leadActivities[0];
      const daysDiff = Math.floor(
        (new Date().getTime() - new Date(lastActivity.created_at).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff >= 7) urgent++;
      else if (daysDiff >= 3) followUp++;
      else active++;
    });

    return { urgent, followUp, active };
  }, [nuevoQuery.data, contactadoQuery.data, calificadoQuery.data, allActivities]);
  
  return (
    <div className="h-full flex flex-col p-4 md:p-6 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold">Leads</h1>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nuevo Lead
        </Button>
      </div>

      {/* Alerts Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Requieren Atención</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                  {alertCounts.urgent}
                </p>
                <p className="text-xs text-muted-foreground">+7 días sin contacto</p>
              </div>
              <div className={cn(
                "h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center",
                alertCounts.urgent > 0 && "animate-pulse"
              )}>
                <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Necesitan Seguimiento</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {alertCounts.followUp}
                </p>
                <p className="text-xs text-muted-foreground">3-6 días sin contacto</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Activos</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {alertCounts.active}
                </p>
                <p className="text-xs text-muted-foreground">Contacto reciente</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>
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
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 h-full min-w-max">
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
        <>
          <ConvertLeadDialog
            open={convertOpen}
            onOpenChange={setConvertOpen}
            lead={selectedLead}
          />
          <ConvertLeadToOpportunityDialog
            open={convertToOppOpen}
            onOpenChange={setConvertToOppOpen}
            lead={selectedLead}
          />
        </>
      )}
    </div>
  );
}
