import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { ProviderDialog } from "@/components/ProviderDialog";
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
  const [providers, setProviders] = useState<Provider[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<Provider[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDialog, setShowDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [providerToDelete, setProviderToDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    filterProviders();
  }, [searchTerm, providers]);

  const loadProviders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("providers")
      .select("*")
      .order("name");

    if (error) {
      toast.error("Error al cargar proveedores");
      console.error(error);
    } else {
      setProviders(data || []);
    }
    setLoading(false);
  };

  const filterProviders = () => {
    if (!searchTerm.trim()) {
      setFilteredProviders(providers);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = providers.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.code_short.toLowerCase().includes(term) ||
        (p.fiscales_json?.rfc && p.fiscales_json.rfc.toLowerCase().includes(term))
    );
    setFilteredProviders(filtered);
  };

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
      loadProviders();
    }
    setShowDeleteDialog(false);
    setProviderToDelete(null);
  };

  const confirmDelete = (id: string) => {
    setProviderToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDialogClose = (shouldReload: boolean) => {
    setShowDialog(false);
    setSelectedProvider(null);
    if (shouldReload) {
      loadProviders();
    }
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
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Cargando...</div>
          ) : filteredProviders.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No se encontraron proveedores
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>RFC</TableHead>
                  <TableHead>Contacto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProviders.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-mono font-semibold">
                      {provider.code_short}
                    </TableCell>
                    <TableCell className="font-medium">{provider.name}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {provider.fiscales_json?.rfc || "-"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {provider.contacto_json?.email || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={provider.activo ? "default" : "secondary"}>
                        {provider.activo ? "Activo" : "Inactivo"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleViewDetails(provider)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(provider)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => confirmDelete(provider.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ProviderDialog
        open={showDialog}
        onClose={handleDialogClose}
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
