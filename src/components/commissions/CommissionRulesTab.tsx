import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, CheckCircle2, XCircle, Globe, Building2 } from "lucide-react";
import { useCommissionRules, useUpsertCommissionRule, useDeleteCommissionRule } from "@/hooks/useCommissionRules";
import { useActiveAlianzas } from "@/hooks/useAlianzas";
import { getRuleScopeDescription } from "@/lib/commissions/matchCommissionRule";
import { Skeleton } from "@/components/ui/skeleton";

interface RuleFormData {
  id?: string;
  name: string;
  project_type: string;
  product: string;
  percent: number;
  applies_on: 'cierre' | 'pago';
  active: boolean;
  alianza_id: string | null;
}

export function CommissionRulesTab() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<RuleFormData | null>(null);

  const { data: rules, isLoading } = useCommissionRules();
  const { data: alianzas } = useActiveAlianzas();
  const upsertMutation = useUpsertCommissionRule();
  const deleteMutation = useDeleteCommissionRule();

  const [formData, setFormData] = useState<RuleFormData>({
    name: "",
    project_type: "",
    product: "",
    percent: 0,
    applies_on: "cierre",
    active: true,
    alianza_id: null,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    upsertMutation.mutate(editingRule ? { ...formData, id: editingRule.id } : formData, {
      onSuccess: () => {
        setIsDialogOpen(false);
        resetForm();
      },
    });
  };

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setFormData({
      id: rule.id,
      name: rule.name,
      project_type: rule.project_type || "",
      product: rule.product || "",
      percent: rule.percent,
      applies_on: rule.applies_on,
      active: rule.active,
      alianza_id: rule.alianza_id,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta regla?")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      project_type: "",
      product: "",
      percent: 0,
      applies_on: "cierre",
      active: true,
      alianza_id: null,
    });
    setEditingRule(null);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Reglas de Comisión</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Regla
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingRule ? "Editar Regla" : "Nueva Regla de Comisión"}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nombre de la Regla</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ej: Comisión Arquitectura"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="project_type">Tipo de Proyecto</Label>
                    <Input
                      id="project_type"
                      value={formData.project_type}
                      onChange={(e) => setFormData({ ...formData, project_type: e.target.value })}
                      placeholder="Ej: arquitectura"
                    />
                  </div>
                  <div>
                    <Label htmlFor="product">Producto</Label>
                    <Input
                      id="product"
                      value={formData.product}
                      onChange={(e) => setFormData({ ...formData, product: e.target.value })}
                      placeholder="Ej: casa-habitacion"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="percent">Porcentaje (%)</Label>
                    <Input
                      id="percent"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.percent}
                      onChange={(e) => setFormData({ ...formData, percent: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="applies_on">Se aplica en</Label>
                    <Select
                      value={formData.applies_on}
                      onValueChange={(value: 'cierre' | 'pago') => setFormData({ ...formData, applies_on: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cierre">Cierre del proyecto</SelectItem>
                        <SelectItem value="pago">Pago recibido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="alianza_id">Aplicar solo a (opcional)</Label>
                  <Select
                    value={formData.alianza_id || "global"}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        alianza_id: value === "global" ? null : value,
                      })
                    }
                  >
                    <SelectTrigger id="alianza_id">
                      <SelectValue placeholder="Seleccionar alcance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Todas las Alianzas (Global)
                        </div>
                      </SelectItem>
                      {alianzas?.map((alianza) => (
                        <SelectItem key={alianza.id} value={alianza.id}>
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            {alianza.nombre}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Si seleccionas una alianza específica, esta regla solo aplicará a comisiones de esa alianza.
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <Label htmlFor="active">Regla activa</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={upsertMutation.isPending}>
                    {upsertMutation.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Alcance</TableHead>
              <TableHead>Tipo Proyecto</TableHead>
              <TableHead>Producto</TableHead>
              <TableHead>%</TableHead>
              <TableHead>Aplica en</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules && rules.length > 0 ? (
              rules.map((rule) => {
                const alianzaName = alianzas?.find((a) => a.id === rule.alianza_id)?.nombre;
                
                return (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium">{rule.name}</TableCell>
                    <TableCell>
                      {rule.alianza_id ? (
                        <Badge variant="secondary" className="gap-1">
                          <Building2 className="h-3 w-3" />
                          {alianzaName || "Alianza específica"}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <Globe className="h-3 w-3" />
                          Global
                        </Badge>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">
                        {getRuleScopeDescription(rule)}
                      </div>
                    </TableCell>
                    <TableCell>{rule.project_type || "-"}</TableCell>
                    <TableCell>{rule.product || "-"}</TableCell>
                    <TableCell className="font-semibold">{rule.percent}%</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {rule.applies_on === 'cierre' ? 'Cierre' : 'Pago'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {rule.active ? (
                        <Badge variant="default" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Activa
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <XCircle className="h-3 w-3" />
                          Inactiva
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(rule)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rule.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground">
                  No hay reglas de comisión configuradas
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
