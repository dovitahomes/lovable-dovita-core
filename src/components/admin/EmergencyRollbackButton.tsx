import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export function EmergencyRollbackButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<Array<{ table_name: string; rls_disabled: boolean }> | null>(null);

  const rollbackMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase.rpc("emergency_disable_all_rls" as any) as any);
      
      if (error) throw error;
      return data as Array<{ table_name: string; rls_disabled: boolean }>;
    },
    onSuccess: (data) => {
      setResults(data);
      const successCount = data.filter(r => r.rls_disabled).length;
      const failCount = data.length - successCount;
      
      toast.success(`RLS deshabilitado en ${successCount} tablas${failCount > 0 ? `, ${failCount} fallaron` : ""}`);
    },
    onError: (error: any) => {
      toast.error("Error al ejecutar rollback: " + error.message);
      setIsOpen(false);
    },
  });

  const handleRollback = () => {
    setResults(null);
    rollbackMutation.mutate();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <Shield className="h-4 w-4" />
          Rollback de Emergencia
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            ⚠️ ROLLBACK DE EMERGENCIA - RLS
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-4">
            {!results ? (
              <>
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>ADVERTENCIA CRÍTICA</AlertTitle>
                  <AlertDescription>
                    Esta acción deshabilitará Row-Level Security (RLS) en TODAS las tablas del sistema.
                    <br /><br />
                    <strong>Consecuencias:</strong>
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Todos los usuarios tendrán acceso completo a todos los datos</li>
                      <li>Se perderán todas las restricciones de seguridad a nivel de fila</li>
                      <li>Los clientes podrán ver datos de otros clientes</li>
                      <li>Se requiere re-habilitar RLS manualmente después</li>
                    </ul>
                  </AlertDescription>
                </Alert>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="font-semibold">⚠️ Usar SOLO en caso de:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    <li>Sistema completamente bloqueado para usuarios legítimos</li>
                    <li>Políticas RLS causando pérdida de servicio crítica</li>
                    <li>Necesidad urgente de acceso a datos para resolver incidente</li>
                  </ul>
                </div>

                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p className="font-semibold">📋 Procedimiento Post-Rollback:</p>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Documentar el incidente y la causa raíz</li>
                    <li>Revisar políticas RLS problemáticas</li>
                    <li>Corregir en ambiente de staging</li>
                    <li>Probar exhaustivamente</li>
                    <li>Re-habilitar RLS en producción</li>
                  </ol>
                </div>

                <p className="text-sm font-medium text-destructive">
                  ⚠️ Esta acción quedará registrada en la auditoría del sistema con tu usuario, IP y timestamp.
                </p>
              </>
            ) : (
              <>
                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertTitle>Rollback Ejecutado</AlertTitle>
                  <AlertDescription>
                    El proceso de rollback de RLS ha finalizado.
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <p className="font-semibold text-sm">Resultados por tabla:</p>
                  <div className="max-h-60 overflow-y-auto border rounded-lg p-2">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2">Tabla</th>
                          <th className="text-center p-2">Estado</th>
                        </tr>
                      </thead>
                      <tbody>
                        {results.map((result, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2 font-mono text-xs">{result.table_name}</td>
                            <td className="p-2 text-center">
                              {result.rls_disabled ? (
                                <CheckCircle className="h-4 w-4 text-green-600 inline" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-600 inline" />
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Acción Requerida</AlertTitle>
                  <AlertDescription>
                    RLS ha sido deshabilitado. Consulta <code>/docs/RLS_EMERGENCY_PROCEDURES.md</code> para el procedimiento de recuperación.
                  </AlertDescription>
                </Alert>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {!results ? (
            <>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRollback}
                disabled={rollbackMutation.isPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {rollbackMutation.isPending ? "Ejecutando..." : "Ejecutar Rollback"}
              </AlertDialogAction>
            </>
          ) : (
            <AlertDialogAction onClick={() => setIsOpen(false)}>
              Cerrar
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
