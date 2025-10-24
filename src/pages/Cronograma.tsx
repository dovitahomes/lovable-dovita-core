import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { Calendar, Plus, Trash2, Download, Share2, Save } from "lucide-react";
import { format, addMonths, startOfMonth, eachMonthOfInterval, eachWeekOfInterval, startOfWeek, addWeeks, differenceInDays } from "date-fns";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getGanttDeadlineWarningDays } from "@/utils/businessRules";

interface Project {
  id: string;
  client_id: string;
  clients: { name: string };
}

interface TUNode {
  id: string;
  code: string;
  name: string;
}

interface GanttItem {
  id?: string;
  major_id: string;
  major_name?: string;
  major_code?: string;
  start_date: string;
  end_date: string;
  order_index: number;
}

interface Ministration {
  id?: string;
  date: string;
  label: string;
  alcance: string;
  order_index: number;
}

export default function Cronograma() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [ganttType, setGanttType] = useState<"parametrico" | "ejecutivo">("parametrico");
  const [majors, setMajors] = useState<TUNode[]>([]);
  const [ganttItems, setGanttItems] = useState<GanttItem[]>([]);
  const [ministrations, setMinistrations] = useState<Ministration[]>([]);
  const [timelineStart, setTimelineStart] = useState<Date>(startOfMonth(new Date()));
  const [timelineMonths, setTimelineMonths] = useState(12);
  const [viewMode, setViewMode] = useState<"months" | "weeks">("months");
  const [ganttId, setGanttId] = useState<string | null>(null);
  const [showMinistrationDialog, setShowMinistrationDialog] = useState(false);
  const [newMinistration, setNewMinistration] = useState<Ministration>({
    date: format(new Date(), "yyyy-MM-dd"),
    label: "",
    alcance: "",
    order_index: 0,
  });
  const [corporateData, setCorporateData] = useState<any>(null);
  const [warningDays, setWarningDays] = useState(5);

  useEffect(() => {
    loadProjects();
    loadMajors();
    loadCorporateData();
    loadWarningDays();
  }, []);

  const loadWarningDays = async () => {
    if (selectedProject) {
      const { data: project } = await supabase
        .from("projects")
        .select("sucursal_id")
        .eq("id", selectedProject)
        .maybeSingle();
      
      const days = await getGanttDeadlineWarningDays(selectedProject, project?.sucursal_id);
      setWarningDays(days ?? 5);
    }
  };

  useEffect(() => {
    loadWarningDays();
  }, [selectedProject]);

  const loadProjects = async () => {
    const { data, error } = await supabase
      .from("projects")
      .select("id, client_id, clients(name)")
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar proyectos");
      return;
    }
    setProjects(data || []);
  };

  const loadMajors = async () => {
    // Load majors from "Construcción" department
    const { data: construccionDept } = await supabase
      .from("tu_nodes")
      .select("id")
      .eq("type", "departamento")
      .ilike("name", "%construcción%")
      .maybeSingle();

    if (!construccionDept) {
      toast.error("No se encontró el departamento de Construcción");
      return;
    }

    const { data, error } = await supabase
      .from("tu_nodes")
      .select("id, code, name")
      .eq("type", "mayor")
      .eq("parent_id", construccionDept.id)
      .order("order_index");

    if (error) {
      toast.error("Error al cargar mayores");
      return;
    }
    setMajors(data || []);
  };

  const loadCorporateData = async () => {
    const { data } = await supabase
      .from("contenido_corporativo")
      .select("*")
      .limit(1)
      .maybeSingle();
    setCorporateData(data);
  };

  const getTimelineIntervals = () => {
    const end = addMonths(timelineStart, timelineMonths);
    
    if (viewMode === "months") {
      return eachMonthOfInterval({ start: timelineStart, end });
    } else {
      return eachWeekOfInterval({ start: timelineStart, end });
    }
  };

  const addGanttItem = (majorId: string) => {
    const major = majors.find(m => m.id === majorId);
    if (!major) return;

    const newItem: GanttItem = {
      major_id: majorId,
      major_name: major.name,
      major_code: major.code,
      start_date: format(timelineStart, "yyyy-MM-dd"),
      end_date: format(addMonths(timelineStart, 1), "yyyy-MM-dd"),
      order_index: ganttItems.length,
    };

    setGanttItems([...ganttItems, newItem]);
  };

  const updateGanttItem = (index: number, updates: Partial<GanttItem>) => {
    const updated = [...ganttItems];
    updated[index] = { ...updated[index], ...updates };
    setGanttItems(updated);
  };

  const removeGanttItem = (index: number) => {
    setGanttItems(ganttItems.filter((_, i) => i !== index));
  };

  const addMinistration = () => {
    setMinistrations([...ministrations, { ...newMinistration, order_index: ministrations.length }]);
    setShowMinistrationDialog(false);
    setNewMinistration({
      date: format(new Date(), "yyyy-MM-dd"),
      label: "",
      alcance: "",
      order_index: 0,
    });
  };

  const removeMinistration = (index: number) => {
    setMinistrations(ministrations.filter((_, i) => i !== index));
  };

  const saveGantt = async () => {
    if (!selectedProject) {
      toast.error("Selecciona un proyecto");
      return;
    }

    try {
      let currentGanttId = ganttId;

      if (!currentGanttId) {
        const { data: plan, error: planError } = await supabase
          .from("gantt_plans")
          .insert({
            project_id: selectedProject,
            type: ganttType,
          })
          .select()
          .single();

        if (planError) throw planError;
        currentGanttId = plan.id;
        setGanttId(currentGanttId);
      }

      // Delete existing items and ministrations
      await supabase.from("gantt_items").delete().eq("gantt_id", currentGanttId);
      await supabase.from("gantt_ministrations").delete().eq("gantt_id", currentGanttId);

      // Insert new items
      if (ganttItems.length > 0) {
        const { error: itemsError } = await supabase.from("gantt_items").insert(
          ganttItems.map(item => ({
            gantt_id: currentGanttId,
            major_id: item.major_id,
            start_date: item.start_date,
            end_date: item.end_date,
            order_index: item.order_index,
          }))
        );
        if (itemsError) throw itemsError;
      }

      // Insert new ministrations
      if (ministrations.length > 0) {
        const { error: ministrationsError } = await supabase.from("gantt_ministrations").insert(
          ministrations.map(m => ({
            gantt_id: currentGanttId,
            date: m.date,
            label: m.label,
            alcance: m.alcance,
            order_index: m.order_index,
          }))
        );
        if (ministrationsError) throw ministrationsError;
      }

      toast.success("Cronograma guardado correctamente");
    } catch (error: any) {
      toast.error("Error al guardar: " + error.message);
    }
  };

  const shareWithConstruction = async () => {
    if (!ganttId) {
      toast.error("Guarda el cronograma primero");
      return;
    }

    if (ganttType !== "ejecutivo") {
      toast.error("Solo los cronogramas ejecutivos se pueden compartir con Construcción");
      return;
    }

    try {
      const { error } = await supabase
        .from("gantt_plans")
        .update({ shared_with_construction: true })
        .eq("id", ganttId);

      if (error) throw error;
      toast.success("Cronograma compartido con Construcción");
    } catch (error: any) {
      toast.error("Error al compartir: " + error.message);
    }
  };

  const exportToPDF = async () => {
    const doc = new jsPDF({ orientation: "landscape", format: "letter" });
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header with corporate branding
    if (corporateData?.logo_url) {
      try {
        doc.addImage(corporateData.logo_url, "PNG", 10, 10, 40, 20);
      } catch (e) {
        console.error("Error loading logo");
      }
    }

    doc.setFontSize(18);
    doc.text("Cronograma de Gantt", pageWidth / 2, 20, { align: "center" });

    const selectedProj = projects.find(p => p.id === selectedProject);
    doc.setFontSize(10);
    doc.text(`Proyecto: ${selectedProj?.clients?.name || ""}`, 10, 40);
    doc.text(`Tipo: ${ganttType === "parametrico" ? "Paramétrico" : "Ejecutivo"}`, 10, 45);
    doc.text(`Fecha: ${format(new Date(), "dd/MM/yyyy")}`, 10, 50);

    // Gantt chart data
    const tableData = ganttItems.map(item => [
      item.major_code || "",
      item.major_name || "",
      format(new Date(item.start_date), "dd/MM/yyyy"),
      format(new Date(item.end_date), "dd/MM/yyyy"),
    ]);

    autoTable(doc, {
      startY: 60,
      head: [["Código", "Mayor", "Fecha Inicio", "Fecha Fin"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [30, 64, 175] },
    });

    // Ministrations
    if (ministrations.length > 0) {
      const ministrationsData = ministrations.map(m => [
        format(new Date(m.date), "dd/MM/yyyy"),
        m.label,
        m.alcance || "",
      ]);

      autoTable(doc, {
        startY: (doc as any).lastAutoTable.finalY + 10,
        head: [["Fecha", "Ministración", "Alcance"]],
        body: ministrationsData,
        theme: "grid",
        headStyles: { fillColor: [220, 38, 38] },
      });
    }

    doc.save(`cronograma_${ganttType}_${format(new Date(), "yyyyMMdd")}.pdf`);
    toast.success("PDF exportado correctamente");
  };

  const getBarPosition = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timelineEnd = addMonths(timelineStart, timelineMonths);
    
    const totalDays = (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    const startOffset = (start.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    const duration = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    
    const left = (startOffset / totalDays) * 100;
    const width = (duration / totalDays) * 100;
    
    return { left: `${Math.max(0, left)}%`, width: `${Math.max(0, width)}%` };
  };

  const getMinistrationPosition = (date: string) => {
    const ministrationDate = new Date(date);
    const timelineEnd = addMonths(timelineStart, timelineMonths);
    
    const totalDays = (timelineEnd.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    const offset = (ministrationDate.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    
    return `${(offset / totalDays) * 100}%`;
  };

  const intervals = getTimelineIntervals();
  const availableMajors = majors.filter(m => !ganttItems.some(item => item.major_id === m.id));

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Calendar className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Cronograma de Gantt</h1>
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          Volver
        </Button>
      </div>

      <Card className="p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Proyecto</Label>
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un proyecto" />
              </SelectTrigger>
              <SelectContent>
                {projects.map(project => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.clients?.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tipo de Cronograma</Label>
            <Select value={ganttType} onValueChange={(v) => setGanttType(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parametrico">Paramétrico</SelectItem>
                <SelectItem value="ejecutivo">Ejecutivo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Vista</Label>
            <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="months">Mensual</SelectItem>
                <SelectItem value="weeks">Semanal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2">
          <Button onClick={saveGantt} className="gap-2">
            <Save className="h-4 w-4" />
            Guardar
          </Button>
          <Button onClick={exportToPDF} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar PDF
          </Button>
          {ganttType === "ejecutivo" && (
            <Button onClick={shareWithConstruction} variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Compartir con Construcción
            </Button>
          )}
          <Button onClick={() => setShowMinistrationDialog(true)} variant="outline" className="gap-2">
            <Plus className="h-4 w-4" />
            Añadir Ministración
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="mb-4">
          <Label>Añadir Mayor al Cronograma</Label>
          <Select onValueChange={addGanttItem}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona un mayor" />
            </SelectTrigger>
            <SelectContent>
              {availableMajors.map(major => (
                <SelectItem key={major.id} value={major.id}>
                  {major.code} - {major.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Gantt Chart */}
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Timeline Header */}
            <div className="flex border-b">
              <div className="w-48 flex-shrink-0 p-2 font-semibold bg-muted">Mayor</div>
              <div className="flex-1 flex">
                {intervals.map((interval, idx) => (
                  <div
                    key={idx}
                    className="flex-1 p-2 text-center text-xs border-l bg-muted"
                  >
                    {viewMode === "months"
                      ? format(interval, "MMM yyyy")
                      : format(interval, "dd/MM")}
                  </div>
                ))}
              </div>
            </div>

            {/* Gantt Rows */}
            <div className="relative">
              {ganttItems.map((item, idx) => (
                <div key={idx} className="flex border-b relative h-12 items-center">
                  <div className="w-48 flex-shrink-0 p-2 text-sm font-medium flex items-center justify-between">
                    <span>{item.major_code} - {item.major_name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeGanttItem(idx)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="flex-1 relative h-full">
                    {/* Timeline grid */}
                    <div className="absolute inset-0 flex">
                      {intervals.map((_, i) => (
                        <div key={i} className="flex-1 border-l" />
                      ))}
                    </div>
                     {/* Bar */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="absolute top-2 h-8 bg-primary rounded cursor-pointer flex items-center justify-center gap-1"
                            style={getBarPosition(item.start_date, item.end_date)}
                          >
                            {(() => {
                              const daysUntilEnd = differenceInDays(new Date(item.end_date), new Date());
                              const isNearDeadline = daysUntilEnd <= warningDays && daysUntilEnd >= 0;
                              const isOverdue = daysUntilEnd < 0;
                              
                              if (isOverdue || isNearDeadline) {
                                return <span className="text-white text-xs">⚠️</span>;
                              }
                              return null;
                            })()}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{format(new Date(item.start_date), "dd/MM/yyyy")} - {format(new Date(item.end_date), "dd/MM/yyyy")}</p>
                          {(() => {
                            const daysUntilEnd = differenceInDays(new Date(item.end_date), new Date());
                            if (daysUntilEnd < 0) {
                              return <p className="text-destructive font-semibold">Etapa vencida</p>;
                            } else if (daysUntilEnd <= warningDays) {
                              return <p className="text-orange-500 font-semibold">Etapa por vencer ({daysUntilEnd} días)</p>;
                            }
                            return null;
                          })()}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>
              ))}

              {/* Ministrations (vertical red lines) */}
              {ministrations.map((m, idx) => (
                <div
                  key={idx}
                  className="absolute top-0 bottom-0 w-0.5 bg-destructive pointer-events-none"
                  style={{ left: getMinistrationPosition(m.date) }}
                >
                  <div className="absolute top-0 -translate-x-1/2 -translate-y-full text-xs bg-destructive text-destructive-foreground px-1 rounded pointer-events-auto">
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Ministrations info at bottom */}
            {ministrations.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="font-semibold">Ministraciones:</h3>
                {ministrations.map((m, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm border-l-2 border-destructive pl-2">
                    <div className="flex-1">
                      <span className="font-medium">{m.label}</span> - {format(new Date(m.date), "dd/MM/yyyy")}
                      {m.alcance && <p className="text-muted-foreground">{m.alcance}</p>}
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeMinistration(idx)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Add Ministration Dialog */}
      <Dialog open={showMinistrationDialog} onOpenChange={setShowMinistrationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Añadir Ministración</DialogTitle>
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
            <div>
              <Label>Alcance</Label>
              <Textarea
                value={newMinistration.alcance}
                onChange={(e) => setNewMinistration({ ...newMinistration, alcance: e.target.value })}
                placeholder="Describe el alcance de esta ministración..."
              />
            </div>
            <Button onClick={addMinistration} disabled={!newMinistration.label}>
              Añadir
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
