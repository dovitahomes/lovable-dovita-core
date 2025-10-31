import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { GanttToolbar } from "@/components/gantt/GanttToolbar";
import { GanttGrid } from "@/components/gantt/GanttGrid";
import { GanttMinistrations } from "@/components/gantt/GanttMinistrations";
import { GanttSummary } from "@/components/gantt/GanttSummary";
import { useGanttPlanByProject, useUpsertGanttPlan, useShareGanttWithConstruction } from "@/hooks/useGanttPlan";
import { useBudgetMajors } from "@/hooks/useBudgetMajors";
import { useCorporateContent } from "@/hooks/useCorporateContent";
import { calculateGanttWeeks } from "@/utils/ganttTime";
import { exportGanttToPDF } from "@/utils/pdf/ganttExport";
import type { GanttItem, GanttMinistration } from "@/hooks/useGanttPlan";

export default function GanttPlan() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [ganttType, setGanttType] = useState<"parametrico" | "ejecutivo">("parametrico");
  const [items, setItems] = useState<(GanttItem & { tu_nodes?: any; mayor?: any })[]>([]);
  const [ministrations, setMinistrations] = useState<GanttMinistration[]>([]);
  const [showMinistrationDialog, setShowMinistrationDialog] = useState(false);
  const [newMinistration, setNewMinistration] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    label: "",
    alcance: "",
    percent: "",
    accumulated_percent: "",
  });
  const [availableMajors, setAvailableMajors] = useState<any[]>([]);

  // Hooks
  const { data: ganttPlan } = useGanttPlanByProject(selectedProject, ganttType);
  const { data: budgetMajors, isLoading: majorsLoading } = useBudgetMajors(selectedProject);
  const { data: corporateData } = useCorporateContent();
  const upsertMutation = useUpsertGanttPlan();
  const shareMutation = useShareGanttWithConstruction();

  // Load projects
  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    const { data } = await supabase
      .from("projects")
      .select("id, clients(name)")
      .order("created_at", { ascending: false });
    setProjects(data || []);
  };

  // Load gantt plan when project/type changes
  useEffect(() => {
    if (ganttPlan) {
      loadGanttData(ganttPlan.id);
    } else {
      setItems([]);
      setMinistrations([]);
    }
  }, [ganttPlan]);

  const loadGanttData = async (ganttId: string) => {
    const [itemsRes, ministrationsRes] = await Promise.all([
      supabase.from("gantt_items").select("*, tu_nodes(name, code)").eq("gantt_id", ganttId).order("order_index"),
      supabase.from("gantt_ministrations").select("*").eq("gantt_id", ganttId).order("order_index"),
    ]);

    setItems((itemsRes.data || []) as any);
    setMinistrations((ministrationsRes.data || []) as any);
  };

  // Load available majors (not in current plan)
  useEffect(() => {
    if (budgetMajors) {
      const usedMajorIds = new Set(items.map((i) => i.major_id));
      const available = budgetMajors.filter((m) => !usedMajorIds.has(m.mayor_id));
      setAvailableMajors(available);
    }
  }, [budgetMajors, items]);

  // Calculate timeline from items
  const { timelineStart, timelineEnd, weeks, monthsMap } = useMemo(() => {
    if (items.length === 0) {
      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + 12);
      const weeks = calculateGanttWeeks(start, end);
      return {
        timelineStart: start,
        timelineEnd: end,
        weeks,
        monthsMap: new Map(),
      };
    }

    const dates = items.flatMap((i) => [new Date(i.start_date), new Date(i.end_date)]);
    const start = new Date(Math.min(...dates.map((d) => d.getTime())));
    const end = new Date(Math.max(...dates.map((d) => d.getTime())));
    
    // Add some padding
    start.setDate(start.getDate() - 7);
    end.setDate(end.getDate() + 7);
    
    const weeks = calculateGanttWeeks(start, end);
    
    return {
      timelineStart: start,
      timelineEnd: end,
      weeks,
      monthsMap: new Map<number, any[]>(),
    };
  }, [items]);

  // Merge budget major data with items
  const itemsWithMajors = useMemo(() => {
    return items.map((item) => ({
      ...item,
      mayor: budgetMajors?.find((m) => m.mayor_id === item.major_id),
    }));
  }, [items, budgetMajors]);

  const handleAddMajor = (mayorId: string) => {
    const major = budgetMajors?.find((m) => m.mayor_id === mayorId);
    if (!major) return;

    const newItem: any = {
      major_id: mayorId,
      start_date: format(new Date(), "yyyy-MM-dd"),
      end_date: format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), "yyyy-MM-dd"),
      order_index: items.length,
      tu_nodes: {
        name: major.mayor_name,
        code: "",
      },
    };

    setItems([...items, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleAddMinistration = () => {
    const newM: any = {
      date: newMinistration.date,
      label: newMinistration.label,
      alcance: newMinistration.alcance,
      percent: newMinistration.percent ? parseFloat(newMinistration.percent) : null,
      accumulated_percent: newMinistration.accumulated_percent
        ? parseFloat(newMinistration.accumulated_percent)
        : null,
      order_index: ministrations.length,
    };
    setMinistrations([...ministrations, newM]);
    setShowMinistrationDialog(false);
    setNewMinistration({
      date: format(new Date(), "yyyy-MM-dd"),
      label: "",
      alcance: "",
      percent: "",
      accumulated_percent: "",
    });
  };

  const handleRemoveMinistration = (index: number) => {
    setMinistrations(ministrations.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!selectedProject) {
      toast.error("Selecciona un proyecto");
      return;
    }

    upsertMutation.mutate({
      id: ganttPlan?.id,
      project_id: selectedProject,
      type: ganttType,
      items: items.map((i, idx) => ({
        major_id: i.major_id,
        start_date: i.start_date,
        end_date: i.end_date,
        order_index: idx,
      })),
      ministrations: ministrations.map((m, idx) => ({
        date: m.date,
        label: m.label,
        alcance: m.alcance || "",
        percent: m.percent,
        accumulated_percent: m.accumulated_percent,
        order_index: idx,
      })),
    });
  };

  const handleExportPDF = async () => {
    const selectedProj = projects.find((p) => p.id === selectedProject);
    if (!selectedProj) {
      toast.error("Selecciona un proyecto primero");
      return;
    }

    await exportGanttToPDF({
      projectName: selectedProj.clients?.name || "Sin nombre",
      ganttType,
      items: itemsWithMajors,
      ministrations,
      weeks,
      monthsMap,
      corporateData: corporateData || null,
      timelineStart,
      timelineEnd,
    });

    toast.success("PDF exportado correctamente");
  };

  const handleShare = () => {
    if (!ganttPlan?.id) {
      toast.error("Guarda el cronograma primero");
      return;
    }
    shareMutation.mutate(ganttPlan.id);
  };

  const hasExecutiveBudget = budgetMajors && budgetMajors.length > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Cronograma de Gantt</h1>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver
        </Button>
      </div>

      <Card className="p-6">
        <GanttToolbar
          projects={projects}
          selectedProject={selectedProject}
          onProjectChange={setSelectedProject}
          ganttType={ganttType}
          onTypeChange={setGanttType}
          onSave={handleSave}
          onExportPDF={handleExportPDF}
          onShare={handleShare}
          onAddMinistration={() => setShowMinistrationDialog(true)}
          canShare={ganttType === "ejecutivo"}
        />
      </Card>

      {ganttType === "ejecutivo" && selectedProject && !hasExecutiveBudget && !majorsLoading && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No hay presupuesto ejecutivo publicado para este proyecto
          </AlertDescription>
        </Alert>
      )}

      {selectedProject && hasExecutiveBudget && (
        <>
          <Card className="p-6">
            <div className="mb-4">
              <Label>Añadir Mayor al Cronograma</Label>
              <Select onValueChange={handleAddMajor}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un mayor" />
                </SelectTrigger>
                <SelectContent>
                  {availableMajors.map((major) => (
                    <SelectItem key={major.mayor_id} value={major.mayor_id}>
                      {major.mayor_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <GanttGrid
              items={itemsWithMajors}
              weeks={weeks}
              timelineStart={timelineStart}
              timelineEnd={timelineEnd}
              primaryColor={corporateData?.color_primario || "#1e40af"}
              secondaryColor={corporateData?.color_secundario || "#059669"}
              onRemoveItem={handleRemoveItem}
            />
          </Card>

          <GanttMinistrations
            ministrations={ministrations}
            weeks={weeks}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
            onRemoveMinistration={handleRemoveMinistration}
          />

          <GanttSummary
            ministrations={ministrations}
            timelineStart={timelineStart}
            timelineEnd={timelineEnd}
          />
        </>
      )}

      {/* Ministration Dialog */}
      <Dialog open={showMinistrationDialog} onOpenChange={setShowMinistrationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva Ministración</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fecha</Label>
              <Input
                type="date"
                value={newMinistration.date}
                onChange={(e) => setNewMinistration({ ...newMinistration, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Etiqueta</Label>
              <Input
                value={newMinistration.label}
                onChange={(e) => setNewMinistration({ ...newMinistration, label: e.target.value })}
                placeholder="Ej: Ministración 1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>% Ministración</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newMinistration.percent}
                  onChange={(e) =>
                    setNewMinistration({ ...newMinistration, percent: e.target.value })
                  }
                  placeholder="15.0"
                />
              </div>
              <div>
                <Label>% Acumulado</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newMinistration.accumulated_percent}
                  onChange={(e) =>
                    setNewMinistration({
                      ...newMinistration,
                      accumulated_percent: e.target.value,
                    })
                  }
                  placeholder="15.0"
                />
              </div>
            </div>
            <div>
              <Label>Alcance</Label>
              <Textarea
                value={newMinistration.alcance}
                onChange={(e) =>
                  setNewMinistration({ ...newMinistration, alcance: e.target.value })
                }
                placeholder="Descripción del alcance de esta ministración"
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowMinistrationDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddMinistration}>Agregar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
