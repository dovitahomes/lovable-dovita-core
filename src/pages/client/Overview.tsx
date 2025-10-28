import { useMyProjects } from "@/hooks/client/useMyProjects";
import { useClientFinance } from "@/hooks/client/useClientFinance";
import { useNextEvent } from "@/hooks/client/useNextEvent";
import { useRecentActivity } from "@/hooks/client/useRecentActivity";
import { ClientCard } from "@/components/client/ClientCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Calendar, Activity, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { useOutletContext } from "react-router-dom";

export default function Overview() {
  const { projectId: contextProjectId } = useOutletContext<{ projectId: string | null }>();
  const { projects, currentProject, setCurrentProject, isLoading: projectsLoading } = useMyProjects();
  
  const projectId = contextProjectId || currentProject?.id;
  
  const { data: finance, isLoading: financeLoading } = useClientFinance(projectId);
  const { data: nextEvent, isLoading: eventLoading } = useNextEvent(projectId);
  const { data: activities = [], isLoading: activitiesLoading } = useRecentActivity(projectId);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  if (projectsLoading) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-12 w-full rounded-xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <p className="text-slate-500 mb-2">No tienes proyectos asignados</p>
        <p className="text-sm text-slate-400">Contacta a tu asesor para más información</p>
      </div>
    );
  }

  const locationStr = currentProject.ubicacion_json
    ? `${(currentProject.ubicacion_json as any).ciudad || ""}, ${(currentProject.ubicacion_json as any).estado || ""}`.trim()
    : "";

  return (
    <div className="space-y-4 pb-20">
      {/* Project Selector */}
      {projects.length > 1 && (
        <div className="px-4 pt-4">
          <Select value={currentProject.id} onValueChange={setCurrentProject}>
            <SelectTrigger className="w-full h-12 rounded-xl border-slate-200 bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => {
                const loc = project.ubicacion_json
                  ? `${(project.ubicacion_json as any).ciudad || ""}, ${(project.ubicacion_json as any).estado || ""}`.trim()
                  : "";
                return (
                  <SelectItem key={project.id} value={project.id}>
                    <div>
                      <div className="font-medium">{(project.clients as any)?.name || "Proyecto"}</div>
                      {loc && <div className="text-xs text-slate-500">{loc}</div>}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Greeting */}
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Hola, {(currentProject.clients as any)?.name?.split(" ")[0] || "Cliente"} 👋
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          {locationStr || "Tu proyecto en construcción"}
        </p>
      </div>

      <div className="px-4 space-y-4">
        {/* Financial Summary */}
        {financeLoading ? (
          <Skeleton className="h-40 w-full rounded-2xl" />
        ) : finance ? (
          <ClientCard
            title="Saldo del proyecto"
            icon={DollarSign}
            className="bg-gradient-to-br from-blue-50 to-white"
          >
            <div className="space-y-3 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Total depositado</span>
                <span className="font-semibold text-slate-900">{formatCurrency(finance.depositos)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Egresos</span>
                <span className="font-semibold text-slate-900">{formatCurrency(finance.egresos)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between items-center">
                <span className="text-base font-semibold text-slate-900">Saldo</span>
                <span className="text-xl font-bold text-[hsl(var(--dovita-blue))]">
                  {formatCurrency(finance.saldo)}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-[hsl(var(--dovita-blue))] hover:bg-blue-50"
                onClick={() => {
                  const url = new URL(window.location.href);
                  url.searchParams.set("tab", "finanzas");
                  window.history.pushState({}, "", url);
                  window.dispatchEvent(new PopStateEvent("popstate"));
                }}
              >
                Ver Finanzas
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </ClientCard>
        ) : null}

        {/* Next Event */}
        {eventLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : (
          <ClientCard title="Próxima cita" icon={Calendar}>
            {nextEvent ? (
              <div className="mt-2 space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-blue-50 flex flex-col items-center justify-center">
                    <div className="text-xs text-[hsl(var(--dovita-blue))] font-semibold">
                      {format(new Date(nextEvent.start_at), "MMM", { locale: es }).toUpperCase()}
                    </div>
                    <div className="text-lg font-bold text-[hsl(var(--dovita-blue))]">
                      {format(new Date(nextEvent.start_at), "dd")}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900">{nextEvent.title}</p>
                    <p className="text-sm text-slate-500">
                      {format(new Date(nextEvent.start_at), "HH:mm", { locale: es })} -{" "}
                      {format(new Date(nextEvent.end_at), "HH:mm", { locale: es })}
                    </p>
                    {nextEvent.notes && (
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{nextEvent.notes}</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-center py-4">
                <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">Sin citas programadas</p>
              </div>
            )}
          </ClientCard>
        )}

        {/* Recent Activity */}
        {activitiesLoading ? (
          <Skeleton className="h-64 w-full rounded-2xl" />
        ) : (
          <ClientCard title="Actividad reciente" icon={Activity}>
            {activities.length > 0 ? (
              <div className="mt-2 space-y-3">
                {activities.map((activity) => (
                  <button
                    key={activity.id}
                    onClick={() => {
                      const url = new URL(activity.link, window.location.origin);
                      window.history.pushState({}, "", url.pathname + url.search);
                      window.dispatchEvent(new PopStateEvent("popstate"));
                    }}
                    className="w-full flex items-start gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                  >
                    <div className="flex-shrink-0 text-2xl">{activity.icon}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 text-sm">{activity.title}</p>
                      {activity.subtitle && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{activity.subtitle}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1">
                        {format(new Date(activity.date), "dd MMM, HH:mm", { locale: es })}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0 mt-1" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-2 text-center py-6">
                <Activity className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm text-slate-500">No hay actividad reciente</p>
              </div>
            )}
          </ClientCard>
        )}
      </div>
    </div>
  );
}
