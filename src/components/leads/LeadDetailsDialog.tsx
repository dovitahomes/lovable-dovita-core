import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Building, LayoutGrid, UserPlus, Edit, Loader2, Plus } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { LeadQuickActions } from "./LeadQuickActions";
import { ActivityTimeline } from "./ActivityTimeline";
import { ConvertLeadDialog } from "./ConvertLeadDialog";
import { useCrmActivities } from "@/hooks/crm/useCrmActivities";
import { useTasks } from "@/hooks/crm/useTasks";
import { useUpdateLead } from "@/hooks/useLeads";
import { TaskList } from "@/components/tasks/TaskList";
import { CreateTaskDialog } from "@/components/tasks/CreateTaskDialog";
import { useMemo, useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface LeadDetailsDialogProps {
  lead: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConvert?: () => void;
}

export function LeadDetailsDialog({ lead, open, onOpenChange, onConvert }: LeadDetailsDialogProps) {
  const [notes, setNotes] = useState(lead?.notas || '');
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // ✅ CRÍTICO: Hooks DEBEN llamarse ANTES de cualquier early return
  const { data: activities } = useCrmActivities('lead', lead?.id || '');
  const { data: tasks = [] } = useTasks('', undefined, undefined, 'lead', lead?.id || '');
  const updateLead = useUpdateLead();

  // Sync notes when lead changes
  useEffect(() => {
    if (lead?.notas) {
      setNotes(lead.notas);
    }
  }, [lead?.notas]);

  // Calculate urgency
  const urgencyBadge = useMemo(() => {
    if (!activities || activities.length === 0) return null;
    const lastActivity = activities[0];
    const daysDiff = Math.floor(
      (new Date().getTime() - new Date(lastActivity.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysDiff >= 7) return { label: 'URGENTE', color: 'bg-red-500' };
    if (daysDiff >= 3) return { label: 'SEGUIR', color: 'bg-yellow-500' };
    return { label: 'ACTIVO', color: 'bg-green-500' };
  }, [activities]);

  // Early return DESPUÉS de todos los hooks
  if (!lead) return null;

  const canConvert = ['nuevo', 'contactado', 'propuesta'].includes(lead.status);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleSaveNotes = async () => {
    if (!lead?.id) return;
    await updateLead.mutateAsync({
      leadId: lead.id,
      updates: { notas: notes }
    });
  };

  const InfoField = ({ icon: Icon, label, value }: any) => {
    if (!value) return null;
    return (
      <div>
        <Label className="text-xs text-muted-foreground">{label}</Label>
        <div className="flex items-center gap-2 mt-1">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{value}</span>
        </div>
      </div>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-lg bg-primary/10 text-primary font-semibold">
                  {getInitials(lead.nombre_completo)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <DialogTitle className="text-2xl mb-1">{lead.nombre_completo}</DialogTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={lead.status} />
                  {urgencyBadge && (
                    <Badge className={cn("text-white border-0", urgencyBadge.color)}>
                      {urgencyBadge.label}
                    </Badge>
                  )}
                  {lead.amount && (
                    <Badge variant="secondary" className="font-mono">
                      {formatCurrency(lead.amount)}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </DialogHeader>

          <Tabs defaultValue="info" className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0">
              <TabsTrigger value="info">Información</TabsTrigger>
              <TabsTrigger value="activity">Actividad</TabsTrigger>
              <TabsTrigger value="tasks">Tareas</TabsTrigger>
              <TabsTrigger value="notes">Notas</TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto mt-4">
              <TabsContent value="info" className="space-y-4 m-0">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoField icon={Phone} label="Teléfono" value={lead.telefono} />
                  <InfoField icon={Mail} label="Email" value={lead.email} />
                  <InfoField icon={MapPin} label="Estado" value={lead.estado} />
                  <InfoField icon={Building} label="Sucursal" value={lead.sucursales?.nombre} />
                </div>

                {lead.amount && (
                  <div className="border rounded-lg p-4">
                    <h4 className="text-sm font-semibold mb-3">Oportunidad</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label className="text-xs text-muted-foreground">Valor</Label>
                        <p className="text-2xl font-bold mt-1">{formatCurrency(lead.amount)}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Probabilidad</Label>
                        <p className="text-2xl font-bold mt-1">{lead.probability}%</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Cierre Esperado</Label>
                        <p className="text-sm mt-1">
                          {lead.expected_close_date ? new Date(lead.expected_close_date).toLocaleDateString('es-MX') : '-'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {lead.terreno_m2 && (
                  <InfoField icon={LayoutGrid} label="Terreno" value={`${lead.terreno_m2} m²`} />
                )}

                {lead.origen_lead && lead.origen_lead.length > 0 && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Orígenes del Lead</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {lead.origen_lead.map((origen: string, idx: number) => (
                        <Badge key={idx} variant="outline">{origen}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="activity" className="m-0">
                <Button 
                  variant="outline" 
                  className="w-full mb-4"
                  onClick={() => setTimelineOpen(true)}
                >
                  Ver Timeline Completo
                </Button>
                {activities && activities.length > 0 && (
                  <div className="space-y-3">
                    {activities.slice(0, 5).map((activity) => (
                      <div key={activity.id} className="border rounded-lg p-3">
                        <p className="text-sm font-medium">{activity.description}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true, locale: es })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tasks" className="m-0 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-semibold">Tareas del Lead</h3>
                  <Button size="sm" onClick={() => setShowCreateTask(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Nueva Tarea
                  </Button>
                </div>
                <TaskList
                  tasks={tasks}
                  selectedTaskId={selectedTaskId}
                  onSelectTask={setSelectedTaskId}
                />
              </TabsContent>

              <TabsContent value="notes" className="m-0 space-y-4">
                <Textarea 
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Agregar notas sobre este lead..."
                  className="min-h-[300px]"
                />
                <div className="flex justify-end">
                  <Button 
                    onClick={handleSaveNotes}
                    disabled={updateLead.isPending}
                  >
                    {updateLead.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Guardar Notas
                  </Button>
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="border-t pt-4">
            <div className="flex items-center gap-2 w-full justify-between">
              <LeadQuickActions 
                leadId={lead.id}
                leadName={lead.nombre_completo}
                leadEmail={lead.email}
              />
              {canConvert && (
                <Button onClick={() => setShowConvertDialog(true)} size="lg">
                  <UserPlus className="h-4 w-4 mr-2" />
                  Convertir a Cliente
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ActivityTimeline
        open={timelineOpen}
        onOpenChange={setTimelineOpen}
        leadId={lead.id}
        leadName={lead.nombre_completo}
      />

      <ConvertLeadDialog
        open={showConvertDialog}
        onOpenChange={setShowConvertDialog}
        lead={lead}
      />

      {lead?.id && (
        <CreateTaskDialog
          open={showCreateTask}
          onOpenChange={setShowCreateTask}
          defaultRelatedTo={{
            type: 'lead',
            id: lead.id
          }}
        />
      )}
    </>
  );
}
