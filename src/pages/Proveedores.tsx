import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { VirtualizedProvidersTable } from "@/components/finance/VirtualizedProvidersTable";
import { CACHE_CONFIG } from "@/lib/queryConfig";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Download, Upload, FileBarChart } from "lucide-react";
import { ProviderDialog } from "@/components/ProviderDialog";
import { ProviderDetailsDialog } from "@/components/ProviderDetailsDialog";
import { ProviderUsageDialog } from "@/components/ProviderUsageDialog";
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
import { LoadingError } from "@/components/common/LoadingError";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showUsageDialog, setShowUsageDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [filterHasTerms, setFilterHasTerms] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const { data: providers = [], isLoading, error } = useQuery({
    queryKey: ["providers", showInactive],
    queryFn: async () => {
      let query = supabase.from("providers").select("*");

      if (!showInactive) {
        query = query.eq("activo", true);
      }

      const { data, error } = await query.order("name");

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

    // Has terms filter
    if (filterHasTerms && !p.terms_json) {
      return false;
    }

    return true;
  });

  const handleEdit = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowDialog(true);
  };

  const handleViewDetails = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowDetailsDialog(true);
  };

  const handleViewUsage = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowUsageDialog(true);
  };

  const handleDelete = async () => {
    if (!providerToDelete) return;

    const { error } = await supabase
      .from("providers")
      .update({ activo: false })
      .eq("id", providerToDelete);

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

  const confirmDelete = (id: string) => {
    setProviderToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleExport = () => {
    exportProvidersToCSV(providers);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const result = await importProvidersFromCSV(file);
      toast.success(
        `Importación completada: ${result.created} creados, ${result.updated} actualizados`
      );
      if (result.errors.length > 0) {
        console.error("Errores de importación:", result.errors);
        toast.warning(`${result.errors.length} filas con errores (ver consola)`);
      }
      queryClient.invalidateQueries({ queryKey: ["providers"] });
    } catch (err: any) {
      toast.error("Error al importar: " + err.message);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
          <Button onClick={handleImportClick} variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            Importar
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleImportFile}
            className="hidden"
          />
          <Button onClick={() => setShowDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Proveedor
          </Button>
        </div>
      </div>

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
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive">Mostrar inactivos</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="has-terms"
                checked={filterHasTerms}
                onCheckedChange={setFilterHasTerms}
              />
              <Label htmlFor="has-terms">Solo con términos</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <LoadingError
            isLoading={isLoading}
            error={error}
            isEmpty={filteredProviders.length === 0}
            emptyMessage="No se encontraron proveedores"
            onRetry={() => queryClient.invalidateQueries({ queryKey: ['providers'] })}
          />
          {!isLoading && !error && filteredProviders.length > 0 && (
            <VirtualizedProvidersTable
              providers={filteredProviders}
              onEdit={handleEdit}
              onView={handleViewDetails}
              onViewUsage={handleViewUsage}
              onDelete={confirmDelete}
            />
          )}
        </CardContent>
      </Card>

      <ProviderDialog
        open={showDialog}
        onClose={(shouldReload) => {
          setShowDialog(false);
          setSelectedProvider(null);
          if (shouldReload) {
            queryClient.invalidateQueries({ queryKey: ["providers"] });
          }
        }}
        provider={selectedProvider}
      />

      <ProviderDetailsDialog
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

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar proveedor?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El proveedor será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
