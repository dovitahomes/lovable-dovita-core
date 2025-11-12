import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { CACHE_CONFIG } from "@/lib/queryConfig";
import { toast } from "sonner";
import { Plus, Search, Download, Upload, AlertTriangle } from "lucide-react";
import { ProviderWizard } from "@/components/providers/ProviderWizard";
import { ProviderEditForm } from "@/components/providers/ProviderEditForm";
import { ProviderDetailsDialogModern } from "@/components/providers/ProviderDetailsDialogModern";
import { ProviderUsageDialog } from "@/components/ProviderUsageDialog";
import { ProviderStatsCards } from "@/components/providers/ProviderStatsCards";
import { ProviderFilters, FilterType } from "@/components/providers/ProviderFilters";
import { ProviderCard } from "@/components/providers/ProviderCard";
import { ProviderImportDialog } from "@/components/providers/ProviderImportDialog";
import { useHardDeleteProvider } from "@/hooks/useHardDeleteProvider";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { exportProvidersToCSV, importProvidersFromCSV } from "@/utils/exports/providersExport";

interface Provider {
  id: string;
  code_short: string;
  name: string;
  fiscales_json?: any;
  terms_json?: any;
  contacto_json?: any;
  activo: boolean;
  created_at: string;
}

export default function Proveedores() {
  const [searchTerm, setSearchTerm] = useState("");
  const [showWizard, setShowWizard] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showUsageDialog, setShowUsageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<{ id: string; isActive: boolean } | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<FilterType[]>([]);

  const queryClient = useQueryClient();
  const debouncedSearch = useDebouncedValue(searchTerm, 300);
  const hardDeleteMutation = useHardDeleteProvider();

  const { data: providers = [], isLoading, error } = useQuery({
    queryKey: ["providers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("providers")
        .select("*")
        .order("name");

      if (error) {
        toast.error("Error al cargar proveedores");
        throw error;
      }
      return data as Provider[];
    },
    ...CACHE_CONFIG.catalogs,
  });

  const filteredProviders = providers.filter((p) => {
    // Search filter
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(term) ||
        p.code_short.toLowerCase().includes(term) ||
        (p.fiscales_json?.rfc && p.fiscales_json.rfc.toLowerCase().includes(term));
      if (!matchesSearch) return false;
    }

    // Apply filters
    if (appliedFilters.length > 0) {
      // Status filters (mutually exclusive)
      const hasStatusFilter = appliedFilters.includes("activos") || appliedFilters.includes("inactivos");
      if (hasStatusFilter) {
        if (appliedFilters.includes("activos") && !p.activo) return false;
        if (appliedFilters.includes("inactivos") && p.activo) return false;
      }

      // Terms filters (mutually exclusive)
      const hasTermsFilter = appliedFilters.includes("con_terminos") || appliedFilters.includes("sin_terminos");
      if (hasTermsFilter) {
        if (appliedFilters.includes("con_terminos") && !p.terms_json) return false;
        if (appliedFilters.includes("sin_terminos") && p.terms_json) return false;
      }
    }

    return true;
  });

  const handleEdit = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowEditForm(true);
  };

  const handleViewDetails = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowDetailsDialog(true);
  };

  const handleViewUsage = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowUsageDialog(true);
  };

  const handleSoftDelete = async () => {
    if (!providerToDelete) return;

    const { error } = await supabase
      .from("providers")
      .update({ activo: false })
      .eq("id", providerToDelete.id);

    if (error) {
      toast.error("Error al desactivar proveedor");
      console.error(error);
    } else {
      toast.success("Proveedor desactivado correctamente");
      queryClient.invalidateQueries({ queryKey: ['providers'] });
    }
    setShowDeleteDialog(false);
    setProviderToDelete(null);
  };

  const handleHardDelete = async () => {
    if (!providerToDelete) return;

    try {
      await hardDeleteMutation.mutateAsync(providerToDelete.id);
      setShowDeleteDialog(false);
      setProviderToDelete(null);
    } catch (error) {
      // Error is already handled by the mutation
    }
  };

  const confirmDelete = (id: string) => {
    const provider = providers.find(p => p.id === id);
    if (!provider) return;
    
    setProviderToDelete({ id, isActive: provider.activo });
    setShowDeleteDialog(true);
  };

  const handleExport = () => {
    exportProvidersToCSV(providers);
  };


  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-3xl font-bold">Proveedores</h1>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
          <Button onClick={() => setShowImportDialog(true)} variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          <Button onClick={() => setShowWizard(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Proveedor
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <ProviderStatsCards />

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar y Filtrar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, código o RFC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <ProviderFilters
            appliedFilters={appliedFilters}
            onFilterChange={setAppliedFilters}
          />
        </CardContent>
      </Card>

      {/* Providers Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="h-48 animate-pulse bg-muted" />
          ))}
        </div>
      ) : error ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Error al cargar proveedores</p>
            <Button
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["providers"] })}
            >
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : filteredProviders.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No se encontraron proveedores</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProviders.map((provider, index) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onEdit={handleEdit}
              onView={handleViewDetails}
              onViewUsage={handleViewUsage}
              onDelete={confirmDelete}
              index={index}
            />
          ))}
        </div>
      )}

      {/* Wizard for creating new providers */}
      <ProviderWizard
        open={showWizard}
        onClose={(shouldReload) => {
          setShowWizard(false);
          if (shouldReload) {
            queryClient.invalidateQueries({ queryKey: ["providers"] });
          }
        }}
        provider={null}
      />

      {/* Edit Form for editing existing providers */}
      <ProviderEditForm
        open={showEditForm}
        onClose={(shouldReload) => {
          setShowEditForm(false);
          setSelectedProvider(null);
          if (shouldReload) {
            queryClient.invalidateQueries({ queryKey: ["providers"] });
          }
        }}
        provider={selectedProvider}
      />

      <ProviderDetailsDialogModern
        open={showDetailsDialog}
        onClose={() => {
          setShowDetailsDialog(false);
          setSelectedProvider(null);
        }}
        provider={selectedProvider}
      />

      <ProviderUsageDialog
        open={showUsageDialog}
        onClose={() => {
          setShowUsageDialog(false);
          setSelectedProvider(null);
        }}
        providerId={selectedProvider?.id || null}
        providerName={selectedProvider?.name}
      />

      <ProviderImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              {providerToDelete?.isActive ? (
                "¿Desactivar proveedor?"
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  ELIMINAR DEFINITIVAMENTE
                </>
              )}
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              {providerToDelete?.isActive ? (
                <p>
                  El proveedor será desactivado y no estará disponible para nuevos presupuestos.
                  Podrás reactivarlo después si lo necesitas.
                </p>
              ) : (
                <>
                  <p className="font-semibold text-red-600 dark:text-red-400">
                    ⚠️ Esta acción NO se puede deshacer.
                  </p>
                  <p>
                    El proveedor será borrado permanentemente de la base de datos.
                    Solo continúa si estás completamente seguro.
                  </p>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={providerToDelete?.isActive ? handleSoftDelete : handleHardDelete}
              className={
                providerToDelete?.isActive
                  ? ""
                  : "bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
              }
            >
              {providerToDelete?.isActive ? "Desactivar" : "Eliminar Permanentemente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
