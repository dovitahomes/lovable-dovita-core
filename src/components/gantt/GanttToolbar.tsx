import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Save, Download, Share2, Plus } from "lucide-react";

type GanttToolbarProps = {
  projects: { id: string; clients?: { name: string } }[];
  selectedProject: string;
  onProjectChange: (projectId: string) => void;
  ganttType: "parametrico" | "ejecutivo";
  onTypeChange: (type: "parametrico" | "ejecutivo") => void;
  onSave: () => void;
  onExportPDF: () => void;
  onShare: () => void;
  onAddMinistration: () => void;
  canShare: boolean;
};

export function GanttToolbar({
  projects,
  selectedProject,
  onProjectChange,
  ganttType,
  onTypeChange,
  onSave,
  onExportPDF,
  onShare,
  onAddMinistration,
  canShare,
}: GanttToolbarProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label>Proyecto</Label>
          <Select value={selectedProject} onValueChange={onProjectChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un proyecto" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.clients?.name || "Sin nombre"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Tipo de Cronograma</Label>
          <Select value={ganttType} onValueChange={onTypeChange}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="parametrico">Paramétrico</SelectItem>
              <SelectItem value="ejecutivo">Ejecutivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={onSave} className="gap-2">
          <Save className="h-4 w-4" />
          Guardar
        </Button>
        <Button onClick={onExportPDF} variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar PDF
        </Button>
        {canShare && (
          <Button onClick={onShare} variant="outline" className="gap-2">
            <Share2 className="h-4 w-4" />
            Compartir con Construcción
          </Button>
        )}
        <Button onClick={onAddMinistration} variant="outline" className="gap-2">
          <Plus className="h-4 w-4" />
          Añadir Ministración
        </Button>
      </div>
    </div>
  );
}
