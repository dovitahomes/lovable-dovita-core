import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useOpportunities, useCreateOpportunity, useUpdateOpportunity, useDeleteOpportunity, useLinkOpportunityUnit, useUnlinkOpportunityUnit, type OpportunityStage } from "@/hooks/crm/useOpportunities";
import { useOpportunityUnits } from "@/hooks/crm/useOpportunities";
import { useAccounts } from "@/hooks/crm/useAccounts";
import { useContacts } from "@/hooks/crm/useContacts";
import { useUnits } from "@/hooks/crm/useUnits";
import { OpportunityKanban, STAGE_CONFIG } from "@/components/crm/OpportunityKanban";
import { OpportunitiesDashboard } from "@/components/opportunities/OpportunitiesDashboard";
import { OpportunityForecasting } from "@/components/opportunities/OpportunityForecasting";
import { AttachmentsTab } from "@/components/crm/AttachmentsTab";
import { Plus, Search, LayoutGrid, List, DollarSign, Building2, User, Calendar, Trash2, Link as LinkIcon, X, BarChart3, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/datetime";
import { Card, CardContent } from "@/components/ui/card";

export default function Opportunities() {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<'pipeline' | 'dashboard' | 'forecast'>('pipeline');
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [selectedStage, setSelectedStage] = useState<OpportunityStage | "">("");
  const [selectedOpp, setSelectedOpp] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [linkUnitsOpen, setLinkUnitsOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    stage: "prospecto" as OpportunityStage,
    amount: "",
    probability: "10",
    expected_close_date: "",
    account_id: "",
    contact_id: "",
    notes: ""
  });

  const { data: opportunities = [], isLoading } = useOpportunities(search, selectedStage || undefined);
  const { data: accounts = [] } = useAccounts();
  const { data: contacts = [] } = useContacts();
  const { data: units = [] } = useUnits();
  const { data: linkedUnits = [] } = useOpportunityUnits(selectedOpp?.id);
  
  const createMutation = useCreateOpportunity();
  const updateMutation = useUpdateOpportunity();
  const deleteMutation = useDeleteOpportunity();
  const linkUnitMutation = useLinkOpportunityUnit();
  const unlinkUnitMutation = useUnlinkOpportunityUnit();

  const handleCreate = async () => {
    await createMutation.mutateAsync({
      ...formData,
      amount: formData.amount ? parseFloat(formData.amount) : undefined,
      probability: parseInt(formData.probability)
    } as any);
    setFormOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!selectedOpp) return;
    await updateMutation.mutateAsync({
      id: selectedOpp.id,
      data: {
        ...formData,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        probability: parseInt(formData.probability)
      } as any
    });
    setFormOpen(false);
    setDetailOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta oportunidad?")) return;
    await deleteMutation.mutateAsync(id);
    setDetailOpen(false);
  };

  const handleStageChange = async (opportunityId: string, newStage: OpportunityStage) => {
    const newProbability = STAGE_CONFIG[newStage].probability;
    const updateData: any = { 
      stage: newStage,
      probability: newProbability
    };
    
    if (newStage === 'ganado' || newStage === 'perdido') {
      updateData.closed_date = new Date().toISOString();
    }

    await updateMutation.mutateAsync({
      id: opportunityId,
      data: updateData
    });
  };

  const handleLinkUnit = async (unitId: string) => {
    if (!selectedOpp) return;
    await linkUnitMutation.mutateAsync({ opportunityId: selectedOpp.id, unitId } as any);
  };

  const handleUnlinkUnit = async (unitId: string) => {
    if (!selectedOpp) return;
    await unlinkUnitMutation.mutateAsync({ opportunityId: selectedOpp.id, unitId } as any);
  };

  const openEditForm = (opp: any) => {
    setFormData({
      name: opp.name,
      stage: opp.stage,
      amount: opp.amount?.toString() || "",
      probability: opp.probability?.toString() || "0",
      expected_close_date: opp.expected_close_date || "",
      account_id: opp.account_id || "",
      contact_id: opp.contact_id || "",
      notes: opp.notes || ""
    });
    setDetailOpen(false);
    setFormOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      stage: "prospecto",
      amount: "",
      probability: "10",
      expected_close_date: "",
      account_id: "",
      contact_id: "",
      notes: ""
    });
    setSelectedOpp(null);
  };

  const totalLinkedUnitsValue = linkedUnits.reduce((sum, lu) => sum + ((lu.units as any)?.price || 0), 0);

  return (
    <div className="container mx-auto p-6 space-y-6 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Oportunidades</h1>
        <div className="flex gap-2">
          <Dialog open={formOpen} onOpenChange={(open) => { setFormOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Nueva Oportunidad</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{selectedOpp ? "Editar" : "Nueva"} Oportunidad</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Nombre *</Label>
                  <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Etapa *</Label>
                    <Select value={formData.stage} onValueChange={(v) => {
                      const stage = v as OpportunityStage;
                      setFormData({...formData, stage, probability: STAGE_CONFIG[stage].probability.toString()});
                    }}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.entries(STAGE_CONFIG).map(([key, config]) => (
                          <SelectItem key={key} value={key}>{config.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Probabilidad (%)</Label>
                    <Input type="number" min="0" max="100" value={formData.probability} onChange={(e) => setFormData({...formData, probability: e.target.value})} />
                  </div>
                  <div>
                    <Label>Monto</Label>
                    <Input type="number" step="0.01" value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})} />
                  </div>
                  <div>
                    <Label>Cierre Esperado</Label>
                    <Input type="date" value={formData.expected_close_date} onChange={(e) => setFormData({...formData, expected_close_date: e.target.value})} />
                  </div>
                  <div>
                    <Label>Cuenta</Label>
                    <Select value={formData.account_id || "none"} onValueChange={(v) => setFormData({...formData, account_id: v === "none" ? "" : v})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ninguna</SelectItem>
                        {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Contacto</Label>
                    <Select value={formData.contact_id || "none"} onValueChange={(v) => setFormData({...formData, contact_id: v === "none" ? "" : v})}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Ninguno</SelectItem>
                        {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.first_name} {c.last_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Notas</Label>
                  <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setFormOpen(false); resetForm(); }}>Cancelar</Button>
                <Button onClick={selectedOpp ? handleUpdate : handleCreate}>{selectedOpp ? "Actualizar" : "Crear"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="pipeline" className="flex items-center gap-2">
            <LayoutGrid className="h-4 w-4" />
            Pipeline
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Forecast
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="flex-1 flex flex-col space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar oportunidades..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === 'kanban' ? 'list' : 'kanban')}>
              {viewMode === 'kanban' ? <List className="h-4 w-4" /> : <LayoutGrid className="h-4 w-4" />}
            </Button>
            {viewMode === 'list' && (
              <Select value={selectedStage || "all"} onValueChange={(v) => setSelectedStage(v === "all" ? "" : v as OpportunityStage)}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Todas las etapas" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {Object.entries(STAGE_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {viewMode === 'kanban' ? (
            <OpportunityKanban
              opportunities={opportunities}
              isLoading={isLoading}
              onOpportunityClick={(opp) => { setSelectedOpp(opp); setDetailOpen(true); }}
              onStageChange={handleStageChange}
            />
          ) : (
            <div className="space-y-2">
              {isLoading ? (
                Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-20" />)
              ) : opportunities.length === 0 ? (
                <Card className="p-8 text-center text-muted-foreground">Sin oportunidades</Card>
              ) : (
                opportunities.map(opp => (
                  <Card key={opp.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => { setSelectedOpp(opp); setDetailOpen(true); }}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{opp.name}</h3>
                            <Badge variant="outline">{opp.folio}</Badge>
                            <Badge>{STAGE_CONFIG[opp.stage as OpportunityStage].label}</Badge>
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            {opp.accounts?.name && <span><Building2 className="h-3 w-3 inline mr-1" />{opp.accounts.name}</span>}
                            {opp.amount && <span className="text-primary font-semibold"><DollarSign className="h-3 w-3 inline" />{new Intl.NumberFormat('es-MX', {style: 'currency', currency: 'MXN'}).format(opp.amount)}</span>}
                            <span>{opp.probability}%</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="dashboard" className="flex-1">
          <OpportunitiesDashboard />
        </TabsContent>

        <TabsContent value="forecast" className="flex-1">
          <OpportunityForecasting />
        </TabsContent>
      </Tabs>

      {/* Detail Dialog */}
      {selectedOpp && (
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle>{selectedOpp.name}</DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{selectedOpp.folio}</Badge>
                    <Badge>{STAGE_CONFIG[selectedOpp.stage as OpportunityStage].label}</Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEditForm(selectedOpp)}>Editar</Button>
                  <Button size="sm" variant="outline" onClick={() => handleDelete(selectedOpp.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            </DialogHeader>
            <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Información</TabsTrigger>
                <TabsTrigger value="units">Unidades ({linkedUnits.length})</TabsTrigger>
                <TabsTrigger value="attachments">Adjuntos</TabsTrigger>
              </TabsList>
              <TabsContent value="info" className="flex-1 overflow-auto space-y-4 p-4">
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Monto</Label><p className="text-lg font-semibold text-primary">{selectedOpp.amount ? new Intl.NumberFormat('es-MX', {style: 'currency', currency: 'MXN'}).format(selectedOpp.amount) : '-'}</p></div>
                  <div><Label>Probabilidad</Label><p>{selectedOpp.probability}%</p></div>
                  <div><Label>Cierre Esperado</Label><p>{selectedOpp.expected_close_date || '-'}</p></div>
                  <div><Label>Cuenta</Label><p>{selectedOpp.account?.name || '-'}</p></div>
                  <div><Label>Contacto</Label><p>{selectedOpp.contact ? `${selectedOpp.contact.first_name} ${selectedOpp.contact.last_name}` : '-'}</p></div>
                  <div><Label>Creado</Label><p>{formatDateTime(selectedOpp.created_at)}</p></div>
                  {selectedOpp.notes && (<div className="col-span-3"><Label>Notas</Label><p className="whitespace-pre-wrap">{selectedOpp.notes}</p></div>)}
                </div>
              </TabsContent>
              <TabsContent value="units" className="flex-1 overflow-auto p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Unidades Vinculadas</h3>
                    <p className="text-sm text-muted-foreground">Total: {new Intl.NumberFormat('es-MX', {style: 'currency', currency: 'MXN'}).format(totalLinkedUnitsValue)}</p>
                  </div>
                  <Dialog open={linkUnitsOpen} onOpenChange={setLinkUnitsOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm"><LinkIcon className="h-4 w-4 mr-2" />Vincular Unidad</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Vincular Unidades</DialogTitle></DialogHeader>
                      <div className="space-y-2 max-h-[400px] overflow-auto">
                        {units.filter(u => !linkedUnits.some(lu => lu.unit_id === u.id)).map(unit => (
                          <Card key={unit.id} className="p-3 cursor-pointer hover:bg-accent" onClick={() => { handleLinkUnit(unit.id); setLinkUnitsOpen(false); }}>
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{unit.unit_number}</p>
                                <p className="text-sm text-muted-foreground">{unit.unit_type} • {unit.status}</p>
                              </div>
                              {unit.price && <p className="font-semibold text-primary">{new Intl.NumberFormat('es-MX', {style: 'currency', currency: 'MXN'}).format(unit.price)}</p>}
                            </div>
                          </Card>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {linkedUnits.length === 0 ? (
                  <Card className="p-8 text-center text-muted-foreground">Sin unidades vinculadas</Card>
                ) : (
                  <div className="grid gap-2">
                    {linkedUnits.map(lu => {
                      const unit = lu.units as any;
                      return (
                      <Card key={lu.id} className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{unit?.unit_number}</p>
                            <p className="text-sm text-muted-foreground">{unit?.unit_type} • {unit?.status}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {unit?.price && <p className="font-semibold text-primary">{new Intl.NumberFormat('es-MX', {style: 'currency', currency: 'MXN'}).format(unit.price)}</p>}
                            <Button size="sm" variant="ghost" onClick={() => handleUnlinkUnit(lu.unit_id)}><X className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </Card>
                    )})}

                  </div>
                )}
              </TabsContent>
              <TabsContent value="attachments" className="flex-1 overflow-auto p-4">
                <AttachmentsTab entityType="opportunity" entityId={selectedOpp.id} />
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
