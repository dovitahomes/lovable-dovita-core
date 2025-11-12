import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTUStats } from "@/hooks/useTUStats";
import { 
  FolderTree, 
  Folder, 
  FileText, 
  ListTree,
  Layers
} from "lucide-react";

interface TUStatsCardsProps {
  scopeFilter: 'global' | 'sucursal' | 'proyecto';
}

export function TUStatsCards({ scopeFilter }: TUStatsCardsProps) {
  const { data: stats, isLoading } = useTUStats(scopeFilter);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 sm:p-6">
              <Skeleton className="h-4 w-16 mb-2" />
              <Skeleton className="h-8 w-12 mb-2" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statsConfig = [
    {
      label: "Total Nodos",
      value: stats?.total.count || 0,
      icon: FolderTree,
      gradient: "from-blue-500/10 to-cyan-500/5",
      iconColor: "text-blue-500",
      description: "Todos los conceptos"
    },
    {
      label: "Departamentos",
      value: stats?.departamentos.count || 0,
      icon: Layers,
      gradient: "from-purple-500/10 to-pink-500/5",
      iconColor: "text-purple-500",
      description: "Nivel 1"
    },
    {
      label: "Mayores",
      value: stats?.mayores.count || 0,
      icon: Folder,
      gradient: "from-green-500/10 to-emerald-500/5",
      iconColor: "text-green-500",
      description: "Nivel 2"
    },
    {
      label: "Partidas",
      value: stats?.partidas.count || 0,
      icon: FileText,
      gradient: "from-orange-500/10 to-amber-500/5",
      iconColor: "text-orange-500",
      description: "Nivel 3"
    },
    {
      label: "Subpartidas",
      value: stats?.subpartidas.count || 0,
      icon: ListTree,
      gradient: "from-red-500/10 to-rose-500/5",
      iconColor: "text-red-500",
      description: "Nivel 4"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
      {statsConfig.map((stat, index) => (
        <Card
          key={stat.label}
          className={`bg-gradient-to-br ${stat.gradient} border-border/40 hover:border-border/60 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg animate-fade-in`}
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1">
                  {stat.label}
                </p>
                <p className="text-2xl sm:text-3xl font-bold">
                  {stat.value.toLocaleString()}
                </p>
              </div>
              <div className={`p-2 rounded-lg bg-background/50 ${stat.iconColor}`}>
                <stat.icon className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
