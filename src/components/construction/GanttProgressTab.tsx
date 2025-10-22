import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { format, differenceInDays } from "date-fns";

interface GanttProgressTabProps {
  projectId: string;
}

export function GanttProgressTab({ projectId }: GanttProgressTabProps) {
  const [ganttPlan, setGanttPlan] = useState<any>(null);
  const [ganttItems, setGanttItems] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<string[]>([]);

  useEffect(() => {
    loadGanttData();
  }, [projectId]);

  const loadGanttData = async () => {
    const { data: plan } = await supabase
      .from("gantt_plans")
      .select("*")
      .eq("project_id", projectId)
      .eq("type", "ejecutivo")
      .eq("shared_with_construction", true)
      .maybeSingle();

    if (!plan) return;

    setGanttPlan(plan);

    const { data: items } = await supabase
      .from("gantt_items")
      .select("*, tu_nodes(code, name)")
      .eq("gantt_id", plan.id)
      .order("order_index");

    setGanttItems(items || []);

    // Check for overdue items
    const today = new Date();
    const newAlerts: string[] = [];
    
    items?.forEach((item) => {
      const endDate = new Date(item.end_date);
      const daysUntilEnd = differenceInDays(endDate, today);
      
      if (daysUntilEnd < 0) {
        newAlerts.push(`${item.tu_nodes.name} está vencido por ${Math.abs(daysUntilEnd)} días`);
      } else if (daysUntilEnd <= 7) {
        newAlerts.push(`${item.tu_nodes.name} vence en ${daysUntilEnd} días`);
      }
    });

    setAlerts(newAlerts);
  };

  if (!ganttPlan) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No hay cronograma ejecutivo compartido para este proyecto
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {alerts.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <ul className="list-disc list-inside">
              {alerts.map((alert, idx) => (
                <li key={idx}>{alert}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cronograma del Proyecto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {ganttItems.map((item) => {
              const today = new Date();
              const startDate = new Date(item.start_date);
              const endDate = new Date(item.end_date);
              const totalDays = differenceInDays(endDate, startDate);
              const daysElapsed = differenceInDays(today, startDate);
              const progress = Math.min(100, Math.max(0, (daysElapsed / totalDays) * 100));
              const isOverdue = today > endDate;
              const isNearDeadline = differenceInDays(endDate, today) <= 7 && !isOverdue;

              return (
                <div key={item.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-sm text-primary mr-2">
                        {item.tu_nodes.code}
                      </span>
                      <span className="font-semibold">{item.tu_nodes.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(startDate, "dd/MM/yyyy")} - {format(endDate, "dd/MM/yyyy")}
                    </div>
                  </div>
                  <div className="relative h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 left-0 h-full rounded-full transition-all ${
                        isOverdue
                          ? "bg-destructive"
                          : isNearDeadline
                          ? "bg-yellow-500"
                          : "bg-primary"
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {progress.toFixed(0)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
