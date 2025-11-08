import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, Download, Plus, Link as LinkIcon } from "lucide-react";
import { CfdiUploadDialog } from "./CfdiUploadDialog";
import { PaymentComplementDialog } from "./PaymentComplementDialog";
import { ReconcileDialog } from "./ReconcileDialog";
import { toast } from "sonner";
import { format } from "date-fns";
import { getCfdiSignedUrl } from "@/lib/storage/storage-helpers";

interface Invoice {
  id: string;
  tipo: string;
  metodo_pago: string;
  issued_at: string;
  uuid: string | null;
  folio: string | null;
  total_amount: number;
  emisor_id: string | null;
  receptor_id: string | null;
  xml_path: string | null;
  pdf_path: string | null;
  cfdi_metadata: any;
  paid: boolean;
  emisor?: { name: string };
  receptor?: { name: string };
  total_paid: number;
  balance: number;
}

export function InvoicesTab() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showReconcileDialog, setShowReconcileDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  // Filters
  const [filterTipo, setFilterTipo] = useState<string>("all");
  const [filterMetodo, setFilterMetodo] = useState<string>("all");
  const [filterConciliado, setFilterConciliado] = useState<string>("all");

  const loadInvoices = async () => {
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          emisor:providers!invoices_emisor_id_fkey(name),
          receptor:clients!invoices_receptor_id_fkey(name)
        `)
        .order('issued_at', { ascending: false });

      if (error) throw error;

      // Calculate total paid and balance for each invoice
      const enrichedInvoices = await Promise.all(
        (data || []).map(async (inv) => {
          const { data: payments } = await supabase
            .from('invoice_payments')
            .select('amount')
            .eq('invoice_id', inv.id);

          const totalPaid = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
          const balance = Number(inv.total_amount) - totalPaid;

          return {
            ...inv,
            emisor: inv.emisor as any,
            receptor: inv.receptor as any,
            total_paid: totalPaid,
            balance
          };
        })
      );

      setInvoices(enrichedInvoices);
      setFilteredInvoices(enrichedInvoices);
    } catch (error) {
      console.error('Error loading invoices:', error);
      toast.error('Error al cargar facturas');
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [filterTipo, filterMetodo, filterConciliado, invoices]);

  const applyFilters = () => {
    let filtered = [...invoices];

    if (filterTipo !== "all") {
      filtered = filtered.filter(inv => inv.tipo === filterTipo);
    }

    if (filterMetodo !== "all") {
      filtered = filtered.filter(inv => inv.metodo_pago === filterMetodo);
    }

    if (filterConciliado !== "all") {
      filtered = filtered.filter(inv => {
        const status = getReconciliationStatus(inv);
        return status === filterConciliado;
      });
    }

    setFilteredInvoices(filtered);
  };

  const getReconciliationStatus = (invoice: Invoice): string => {
    if (invoice.paid || invoice.balance <= 0) return "conciliado";
    if (invoice.total_paid > 0) return "parcial";
    return "pendiente";
  };

  const getReconciliationBadge = (invoice: Invoice) => {
    const status = getReconciliationStatus(invoice);
    
    if (status === "conciliado") {
      return <Badge className="bg-green-500">Conciliado</Badge>;
    } else if (status === "parcial") {
      return <Badge className="bg-yellow-500">Parcial</Badge>;
    } else {
      return <Badge variant="destructive">Pendiente</Badge>;
    }
  };

  const handleAddPayment = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPaymentDialog(true);
  };

  const handleReconcile = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowReconcileDialog(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Facturas CFDI</CardTitle>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Subir XML
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo</label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ingreso">Ingreso</SelectItem>
                  <SelectItem value="egreso">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Método de Pago</label>
              <Select value={filterMetodo} onValueChange={setFilterMetodo}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PUE">PUE (Pago en una sola exhibición)</SelectItem>
                  <SelectItem value="PPD">PPD (Pago en parcialidades)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Conciliación</label>
              <Select value={filterConciliado} onValueChange={setFilterConciliado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="conciliado">Conciliado</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Folio</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Emisor/Receptor</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Pagado</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground py-8">
                      No hay facturas registradas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell className="font-mono text-sm">
                        {invoice.folio || invoice.uuid?.substring(0, 8)}
                      </TableCell>
                      <TableCell>{format(new Date(invoice.issued_at), 'dd/MM/yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant={invoice.tipo === 'ingreso' ? 'default' : 'secondary'}>
                          {invoice.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate">
                        {invoice.tipo === 'egreso' 
                          ? invoice.emisor?.name || 'N/A'
                          : invoice.receptor?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{invoice.metodo_pago}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ${invoice.total_amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        ${invoice.total_paid.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        ${invoice.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell>
                        {getReconciliationBadge(invoice)}
                      </TableCell>
                       <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {invoice.xml_path && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  const { url } = await getCfdiSignedUrl(invoice.xml_path!);
                                  window.open(url, '_blank');
                                } catch (error) {
                                  console.error('Error getting signed URL:', error);
                                  toast.error('Error al acceder al XML');
                                }
                              }}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          )}
                          {invoice.metodo_pago === 'PPD' && invoice.balance > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleAddPayment(invoice)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          )}
                          {!invoice.paid && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReconcile(invoice)}
                              title="Conciliar manualmente"
                            >
                              <LinkIcon className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CfdiUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        onSuccess={loadInvoices}
      />

      {selectedInvoice && (
        <>
          <PaymentComplementDialog
            open={showPaymentDialog}
            onClose={(reload) => {
              setShowPaymentDialog(false);
              setSelectedInvoice(null);
              if (reload) loadInvoices();
            }}
            invoice={selectedInvoice}
          />

          <ReconcileDialog
            open={showReconcileDialog}
            onClose={() => {
              setShowReconcileDialog(false);
              setSelectedInvoice(null);
              loadInvoices();
            }}
            invoice={selectedInvoice}
          />
        </>
      )}
    </div>
  );
}
