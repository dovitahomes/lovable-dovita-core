import { useState } from "react";
import { Building2, CheckCircle, FileText, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/common/StatsCard";
import { useProviderStats } from "@/hooks/useProviderStats";
import { useProviders } from "@/hooks/useProviders";
import { Skeleton } from "@/components/ui/skeleton";
import { ProviderStatsDetailDialog } from "./ProviderStatsDetailDialog";
import { ProviderDetailsDialogModern } from "./ProviderDetailsDialogModern";
import { Provider } from "@/hooks/useProviders";

type StatType = "total" | "active" | "withTerms" | "usedInBudgets";

export function ProviderStatsCards() {
  const { data: stats, isLoading } = useProviderStats();
  const { data: allProviders } = useProviders();
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedStat, setSelectedStat] = useState<StatType | null>(null);
  const [showProviderDetails, setShowProviderDetails] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

  const handleStatClick = (statType: StatType) => {
    setSelectedStat(statType);
    setShowDetailDialog(true);
  };

  const handleViewDetails = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowProviderDetails(true);
  };

  const getProvidersForStat = (statType: StatType): Provider[] => {
    if (!stats || !allProviders) return [];
    const providerIds = stats[statType].providerIds;
    return allProviders.filter((p) => providerIds.includes(p.id));
  };

  const getStatTitle = (statType: StatType): string => {
    switch (statType) {
      case "total":
        return "Total de Proveedores";
      case "active":
        return "Proveedores Activos";
      case "withTerms":
        return "Proveedores con Términos Definidos";
      case "usedInBudgets":
        return "Proveedores Usados en Presupuestos";
      default:
        return "";
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!stats) return null;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatsCard
          title="Total Proveedores"
          value={stats.total.count}
          icon={Building2}
          gradient="from-blue-500/10 to-indigo-500/10"
          onClick={() => handleStatClick("total")}
        />
        
        <StatsCard
          title="Activos"
          value={stats.active.count}
          icon={CheckCircle}
          gradient="from-green-500/10 to-emerald-500/10"
          badge={{
            text: "Activos",
            color: "bg-green-500 text-white",
          }}
          onClick={() => handleStatClick("active")}
        />
        
        <StatsCard
          title="Con Términos Definidos"
          value={stats.withTerms.count}
          icon={FileText}
          gradient="from-violet-500/10 to-purple-500/10"
          onClick={() => handleStatClick("withTerms")}
        />
        
        <StatsCard
          title="Usados en Presupuestos"
          value={stats.usedInBudgets.count}
          icon={TrendingUp}
          gradient="from-orange-500/10 to-amber-500/10"
          badge={{
            text: "En uso",
            color: "bg-orange-500 text-white",
          }}
          onClick={() => handleStatClick("usedInBudgets")}
        />
      </div>

      {/* Stats Detail Dialog */}
      {selectedStat && (
        <ProviderStatsDetailDialog
          open={showDetailDialog}
          onClose={() => setShowDetailDialog(false)}
          title={getStatTitle(selectedStat)}
          providers={getProvidersForStat(selectedStat)}
          onViewDetails={handleViewDetails}
        />
      )}

      {/* Provider Details Dialog */}
      {selectedProvider && (
        <ProviderDetailsDialogModern
          open={showProviderDetails}
          onClose={() => setShowProviderDetails(false)}
          provider={selectedProvider}
        />
      )}
    </>
  );
}
