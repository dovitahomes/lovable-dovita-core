import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Hammer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectExpensesStats } from "@/components/finance/project-expenses/ProjectExpensesStats";
import { MayorConsumptionBars } from "@/components/finance/project-expenses/MayorConsumptionBars";
import { ExpenseTimeline } from "@/components/finance/project-expenses/ExpenseTimeline";

export default function FinanzasConstruccion() {
  const navigate = useNavigate();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Fetch projects for selector
  const { data: projects } = useQuery({
    queryKey: ['projects-for-expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('id, clients(name)')
        .eq('status', 'activo')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container max-w-full mx-auto px-4 sm:px-6 py-6 space-y-6 overflow-x-hidden">
      {/* Header with Back Button */}
      <div className="space-y-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/finanzas')}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a Finanzas
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange-500/10 to-red-500/10">
              <Hammer className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Construcción</h1>
              <p className="text-sm text-muted-foreground">
                Monitoreo de gastos por proyecto y consumo de presupuesto
              </p>
            </div>
          </div>

          {/* Project Selector */}
          <Select value={selectedProjectId || ''} onValueChange={setSelectedProjectId}>
            <SelectTrigger className="w-full sm:w-[280px]">
              <SelectValue placeholder="Seleccionar proyecto..." />
            </SelectTrigger>
            <SelectContent>
              {projects?.map((project) => (
                <SelectItem key={project.id} value={project.id}>
                  {project.clients?.name || `Proyecto ${project.id.slice(0, 8)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <ProjectExpensesStats projectId={selectedProjectId} />

      {/* Consumption Bars & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MayorConsumptionBars projectId={selectedProjectId} />
        <ExpenseTimeline projectId={selectedProjectId} />
      </div>
    </div>
  );
}
