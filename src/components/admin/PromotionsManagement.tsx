import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useAllCorporatePromotions,
  useCreateCorporatePromotion,
  useUpdateCorporatePromotion,
  useDeleteCorporatePromotion,
} from "@/hooks/useCorporatePromotions";
import { uploadToBucket } from "@/lib/storage-helpers";
import { toast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, Trash2, Edit2, Plus, Search, Calendar } from "lucide-react";
import { format, isAfter, isBefore } from "date-fns";
import { es } from "date-fns/locale";

export default function PromotionsManagement() {
  const { data: promotions, isLoading } = useAllCorporatePromotions();
  const createMutation = useCreateCorporatePromotion();
  const updateMutation = useUpdateCorporatePromotion();
  const deleteMutation = useDeleteCorporatePromotion();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todas");
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    titulo: "",
    descripcion: "",
    imagen_path: "",
    fecha_inicio: "",
    fecha_fin: "",
    active: true,
  });

  const handleOpenDialog = (promotion?: any) => {
    if (promotion) {
      setEditingPromotion(promotion);
      setFormData({
        titulo: promotion.titulo,
        descripcion: promotion.descripcion || "",
        imagen_path: promotion.imagen_path || "",
        fecha_inicio: promotion.fecha_inicio,
        fecha_fin: promotion.fecha_fin,
        active: promotion.active,
      });
    } else {
      setEditingPromotion(null);
      setFormData({
        titulo: "",
        descripcion: "",
        imagen_path: "",
        fecha_inicio: "",
        fecha_fin: "",
        active: true,
      });
    }
    setDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;

    const file = e.target.files[0];
    
    if (file.size > 3 * 1024 * 1024) {
      toast({
        variant: "destructive",
        description: "La imagen debe pesar menos de 3MB",
      });
      return;
    }

    setUploading(true);

    try {
      const { path } = await uploadToBucket({
        file,
        bucket: 'documentos',
        filename: `promotions/promo-${Date.now()}.${file.name.split('.').pop()}`,
      });

      setFormData({ ...formData, imagen_path: path });
      toast({ description: "Imagen cargada exitosamente" });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        description: "Error al cargar imagen",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData.titulo.trim()) {
      toast({
        variant: "destructive",
        description: "El título es obligatorio",
      });
      return;
    }

    if (!formData.fecha_inicio || !formData.fecha_fin) {
      toast({
        variant: "destructive",
        description: "Las fechas son obligatorias",
      });
      return;
    }

    if (isAfter(new Date(formData.fecha_inicio), new Date(formData.fecha_fin))) {
      toast({
        variant: "destructive",
        description: "La fecha de fin debe ser posterior a la fecha de inicio",
      });
      return;
    }

    try {
      if (editingPromotion) {
        await updateMutation.mutateAsync({
          id: editingPromotion.id,
          updates: formData,
        });
      } else {
        await createMutation.mutateAsync(formData);
      }
      setDialogOpen(false);
      setEditingPromotion(null);
    } catch (error) {
      console.error('Error saving promotion:', error);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getPromotionStatus = (promotion: any) => {
    const today = new Date();
    const startDate = new Date(promotion.fecha_inicio);
    const endDate = new Date(promotion.fecha_fin);

    if (isBefore(endDate, today)) return "vencida";
    if (isAfter(startDate, today)) return "futura";
    return "activa";
  };

  const filteredPromotions = promotions?.filter((promotion) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      promotion.titulo.toLowerCase().includes(search) ||
      promotion.descripcion?.toLowerCase().includes(search);

    const status = getPromotionStatus(promotion);
    const matchesStatus =
      statusFilter === "todas" || status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Promociones Corporativas
              </CardTitle>
              <CardDescription>
                Gestiona las promociones que se muestran en el Dashboard
              </CardDescription>
            </div>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Promoción
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por título o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas</SelectItem>
                <SelectItem value="activa">Activas</SelectItem>
                <SelectItem value="vencida">Vencidas</SelectItem>
                <SelectItem value="futura">Futuras</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            {filteredPromotions && filteredPromotions.length > 0 ? (
              filteredPromotions.map((promotion) => {
                const status = getPromotionStatus(promotion);
                return (
                  <div
                    key={promotion.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors animate-fade-in"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-16 h-16 rounded bg-muted flex items-center justify-center overflow-hidden">
                        <Sparkles className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{promotion.titulo}</h3>
                          <Badge
                            variant={
                              status === "activa"
                                ? "default"
                                : status === "vencida"
                                ? "destructive"
                                : "secondary"
                            }
                          >
                            {status === "activa" && "🟢 Activa"}
                            {status === "vencida" && "🔴 Vencida"}
                            {status === "futura" && "🟡 Futura"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <Calendar className="inline h-3 w-3 mr-1" />
                          {format(new Date(promotion.fecha_inicio), 'dd MMM yyyy', { locale: es })}
                          {" - "}
                          {format(new Date(promotion.fecha_fin), 'dd MMM yyyy', { locale: es })}
                        </p>
                        {promotion.descripcion && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                            {promotion.descripcion}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDialog(promotion)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteId(promotion.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-12">
                <Sparkles className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">
                  {searchTerm || statusFilter !== "todas"
                    ? "No se encontraron promociones con ese criterio"
                    : "No hay promociones configuradas"}
                </p>
                {!searchTerm && statusFilter === "todas" && (
                  <Button onClick={() => handleOpenDialog()} className="mt-4" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Crear Primera Promoción
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPromotion ? "Editar Promoción" : "Nueva Promoción Corporativa"}
            </DialogTitle>
            <DialogDescription>
              {editingPromotion
                ? "Actualiza la información de la promoción"
                : "Crea una nueva promoción para destacar en el Dashboard"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Gran Promoción de Primavera"
                maxLength={100}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                placeholder="Detalles de la promoción..."
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fecha_inicio">Fecha de Inicio *</Label>
                <Input
                  id="fecha_inicio"
                  type="date"
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fecha_fin">Fecha de Fin *</Label>
                <Input
                  id="fecha_fin"
                  type="date"
                  value={formData.fecha_fin}
                  onChange={(e) => setFormData({ ...formData, fecha_fin: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imagen">Imagen de Promoción (Opcional, máx 3MB)</Label>
              <Input
                id="imagen"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
              />
              {uploading && (
                <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
              )}
              {formData.imagen_path && !uploading && (
                <p className="text-sm text-green-600">✓ Imagen cargada exitosamente</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createMutation.isPending || updateMutation.isPending || uploading}
            >
              {editingPromotion ? "Actualizar" : "Crear"} Promoción
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar promoción?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La promoción será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
