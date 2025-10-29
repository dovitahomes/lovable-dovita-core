import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { VirtualizedProvidersTable } from "@/components/finance/VirtualizedProvidersTable";
import { CACHE_CONFIG } from "@/lib/queryConfig";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { ProviderDialog } from "@/components/forms/ProviderDialog";
import { ProviderDetailsDialog } from "@/components/ProviderDetailsDialog";
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const debouncedSearch = useDebouncedValue(searchTerm, 300);

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

  const filteredProviders = debouncedSearch.trim()
    ? providers.filter((p) => {
        const term = debouncedSearch.toLowerCase();
        return (
          p.name.toLowerCase().includes(term) ||
          p.code_short.toLowerCase().includes(term) ||
          (p.fiscales_json?.rfc && p.fiscales_json.rfc.toLowerCase().includes(term))
        );
      })
    : providers;

  const handleEdit = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowDialog(true);
  };

  const handleViewDetails = (provider: Provider) => {
    setSelectedProvider(provider);
    setShowDetailsDialog(true);
  };

  const handleDelete = async () => {
    if (!providerToDelete) return;

    const { error } = await supabase
      .from("providers")
      .delete()
      .eq("id", providerToDelete);

    if (error) {
      toast.error("Error al eliminar proveedor");
      console.error(error);
    } else {
      toast.success("Proveedor eliminado correctamente");
    }
    setShowDeleteDialog(false);
    setProviderToDelete(null);
  };

  const confirmDelete = (id: string) => {
    setProviderToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDialogSuccess = () => {
    setShowDialog(false);
    setSelectedProvider(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Proveedores</h1>
        <Button onClick={() => setShowDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nuevo Proveedor
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Proveedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, código o RFC..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
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
              onDelete={confirmDelete}
            />
          )}
        </CardContent>
      </Card>

      <ProviderDialog
        open={showDialog}
        onOpenChange={setShowDialog}
      />

      <ProviderDetailsDialog
        open={showDetailsDialog}
        onClose={() => {
          setShowDetailsDialog(false);
          setSelectedProvider(null);
        }}
        provider={selectedProvider}
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
