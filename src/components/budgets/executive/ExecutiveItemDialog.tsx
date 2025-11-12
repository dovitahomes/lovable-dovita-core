import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useProviders } from "@/hooks/useProviders";
import { Calculator, Package, DollarSign, Building2, CheckCircle, AlertCircle } from "lucide-react";
import { ExecutiveBudgetItem } from "./ExecutiveBudgetWizard";
import { cn } from "@/lib/utils";

interface ExecutiveItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ExecutiveBudgetItem | null;
  onSave: (item: ExecutiveBudgetItem) => void;
  subpartidaName: string;
}

const UNIDADES_COMUNES = [
  "pieza", "metro", "m²", "m³", "kg", "ton", "litro", "ml", 
  "lote", "juego", "caja", "bulto", "rollo", "bolsa"
];

export function ExecutiveItemDialog({
  open,
  onOpenChange,
  item,
  onSave,
  subpartidaName,
}: ExecutiveItemDialogProps) {
  const [currentTab, setCurrentTab] = useState("basico");
  const [formData, setFormData] = useState<ExecutiveBudgetItem>(
    item || {
      mayor_id: "",
      partida_id: "",
      subpartida_id: "",
      descripcion: subpartidaName,
      unidad: "pieza",
      cant_real: 1,
      desperdicio_pct: 0,
      costo_unit: 0,
      honorarios_pct: 0,
      proveedor_alias: "",
      order_index: 0,
    }
  );

  const { data: providers = [] } = useProviders();

  useEffect(() => {
    if (item) {
      setFormData(item);
    } else {
      setFormData({
        mayor_id: "",
        partida_id: "",
        subpartida_id: "",
        descripcion: subpartidaName,
        unidad: "pieza",
        cant_real: 1,
        desperdicio_pct: 0,
        costo_unit: 0,
        honorarios_pct: 0,
        proveedor_alias: "",
        order_index: 0,
      });
    }
    setCurrentTab("basico");
  }, [item, open, subpartidaName]);

  const updateField = (field: keyof ExecutiveBudgetItem, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Calculadora en tiempo real
  const cantNecesaria = formData.cant_real * (1 + formData.desperdicio_pct / 100);
  const precioUnit = formData.costo_unit * (1 + formData.honorarios_pct / 100);
  const totalItem = cantNecesaria * precioUnit;

  // Validaciones progresivas
  const validations = {
    basico: formData.descripcion.trim().length > 0 && formData.unidad.trim().length > 0,
    cantidades: formData.cant_real > 0,
    costos: formData.costo_unit > 0,
    proveedor: true, // Proveedor es opcional
  };

  const allValid = Object.values(validations).every(v => v);

  const handleSave = () => {
    if (!allValid) return;
    onSave(formData);
    onOpenChange(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {item ? "Editar Item" : "Nuevo Item"} - {subpartidaName}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="basico" className="gap-2">
              <Package className="h-4 w-4" />
              Básico
              {validations.basico && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="cantidades" className="gap-2">
              <Calculator className="h-4 w-4" />
              Cantidades
              {validations.cantidades && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="costos" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Costos
              {validations.costos && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger value="proveedor" className="gap-2">
              <Building2 className="h-4 w-4" />
              Proveedor
              {validations.proveedor && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Básico */}
          <TabsContent value="basico" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="descripcion">
                Descripción del Item <span className="text-destructive">*</span>
              </Label>
              <Input
                id="descripcion"
                value={formData.descripcion}
                onChange={(e) => updateField("descripcion", e.target.value)}
                placeholder="Ej: Cemento gris extra"
                className={cn(!validations.basico && formData.descripcion.length === 0 && "border-destructive")}
              />
              {!validations.basico && formData.descripcion.length === 0 && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  La descripción es requerida
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="unidad">
                Unidad de Medida <span className="text-destructive">*</span>
              </Label>
              <Select value={formData.unidad} onValueChange={(val) => updateField("unidad", val)}>
                <SelectTrigger id="unidad">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNIDADES_COMUNES.map(u => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button
                onClick={() => setCurrentTab("cantidades")}
                disabled={!validations.basico}
              >
                Siguiente: Cantidades
              </Button>
            </div>
          </TabsContent>

          {/* Tab 2: Cantidades */}
          <TabsContent value="cantidades" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cant_real">
                Cantidad Real <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cant_real"
                type="number"
                min="0"
                step="0.01"
                value={formData.cant_real}
                onChange={(e) => updateField("cant_real", parseFloat(e.target.value) || 0)}
                className={cn(!validations.cantidades && "border-destructive")}
              />
              {!validations.cantidades && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  La cantidad debe ser mayor a 0
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="desperdicio_pct">% Desperdicio</Label>
              <Input
                id="desperdicio_pct"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.desperdicio_pct}
                onChange={(e) => updateField("desperdicio_pct", parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Desperdicio típico: 5-15% para materiales de construcción
              </p>
            </div>

            <Separator />

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Cálculo de Cantidad Necesaria</p>
              <div className="flex items-center justify-between text-sm">
                <span>Cantidad Real:</span>
                <span className="font-mono">{formData.cant_real.toFixed(2)} {formData.unidad}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>+ Desperdicio ({formData.desperdicio_pct}%):</span>
                <span className="font-mono">
                  {(formData.cant_real * formData.desperdicio_pct / 100).toFixed(2)} {formData.unidad}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-base font-bold">
                <span>Cantidad Necesaria:</span>
                <span className="font-mono text-primary">{cantNecesaria.toFixed(2)} {formData.unidad}</span>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setCurrentTab("basico")}>
                Anterior
              </Button>
              <Button
                onClick={() => setCurrentTab("costos")}
                disabled={!validations.cantidades}
              >
                Siguiente: Costos
              </Button>
            </div>
          </TabsContent>

          {/* Tab 3: Costos */}
          <TabsContent value="costos" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="costo_unit">
                Costo Unitario <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                <Input
                  id="costo_unit"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.costo_unit}
                  onChange={(e) => updateField("costo_unit", parseFloat(e.target.value) || 0)}
                  className={cn("pl-7", !validations.costos && "border-destructive")}
                />
              </div>
              {!validations.costos && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  El costo unitario debe ser mayor a 0
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="honorarios_pct">% Honorarios</Label>
              <Input
                id="honorarios_pct"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.honorarios_pct}
                onChange={(e) => updateField("honorarios_pct", parseFloat(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Honorarios típicos: 10-30% sobre costo
              </p>
            </div>

            <Separator />

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Calculadora de Precio en Tiempo Real</p>
              <div className="flex items-center justify-between text-sm">
                <span>Costo Unitario:</span>
                <span className="font-mono">{formatCurrency(formData.costo_unit)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>+ Honorarios ({formData.honorarios_pct}%):</span>
                <span className="font-mono">
                  {formatCurrency(formData.costo_unit * formData.honorarios_pct / 100)}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-sm font-semibold">
                <span>Precio Unitario:</span>
                <span className="font-mono text-primary">{formatCurrency(precioUnit)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>× Cantidad Necesaria:</span>
                <span className="font-mono">{cantNecesaria.toFixed(2)} {formData.unidad}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between text-lg font-bold">
                <span>Total Item:</span>
                <span className="font-mono text-primary">{formatCurrency(totalItem)}</span>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setCurrentTab("cantidades")}>
                Anterior
              </Button>
              <Button
                onClick={() => setCurrentTab("proveedor")}
                disabled={!validations.costos}
              >
                Siguiente: Proveedor
              </Button>
            </div>
          </TabsContent>

          {/* Tab 4: Proveedor */}
          <TabsContent value="proveedor" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="proveedor">Proveedor (Opcional)</Label>
              <Select
                value={formData.proveedor_alias}
                onValueChange={(val) => updateField("proveedor_alias", val)}
              >
                <SelectTrigger id="proveedor">
                  <SelectValue placeholder="Seleccionar proveedor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Sin proveedor</SelectItem>
                  {providers.map(p => (
                    <SelectItem key={p.id} value={p.code_short}>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {p.code_short}
                        </Badge>
                        <span>{p.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Puedes asignar un proveedor para este item específico
              </p>
            </div>

            {formData.proveedor_alias && providers.find(p => p.code_short === formData.proveedor_alias) && (
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">Información del Proveedor</p>
                {(() => {
                  const provider = providers.find(p => p.code_short === formData.proveedor_alias);
                  if (!provider) return null;
                  return (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span>Nombre:</span>
                        <span className="font-medium">{provider.name}</span>
                      </div>
                      {provider.contacto_json?.email && (
                        <div className="flex items-center justify-between text-sm">
                          <span>Email:</span>
                          <span className="text-muted-foreground">{provider.contacto_json.email}</span>
                        </div>
                      )}
                      {provider.contacto_json?.telefono && (
                        <div className="flex items-center justify-between text-sm">
                          <span>Teléfono:</span>
                          <span className="text-muted-foreground">{provider.contacto_json.telefono}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            <Separator />

            <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-4 rounded-lg space-y-2">
              <p className="text-sm font-medium">Resumen Final del Item</p>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Descripción:</span>
                  <span className="font-medium">{formData.descripcion}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cantidad Necesaria:</span>
                  <span className="font-medium">{cantNecesaria.toFixed(2)} {formData.unidad}</span>
                </div>
                <div className="flex justify-between">
                  <span>Precio Unitario:</span>
                  <span className="font-medium">{formatCurrency(precioUnit)}</span>
                </div>
                {formData.proveedor_alias && (
                  <div className="flex justify-between">
                    <span>Proveedor:</span>
                    <Badge variant="outline">{formData.proveedor_alias}</Badge>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between text-base font-bold">
                  <span>Total Item:</span>
                  <span className="text-primary">{formatCurrency(totalItem)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-between gap-2 pt-4">
              <Button variant="outline" onClick={() => setCurrentTab("costos")}>
                Anterior
              </Button>
              <Button
                onClick={handleSave}
                disabled={!allValid}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Guardar Item
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
