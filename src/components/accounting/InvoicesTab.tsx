import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Upload, FileText, ExternalLink, Plus } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { format } from "date-fns";
import { PaymentComplementDialog } from "./PaymentComplementDialog";

export function InvoicesTab() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  
  // Filters
  const [filterType, setFilterType] = useState<string>("all");
  const [filterMethod, setFilterMethod] = useState<string>("all");
  const [filterPaid, setFilterPaid] = useState<string>("all");

  useEffect(() => {
    loadInvoices();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [invoices, filterType, filterMethod, filterPaid]);

  const loadInvoices = async () => {
    const { data, error } = await supabase
      .from("invoices")
      .select(`
        *,
        providers(code_short, name),
        clients(name)
      `)
      .order("issued_at", { ascending: false });

    if (error) {
      toast.error("Error al cargar facturas");
      return;
    }

    // Get payment info for each invoice
    const invoicesWithPayments = await Promise.all(
      (data || []).map(async (invoice) => {
        const { data: payments } = await supabase
          .from("invoice_payments")
          .select("amount")
          .eq("invoice_id", invoice.id);

        const totalPaid = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
        const balance = invoice.total_amount - totalPaid;

        return {
          ...invoice,
          total_paid: totalPaid,
          balance,
        };
      })
    );

    setInvoices(invoicesWithPayments);
  };

  const applyFilters = () => {
    let filtered = [...invoices];

    if (filterType !== "all") {
      filtered = filtered.filter((i) => i.tipo === filterType);
    }

    if (filterMethod !== "all") {
      filtered = filtered.filter((i) => i.metodo_pago === filterMethod);
    }

    if (filterPaid !== "all") {
      const isPaid = filterPaid === "paid";
      filtered = filtered.filter((i) => i.paid === isPaid);
    }

    setFilteredInvoices(filtered);
  };

  const onDrop = async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    const file = acceptedFiles[0];

    try {
      // Upload XML to storage
      const fileName = `${Date.now()}-${file.name}`;
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("cfdi")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("cfdi")
        .getPublicUrl(fileName);

      // Read XML content (simplified - in production use proper XML parser)
      const reader = new FileReader();
      reader.onload = async (e) => {
        const xmlContent = e.target?.result as string;
        
        // Extract basic info from filename or use placeholders
        // In production, parse the XML properly
        const { error: insertError } = await supabase.from("invoices").insert({
          tipo: "ingreso", // Would be extracted from XML
          metodo_pago: "PUE", // Would be extracted from XML
          folio: file.name.split(".")[0],
          uuid: crypto.randomUUID(), // Would be extracted from XML
          issued_at: new Date().toISOString().split("T")[0],
          total_amount: 0, // Would be extracted from XML
          xml_url: publicUrl,
          meta_json: { original_filename: file.name },
        });

        if (insertError) throw insertError;

        toast.success("Factura XML cargada correctamente");
        setShowUploadDialog(false);
        loadInvoices();
      };

      reader.readAsText(file);
    } catch (error: any) {
      toast.error("Error al cargar XML: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "text/xml": [".xml"] },
    maxFiles: 1,
    disabled: uploading,
  });

  const openPaymentDialog = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowPaymentDialog(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestión de Facturas CFDI</CardTitle>
          <Button onClick={() => setShowUploadDialog(true)} className="gap-2">
            <Upload className="h-4 w-4" />
            Cargar XML
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="ingreso">Ingreso</SelectItem>
                  <SelectItem value="egreso">Egreso</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Método de Pago</Label>
              <Select value={filterMethod} onValueChange={setFilterMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="PUE">PUE</SelectItem>
                  <SelectItem value="PPD">PPD</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Estado de Pago</Label>
              <Select value={filterPaid} onValueChange={setFilterPaid}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="paid">Pagadas</SelectItem>
                  <SelectItem value="unpaid">Pendientes</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
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
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono">{invoice.folio}</TableCell>
                  <TableCell>{format(new Date(invoice.issued_at), "dd/MM/yyyy")}</TableCell>
                  <TableCell>
                    <Badge variant={invoice.tipo === "ingreso" ? "default" : "destructive"}>
                      {invoice.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">
                    {invoice.tipo === "ingreso"
                      ? invoice.clients?.name || "-"
                      : invoice.providers
                      ? `${invoice.providers.code_short} - ${invoice.providers.name}`
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{invoice.metodo_pago}</Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${invoice.total_amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right text-green-600">
                    ${invoice.total_paid?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${invoice.balance?.toLocaleString() || 0}
                  </TableCell>
                  <TableCell>
                    {invoice.paid ? (
                      <Badge className="bg-green-500">Pagada</Badge>
                    ) : (
                      <Badge variant="secondary">Pendiente</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {invoice.xml_url && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => window.open(invoice.xml_url, "_blank")}
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      )}
                      {invoice.metodo_pago === "PPD" && !invoice.paid && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openPaymentDialog(invoice)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Pago
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cargar Factura XML (CFDI)</DialogTitle>
          </DialogHeader>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
            } ${uploading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <input {...getInputProps()} />
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            {uploading ? (
              <p>Subiendo...</p>
            ) : isDragActive ? (
              <p>Suelta el archivo XML aquí...</p>
            ) : (
              <div>
                <p className="mb-2">Arrastra un archivo XML o haz clic para seleccionar</p>
                <p className="text-sm text-muted-foreground">Solo archivos XML de CFDI</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PaymentComplementDialog
        open={showPaymentDialog}
        onClose={(reload) => {
          setShowPaymentDialog(false);
          setSelectedInvoice(null);
          if (reload) loadInvoices();
        }}
        invoice={selectedInvoice}
      />
    </div>
  );
}
