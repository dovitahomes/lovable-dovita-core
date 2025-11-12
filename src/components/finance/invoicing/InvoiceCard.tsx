import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { getCfdiSignedUrl } from "@/lib/storage/storage-helpers";

interface InvoiceCardProps {
  invoice: any;
  onViewDetails?: (invoice: any) => void;
  onMarkPaid?: (invoiceId: string) => void;
}

export function InvoiceCard({ invoice, onViewDetails, onMarkPaid }: InvoiceCardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const getStatusBadge = () => {
    if (invoice.paid) {
      return (
        <Badge variant="default" className="gap-1 bg-emerald-500 hover:bg-emerald-600">
          <CheckCircle2 className="h-3 w-3" />
          Pagada
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3 w-3" />
        Pendiente
      </Badge>
    );
  };

  const getTipoBadge = () => {
    if (invoice.tipo === 'ingreso') {
      return (
        <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400">
          Ingreso
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="border-red-500 text-red-600 dark:text-red-400">
        Egreso
      </Badge>
    );
  };

  const handleDownloadXML = async () => {
    if (!invoice.xml_path) return;
    
    try {
      const { url } = await getCfdiSignedUrl(invoice.xml_path);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading XML:', error);
    }
  };

  const handleDownloadPDF = async () => {
    if (!invoice.pdf_path) return;
    
    try {
      const { url } = await getCfdiSignedUrl(invoice.pdf_path);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  return (
    <Card className="group transition-all duration-300 hover:scale-[1.02] hover:shadow-lg">
      <CardContent className="p-6">
        {/* Header with Icon */}
        <div className={cn(
          "p-3 rounded-xl bg-gradient-to-br inline-flex mb-4",
          invoice.tipo === 'ingreso'
            ? "from-emerald-500/10 to-teal-500/10 dark:from-emerald-500/20 dark:to-teal-500/20"
            : "from-violet-500/10 to-purple-500/10 dark:from-violet-500/20 dark:to-purple-500/20"
        )}>
          <FileText className={cn(
            "h-6 w-6",
            invoice.tipo === 'ingreso'
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-violet-600 dark:text-violet-400"
          )} />
        </div>

        {/* Folio & Status */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Folio</p>
            <p className="text-lg font-bold text-foreground">
              {invoice.folio || 'Sin folio'}
            </p>
          </div>
          <div className="flex flex-col gap-1 items-end">
            {getStatusBadge()}
            {getTipoBadge()}
          </div>
        </div>

        {/* Entity Info */}
        <div className="space-y-2 mb-4 pb-4 border-b">
          <div>
            <p className="text-xs text-muted-foreground">
              {invoice.tipo === 'ingreso' ? 'Cliente' : 'Proveedor'}
            </p>
            <p className="text-sm font-medium text-foreground truncate">
              {invoice.tipo === 'ingreso' 
                ? invoice.receptor?.name || 'Sin nombre'
                : invoice.emisor?.name || 'Sin nombre'
              }
            </p>
          </div>
        </div>

        {/* Amount */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-1">Monto Total</p>
          <p className="text-2xl font-bold text-foreground">
            {formatCurrency(invoice.total_amount || 0)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {invoice.issued_at
              ? format(new Date(invoice.issued_at), 'dd MMM yyyy', { locale: es })
              : 'Sin fecha'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-2"
            onClick={() => onViewDetails?.(invoice)}
          >
            <Eye className="h-4 w-4" />
            Ver
          </Button>
          {invoice.xml_path && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownloadXML}
              title="Descargar XML"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          {!invoice.paid && onMarkPaid && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkPaid(invoice.id)}
              className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
              title="Marcar como pagada"
            >
              <CheckCircle2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
