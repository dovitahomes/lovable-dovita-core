import { useState, useMemo } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, AlertCircle, Clock, CheckCircle2, LayoutGrid, Table as TableIcon, Download, Upload, FileDown } from "lucide-react";
import { LeadDialog } from "@/components/forms/LeadDialog";
import { KanbanColumn } from "@/components/leads/KanbanColumn";
import { LeadCard } from "@/components/leads/LeadCard";
import { LeadsTableView } from "@/components/leads/LeadsTableView";
import { LeadFiltersComponent } from "@/components/leads/LeadFilters";
import { LeadsDashboard } from "@/components/leads/LeadsDashboard";
import { LeadsForecasting } from "@/components/leads/LeadsForecasting";
import { ImportLeadsDialog } from "@/components/crm/ImportLeadsDialog";
import { ExportLeadsDialog } from "@/components/crm/ExportLeadsDialog";
import { downloadLeadsTemplate } from "@/utils/exports/leadsExport";
import { useLeadsByStatus, useUpdateLeadStatus, type LeadStatus } from "@/hooks/useLeads";
import { useCrmActivities } from "@/hooks/crm/useCrmActivities";
import { LeadFilters, getEmptyFilters } from "@/lib/leadFilters";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const COLUMNS: { status: LeadStatus; title: string; color: string }[] = [
  { status: "nuevo", title: "Nuevo", color: "bg-gray-500" },
  { status: "contactado", title: "Contactado", color: "bg-blue-500" },
  { status: "calificado", title: "Calificado", color: "bg-yellow-500" },
  { status: "propuesta", title: "Propuesta", color: "bg-purple-500" },
  { status: "negociacion", title: "Negociación", color: "bg-orange-500" },
  { status: "ganado", title: "Ganado", color: "bg-green-500" },
  { status: "convertido", title: "Convertido", color: "bg-teal-500" },
  { status: "perdido", title: "Perdido", color: "bg-red-500" },
];

export default function Leads() {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<'pipeline' | 'dashboard' | 'forecast'>('pipeline');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [filters, setFilters] = useState<LeadFilters>(getEmptyFilters());
  const [createOpen, setCreateOpen] = useState(false);
  const [activeDragLead, setActiveDragLead] = useState<any>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  const updateStatusMutation = useUpdateLeadStatus();

  // Fetch leads for each column with filters
  const nuevoQuery = useLeadsByStatus("nuevo", search, filters);
  const contactadoQuery = useLeadsByStatus("contactado", search, filters);
  const calificadoQuery = useLeadsByStatus("calificado", search, filters);
  const propuestaQuery = useLeadsByStatus("propuesta", search, filters);
  const negociacionQuery = useLeadsByStatus("negociacion", search, filters);
  const ganadoQuery = useLeadsByStatus("ganado", search, filters);
  const convertidoQuery = useLeadsByStatus("convertido", search, filters);
  const perdidoQuery = useLeadsByStatus("perdido", search, filters);

  const columnQueries: Record<LeadStatus, any> = {
    nuevo: nuevoQuery,
    contactado: contactadoQuery,
    calificado: calificadoQuery,
    propuesta: propuestaQuery,
    negociacion: negociacionQuery,
    ganado: ganadoQuery,
    convertido: convertidoQuery,
    perdido: perdidoQuery,
  };

  // Calculate total leads for filters counter
  const totalLeads = useMemo(() => {
    return (nuevoQuery.data?.length || 0) +
      (contactadoQuery.data?.length || 0) +
      (calificadoQuery.data?.length || 0) +
      (propuestaQuery.data?.length || 0) +
      (negociacionQuery.data?.length || 0) +
      (ganadoQuery.data?.length || 0) +
      (convertidoQuery.data?.length || 0) +
      (perdidoQuery.data?.length || 0);
  }, [nuevoQuery.data, contactadoQuery.data, calificadoQuery.data, propuestaQuery.data, negociacionQuery.data, ganadoQuery.data, convertidoQuery.data, perdidoQuery.data]);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const allLeads = [
      ...(nuevoQuery.data || []),
      ...(contactadoQuery.data || []),
      ...(calificadoQuery.data || []),
      ...(propuestaQuery.data || []),
      ...(negociacionQuery.data || []),
      ...(ganadoQuery.data || []),
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
        <h1 className="text-2xl md:text-3xl font-bold">Leads & Oportunidades</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size={isMobile ? "icon" : "default"}
            onClick={() => downloadLeadsTemplate()}
            className="gap-2"
          >
            <FileDown className="h-4 w-4" />
            {!isMobile && "Plantilla"}
          </Button>
          <Button
            variant="outline"
            size={isMobile ? "icon" : "default"}
            onClick={() => setShowImportDialog(true)}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {!isMobile && "Importar"}
          </Button>
          <Button
            variant="outline"
            size={isMobile ? "icon" : "default"}
            onClick={() => setShowExportDialog(true)}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            {!isMobile && "Exportar"}
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nuevo Lead
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <TabsList>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="forecast">Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="flex-1 flex flex-col space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded-lg p-1">
              <Button size="sm" variant={viewMode === 'kanban' ? 'default' : 'ghost'} onClick={() => setViewMode('kanban')} className="h-8 px-3">
                <LayoutGrid className="h-4 w-4 mr-2" />Kanban
              </Button>
              <Button size="sm" variant={viewMode === 'table' ? 'default' : 'ghost'} onClick={() => setViewMode('table')} className="h-8 px-3">
                <TableIcon className="h-4 w-4 mr-2" />Tabla
              </Button>
            </div>
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

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <LeadFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          totalLeads={totalLeads}
          filteredLeads={totalLeads}
        />
      </div>

      {/* View Content */}
      {viewMode === 'kanban' ? (
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
                  onConvert={() => {}}
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
      ) : (
        <div className="flex-1 overflow-auto">
          <LeadsTableView search={search} filters={filters} />
        </div>
      )}

        </TabsContent>

        <TabsContent value="dashboard" className="flex-1">
          <LeadsDashboard />
        </TabsContent>

        <TabsContent value="forecast" className="flex-1">
          <LeadsForecasting />
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      <LeadDialog open={createOpen} onOpenChange={setCreateOpen} />
      
      <ImportLeadsDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
      />
      
      <ExportLeadsDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        leads={[
          ...(nuevoQuery.data || []),
          ...(contactadoQuery.data || []),
          ...(calificadoQuery.data || []),
          ...(propuestaQuery.data || []),
          ...(negociacionQuery.data || []),
          ...(ganadoQuery.data || []),
          ...(convertidoQuery.data || []),
          ...(perdidoQuery.data || []),
        ]}
        totalCount={totalLeads}
      />
    </div>
  );
}
