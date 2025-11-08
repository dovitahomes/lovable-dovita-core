import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  useDesignChangeLogs, 
  useCreateChangeLog, 
  useDeleteChangeLog 
} from "@/hooks/useDesignChangeLogs";
import { useDesignPhases } from "@/hooks/useDesignPhases";
import { ChangeLogDialog } from "./ChangeLogDialog";
import { Plus, Trash2, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";

interface ChangeLogsSectionProps {
  projectId: string;
}

export function ChangeLogsSection({ projectId }: ChangeLogsSectionProps) {
  const [search, setSearch] = useState("");
  const [phaseFilter, setPhaseFilter] = useState<string | undefined>();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  
  const { data: logs, isLoading } = useDesignChangeLogs(projectId, { 
    requested_by: search,
    phase_id: phaseFilter 
  });
  const { data: phases } = useDesignPhases(projectId);
  const createLog = useCreateChangeLog();
  const deleteLog = useDeleteChangeLog();
  
  const [formData, setFormData] = useState({
    meeting_date: new Date().toISOString().split('T')[0],
    phase_id: '',
    requested_by: '',
    changes: [{ area: '', detalle: '' }],
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createLog.mutateAsync({
      project_id: projectId,
      phase_id: formData.phase_id || undefined,
      meeting_date: formData.meeting_date,
      requested_by: formData.requested_by,
      changes_json: formData.changes,
      signed: false,
      notes: formData.notes,
    });
    
    setIsDialogOpen(false);
    setFormData({
      meeting_date: new Date().toISOString().split('T')[0],
      phase_id: '',
      requested_by: '',
      changes: [{ area: '', detalle: '' }],
      notes: '',
    });
  };

  const addChange = () => {
    setFormData(prev => ({
      ...prev,
      changes: [...prev.changes, { area: '', detalle: '' }]
    }));
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Input
          placeholder="Buscar por solicitante..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        
        <Select value={phaseFilter} onValueChange={setPhaseFilter}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Todas las fases" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las fases</SelectItem>
            {phases?.map(phase => (
              <SelectItem key={phase.id} value={phase.id}>
                {phase.phase_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 ml-auto">
              <Plus className="h-4 w-4" />
              Nueva entrada
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva entrada en bitácora</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="meeting_date">Fecha de reunión</Label>
                  <Input
                    id="meeting_date"
                    type="date"
                    value={formData.meeting_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, meeting_date: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="phase">Fase (opcional)</Label>
                  <Select 
                    value={formData.phase_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, phase_id: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar fase" />
                    </SelectTrigger>
                    <SelectContent>
                      {phases?.map(phase => (
                        <SelectItem key={phase.id} value={phase.id}>
                          {phase.phase_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div>
                <Label htmlFor="requested_by">Solicitado por</Label>
                <Input
                  id="requested_by"
                  value={formData.requested_by}
                  onChange={(e) => setFormData(prev => ({ ...prev, requested_by: e.target.value }))}
                  placeholder="Cliente / Interno"
                />
              </div>
              
              <div>
                <Label>Cambios solicitados</Label>
                {formData.changes.map((change, idx) => (
                  <div key={idx} className="grid grid-cols-2 gap-2 mb-2">
                    <Input
                      placeholder="Área"
                      value={change.area}
                      onChange={(e) => {
                        const newChanges = [...formData.changes];
                        newChanges[idx].area = e.target.value;
                        setFormData(prev => ({ ...prev, changes: newChanges }));
                      }}
                    />
                    <Input
                      placeholder="Detalle"
                      value={change.detalle}
                      onChange={(e) => {
                        const newChanges = [...formData.changes];
                        newChanges[idx].detalle = e.target.value;
                        setFormData(prev => ({ ...prev, changes: newChanges }));
                      }}
                    />
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addChange}>
                  + Agregar cambio
                </Button>
              </div>
              
              <div>
                <Label htmlFor="notes">Notas adicionales</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createLog.isPending}>
                  Guardar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Fase</TableHead>
                <TableHead>Solicitado por</TableHead>
                <TableHead>Cambios</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No hay entradas en la bitácora
                  </TableCell>
                </TableRow>
              ) : (
                logs?.map((log: any) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.meeting_date), "dd MMM yyyy", { locale: es })}
                    </TableCell>
                    <TableCell>{log.design_phases?.phase_name || '-'}</TableCell>
                    <TableCell>{log.requested_by || '-'}</TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {log.changes_json.length} cambio(s)
                      </span>
                    </TableCell>
                    <TableCell>
                      {log.firmado ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Firmado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Pendiente</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedLog(log);
                            setShowDetailDialog(true);
                          }}
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteLog.mutate({ id: log.id, projectId })}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ChangeLogDialog
        open={showDetailDialog}
        onOpenChange={setShowDetailDialog}
        changeLog={selectedLog}
        projectId={projectId}
      />
    </div>
  );
}
