import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useConstructionProgress, useUpsertConstructionStage, useDeleteConstructionStage } from "@/hooks/useConstructionStages";
import { Plus, AlertTriangle, Edit, Trash2, TrendingUp } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface ConstructionStagesTabProps {
  projectId: string;
  onSelectStage?: (stageId: string) => void;
}

export function ConstructionStagesTab({ projectId, onSelectStage }: ConstructionStagesTabProps) {
  const { data: progress, isLoading } = useConstructionProgress(projectId);
  const upsertMutation = useUpsertConstructionStage();
  const deleteMutation = useDeleteConstructionStage();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    progress: 0,
  });

  const alertsCount = progress?.filter(p => p.alert_80).length || 0;

  const handleOpenDialog = (stage?: any) => {
    if (stage) {
      setEditingStage(stage);
      setFormData({
        name: stage.name,
        start_date: stage.start_date || "",
        end_date: stage.end_date || "",
        progress: stage.progress || 0,
      });
    } else {
      setEditingStage(null);
      setFormData({ name: "", start_date: "", end_date: "", progress: 0 });
    }
    setDialogOpen(true);
  };

  const handleSave = () => {
    upsertMutation.mutate({
      id: editingStage?.stage_id,
      data: {
        project_id: projectId,
        ...formData,
      },
    });
    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Eliminar esta etapa?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-4">
      {alertsCount > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {alertsCount} etapa(s) ha(n) superado el 80% del presupuesto
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Etapas de Construcción
            </CardTitle>
            <Button onClick={() => handleOpenDialog()} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Etapa
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Cargando etapas...
            </div>
          ) : !progress || progress.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay etapas creadas
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Etapa</TableHead>
                  <TableHead>Fechas</TableHead>
                  <TableHead>Progreso</TableHead>
                  <TableHead>Consumido</TableHead>
                  <TableHead>Presupuestado</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progress.map((stage) => (
                  <TableRow 
                    key={stage.stage_id}
                    className={stage.alert_80 ? "bg-destructive/5" : ""}
                  >
                    <TableCell className="font-medium">{stage.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {stage.start_date && stage.end_date
                        ? `${new Date(stage.start_date).toLocaleDateString('es-MX')} - ${new Date(stage.end_date).toLocaleDateString('es-MX')}`
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={stage.progress} className="w-20" />
                        <span className="text-sm text-muted-foreground">
                          {stage.progress}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(stage.total_consumed)}
                    </TableCell>
                    <TableCell>
                      {new Intl.NumberFormat('es-MX', {
                        style: 'currency',
                        currency: 'MXN',
                      }).format(stage.total_budgeted)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          stage.consumption_pct >= 100
                            ? "destructive"
                            : stage.consumption_pct >= 80
                            ? "secondary"
                            : "default"
                        }
                      >
                        {stage.consumption_pct.toFixed(1)}%
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {stage.alert_80 && (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Alerta
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSelectStage?.(stage.stage_id)}
                        >
                          Ver
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(stage)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(stage.stage_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingStage ? "Editar Etapa" : "Nueva Etapa"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre de la Etapa *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ej: Cimentación"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Fecha Inicio</Label>
                <Input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) =>
                    setFormData({ ...formData, start_date: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Fecha Fin</Label>
                <Input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) =>
                    setFormData({ ...formData, end_date: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <Label>Progreso (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                value={formData.progress}
                onChange={(e) =>
                  setFormData({ ...formData, progress: parseFloat(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formData.name}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
