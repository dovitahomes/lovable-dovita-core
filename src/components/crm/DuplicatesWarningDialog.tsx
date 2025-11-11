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
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Mail, Phone, User, Calendar, DollarSign, Eye } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { DuplicateLead } from "@/lib/crm/duplicates";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface DuplicatesWarningDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  duplicates: DuplicateLead[];
  onProceed: () => void;
  onCancel: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  nuevo: 'bg-gray-500',
  contactado: 'bg-blue-500',
  calificado: 'bg-yellow-500',
  propuesta: 'bg-purple-500',
  negociacion: 'bg-orange-500',
  ganado: 'bg-green-500',
  perdido: 'bg-red-500',
  convertido: 'bg-teal-500',
};

export function DuplicatesWarningDialog({
  open,
  onOpenChange,
  duplicates,
  onProceed,
  onCancel,
}: DuplicatesWarningDialogProps) {
  const navigate = useNavigate();

  const handleViewLead = (leadId: string) => {
    onOpenChange(false);
    // Navegar a detalles del lead (placeholder - ajustar según tu routing)
    navigate(`/leads?highlight=${leadId}`);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-3xl max-h-[80vh]">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            ⚠️ Posibles Leads Duplicados Detectados
          </AlertDialogTitle>
          <AlertDialogDescription className="text-base">
            Se encontraron <strong className="text-foreground">{duplicates.length}</strong> lead(s) 
            que podrían ser duplicados. Revisa la información antes de continuar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <ScrollArea className="max-h-[400px] pr-4">
          <div className="space-y-4">
            {duplicates.map((duplicate, index) => (
              <div
                key={duplicate.id}
                className="border rounded-lg p-4 space-y-3 bg-card hover:shadow-md transition-shadow"
              >
                {/* Header con nombre y score */}
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <h4 className="font-semibold text-base">{duplicate.nombre_completo}</h4>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={STATUS_COLORS[duplicate.status] || 'bg-gray-500'}>
                        {duplicate.status}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Similitud: {duplicate.similarity_score}%
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewLead(duplicate.id)}
                    className="shrink-0"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver Lead
                  </Button>
                </div>

                {/* Match reasons */}
                <div className="flex flex-wrap gap-2">
                  {duplicate.match_reasons.map((reason, idx) => (
                    <Badge key={idx} variant="secondary" className="text-xs">
                      ✓ {reason}
                    </Badge>
                  ))}
                </div>

                {/* Detalles de contacto */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  {duplicate.email && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span className="font-mono">{duplicate.email}</span>
                    </div>
                  )}
                  {duplicate.telefono && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span className="font-mono">{duplicate.telefono}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Creado: {format(new Date(duplicate.created_at), "d MMM yyyy", { locale: es })}
                    </span>
                  </div>
                  {duplicate.presupuesto_referencia && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      <span>
                        {new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN',
                          maximumFractionDigits: 0
                        }).format(duplicate.presupuesto_referencia)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-900 dark:text-amber-100">
          <p className="font-medium mb-1">⚠️ Recomendación:</p>
          <ul className="space-y-1 ml-4 list-disc text-xs">
            <li>Revisa los leads similares antes de crear uno nuevo</li>
            <li>Considera actualizar el lead existente en lugar de crear duplicado</li>
            <li>Si es un contacto diferente con datos similares, puedes continuar</li>
          </ul>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onProceed}
            className="bg-amber-600 hover:bg-amber-700"
          >
            Crear de Todas Formas
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
