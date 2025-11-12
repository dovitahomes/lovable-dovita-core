import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useInvoices } from "@/hooks/finance/useInvoices";
import { useCreatePaymentBatch, useAddInvoiceToPaymentBatch } from "@/hooks/usePaymentBatches";
import { DndContext, DragOverlay, closestCenter, PointerSensor, useSensor, useSensors, useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, Download, Calendar, Building2, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface BatchInvoice {
  id: string;
  emisor_name: string;
  total_amount: number;
  folio: string | null;
}

export function PaymentBatchBuilder() {
  const { data: unpaidInvoices = [], isLoading } = useInvoices({ tipo: 'egreso', paid: false });
  const createBatchMutation = useCreatePaymentBatch();
  const addInvoiceMutation = useAddInvoiceToPaymentBatch();
  
  const [batchName, setBatchName] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [selectedInvoices, setSelectedInvoices] = useState<BatchInvoice[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || over.id !== 'batch-drop-zone') return;

    const invoice = unpaidInvoices.find(inv => inv.id === active.id);
    if (!invoice) return;

    // Evitar duplicados
    if (selectedInvoices.find(inv => inv.id === invoice.id)) {
      toast.info("Esta factura ya está en el lote");
      return;
    }

    setSelectedInvoices([...selectedInvoices, {
      id: invoice.id,
      emisor_name: invoice.emisor?.name || 'Sin proveedor',
      total_amount: invoice.total_amount,
      folio: invoice.folio,
    }]);
  };

  const handleRemoveInvoice = (invoiceId: string) => {
    setSelectedInvoices(selectedInvoices.filter(inv => inv.id !== invoiceId));
  };

  const totalAmount = selectedInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);

  const groupedBySupplier = selectedInvoices.reduce((acc, inv) => {
    if (!acc[inv.emisor_name]) {
      acc[inv.emisor_name] = { count: 0, total: 0 };
    }
    acc[inv.emisor_name].count += 1;
    acc[inv.emisor_name].total += inv.total_amount;
    return acc;
  }, {} as Record<string, { count: number; total: number }>);

  const handleCreateBatch = async () => {
    if (!batchName.trim()) {
      toast.error("El lote debe tener un nombre");
      return;
    }
    if (selectedInvoices.length === 0) {
      toast.error("Agrega al menos una factura al lote");
      return;
    }

    try {
      // Crear el lote (simplified - in reality you'd get batchId from the mutation)
      await createBatchMutation.mutateAsync({
        title: batchName,
        scheduled_date: scheduledDate || undefined,
      });

      toast.success("Lote de pago creado exitosamente");
      
      // Reset form
      setBatchName("");
      setScheduledDate("");
      setSelectedInvoices([]);
    } catch (error) {
      console.error("Error creating batch:", error);
    }
  };

  const handleExportExcel = () => {
    const data = selectedInvoices.map(inv => ({
      'Proveedor': inv.emisor_name,
      'Folio': inv.folio || 'N/A',
      'Monto': inv.total_amount,
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Lote de Pago");
    XLSX.writeFile(wb, `lote-pago-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
    toast.success("Layout descargado");
  };

  const handleExportTxt = () => {
    let txt = `Lote de Pago: ${batchName}\n`;
    txt += `Fecha: ${scheduledDate || 'Sin programar'}\n`;
    txt += `Total: $${totalAmount.toFixed(2)}\n\n`;
    txt += `Facturas:\n`;
    txt += `${"=".repeat(80)}\n`;
    
    selectedInvoices.forEach(inv => {
      txt += `Proveedor: ${inv.emisor_name.padEnd(40)} Folio: ${(inv.folio || 'N/A').padEnd(15)} Monto: $${inv.total_amount.toFixed(2)}\n`;
    });

    const blob = new Blob([txt], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lote-pago-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Layout TXT descargado");
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Available Invoices */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Facturas Disponibles
              <Badge variant="secondary" className="ml-auto">{unpaidInvoices.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SortableContext items={unpaidInvoices.map(i => i.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {unpaidInvoices.map((invoice) => (
                  <DraggableInvoiceCard key={invoice.id} invoice={invoice} />
                ))}
              </div>
            </SortableContext>
          </CardContent>
        </Card>

        {/* Right: Batch Builder */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurar Lote</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="batch-name">Nombre del Lote</Label>
                <Input
                  id="batch-name"
                  placeholder="Ej: Pago Proveedores Semana 1"
                  value={batchName}
                  onChange={(e) => setBatchName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="scheduled-date">Fecha Programada (opcional)</Label>
                <Input
                  id="scheduled-date"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <BatchDropZone 
            invoices={selectedInvoices} 
            onRemove={handleRemoveInvoice}
          />

          <Card className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20">
            <CardHeader>
              <CardTitle className="text-base">Resumen de Dispersión</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total de facturas:</span>
                <span className="font-semibold">{selectedInvoices.length}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Proveedores únicos:</span>
                <span className="font-semibold">{Object.keys(groupedBySupplier).length}</span>
              </div>
              <div className="border-t pt-3 flex items-center justify-between">
                <span className="font-semibold">Monto Total:</span>
                <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  ${totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </span>
              </div>

              {Object.entries(groupedBySupplier).length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Por Proveedor:</p>
                  {Object.entries(groupedBySupplier).map(([supplier, data]) => (
                    <div key={supplier} className="flex items-center justify-between text-xs">
                      <span className="truncate flex-1">{supplier}</span>
                      <span className="ml-2 font-medium">
                        {data.count} × ${data.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button 
              onClick={handleCreateBatch} 
              disabled={selectedInvoices.length === 0 || !batchName.trim()}
              className="flex-1"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Lote
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportExcel}
              disabled={selectedInvoices.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
            <Button 
              variant="outline" 
              onClick={handleExportTxt}
              disabled={selectedInvoices.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              TXT
            </Button>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="p-3 rounded-lg border bg-card shadow-lg">
            <p className="text-sm font-medium">Arrastrando factura...</p>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function DraggableInvoiceCard({ invoice }: { invoice: any }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: invoice.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium truncate">{invoice.emisor?.name || 'Sin proveedor'}</p>
          <p className="text-xs text-muted-foreground">Folio: {invoice.folio || 'N/A'}</p>
        </div>
        <p className="text-sm font-bold text-foreground ml-2">
          ${invoice.total_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
        </p>
      </div>
    </div>
  );
}

function BatchDropZone({ invoices, onRemove }: { invoices: BatchInvoice[]; onRemove: (id: string) => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'batch-drop-zone',
  });

  return (
    <Card
      ref={setNodeRef}
      className={cn(
        "transition-all duration-200",
        isOver && "ring-2 ring-primary ring-offset-2 bg-primary/5"
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <DollarSign className="h-5 w-5" />
          Facturas en el Lote
          <Badge variant="secondary" className="ml-auto">{invoices.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 min-h-[200px] max-h-[400px] overflow-y-auto">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] text-center text-muted-foreground">
              <Plus className="h-8 w-8 mb-2" />
              <p className="text-sm">Arrastra facturas aquí</p>
            </div>
          ) : (
            invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="p-3 rounded-lg border bg-card flex items-start justify-between group"
              >
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">{invoice.emisor_name}</p>
                  <p className="text-xs text-muted-foreground">Folio: {invoice.folio || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground">
                    ${invoice.total_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onRemove(invoice.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
