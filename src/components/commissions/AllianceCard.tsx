import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Handshake, TrendingUp, Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AllianceCardProps {
  alliance: {
    id: string;
    nombre: string;
    tipo: string;
    comision_porcentaje: number;
    activa: boolean;
    totalGenerado: number;
    totalPendiente: number;
    totalPagado: number;
    numeroComisiones: number;
  };
  onClick: (allianceId: string) => void;
}

export function AllianceCard({ alliance, onClick }: AllianceCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Card
      className="group hover:shadow-lg transition-all duration-300 cursor-pointer animate-fade-in"
      onClick={() => onClick(alliance.id)}
    >
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white font-bold text-lg shrink-0">
            {getInitials(alliance.nombre)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                  {alliance.nombre}
                </h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs">
                    {alliance.tipo}
                  </Badge>
                  <Badge
                    className={cn(
                      "text-xs",
                      alliance.activa
                        ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400"
                    )}
                  >
                    {alliance.activa ? "Activa" : "Inactiva"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {alliance.comision_porcentaje}% comisión
                  </span>
                </div>
              </div>
              
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 mt-4">
              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <TrendingUp className="h-3 w-3" />
                  <span>Total Generado</span>
                </div>
                <p className="text-lg font-bold text-foreground">
                  ${alliance.totalGenerado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Pendiente</span>
                </div>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">
                  ${alliance.totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3" />
                  <span>Pagado</span>
                </div>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  ${alliance.totalPagado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Handshake className="h-3 w-3" />
                  <span>Comisiones</span>
                </div>
                <p className="text-lg font-bold text-foreground">
                  {alliance.numeroComisiones}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
