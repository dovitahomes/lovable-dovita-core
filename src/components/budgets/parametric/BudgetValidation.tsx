import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, AlertTriangle, CheckCircle } from "lucide-react";
import { BudgetItem, Mayor } from "./ParametricBudgetWizard";

interface BudgetValidationProps {
  items: BudgetItem[];
  selectedMayores: Mayor[];
  projectId: string;
}

interface ValidationIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  count?: number;
}

export function BudgetValidation({ items, selectedMayores, projectId }: BudgetValidationProps) {
  const issues: ValidationIssue[] = [];

  // Critical Validations (Errors)
  if (!projectId) {
    issues.push({
      type: 'error',
      message: 'Debes seleccionar un proyecto',
    });
  }

  if (selectedMayores.length === 0) {
    issues.push({
      type: 'error',
      message: 'Debes seleccionar al menos un mayor',
    });
  }

  if (items.length === 0) {
    issues.push({
      type: 'error',
      message: 'Debes agregar al menos una partida',
    });
  }

  // Missing required fields
  const itemsWithoutPartida = items.filter((item) => !item.partida_id);
  if (itemsWithoutPartida.length > 0) {
    issues.push({
      type: 'error',
      message: `${itemsWithoutPartida.length} partida(s) sin seleccionar`,
      count: itemsWithoutPartida.length,
    });
  }

  const itemsWithoutCost = items.filter((item) => !item.costo_unit || item.costo_unit <= 0);
  if (itemsWithoutCost.length > 0) {
    issues.push({
      type: 'error',
      message: `${itemsWithoutCost.length} partida(s) sin costo unitario`,
      count: itemsWithoutCost.length,
    });
  }

  const itemsWithoutQuantity = items.filter((item) => !item.cant_real || item.cant_real <= 0);
  if (itemsWithoutQuantity.length > 0) {
    issues.push({
      type: 'error',
      message: `${itemsWithoutQuantity.length} partida(s) sin cantidad`,
      count: itemsWithoutQuantity.length,
    });
  }

  // Warnings
  const itemsWithoutDescription = items.filter((item) => !item.descripcion || item.descripcion.trim() === '');
  if (itemsWithoutDescription.length > 0) {
    issues.push({
      type: 'warning',
      message: `${itemsWithoutDescription.length} partida(s) sin descripción`,
      count: itemsWithoutDescription.length,
    });
  }

  const itemsWithHighWaste = items.filter((item) => item.desperdicio_pct > 20);
  if (itemsWithHighWaste.length > 0) {
    issues.push({
      type: 'warning',
      message: `${itemsWithHighWaste.length} partida(s) con desperdicio >20%`,
      count: itemsWithHighWaste.length,
    });
  }

  const itemsWithHighHonorarios = items.filter((item) => item.honorarios_pct > 30);
  if (itemsWithHighHonorarios.length > 0) {
    issues.push({
      type: 'warning',
      message: `${itemsWithHighHonorarios.length} partida(s) con honorarios >30%`,
      count: itemsWithHighHonorarios.length,
    });
  }

  // Info
  const mayoresWithoutItems = selectedMayores.filter(
    (mayor) => !items.some((item) => item.mayor_id === mayor.id)
  );
  if (mayoresWithoutItems.length > 0) {
    issues.push({
      type: 'info',
      message: `${mayoresWithoutItems.length} mayor(es) sin partidas`,
      count: mayoresWithoutItems.length,
    });
  }

  const errors = issues.filter((i) => i.type === 'error');
  const warnings = issues.filter((i) => i.type === 'warning');
  const infos = issues.filter((i) => i.type === 'info');

  if (errors.length === 0 && warnings.length === 0 && infos.length === 0) {
    return (
      <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700 dark:text-green-400">
          ✓ Todas las validaciones pasaron correctamente
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-3">
      {/* Errors */}
      {errors.map((issue, idx) => (
        <Alert key={`error-${idx}`} variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center gap-2">
            {issue.message}
            {issue.count && (
              <Badge variant="destructive" className="ml-auto">
                {issue.count}
              </Badge>
            )}
          </AlertDescription>
        </Alert>
      ))}

      {/* Warnings */}
      {warnings.map((issue, idx) => (
        <Alert key={`warning-${idx}`} className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
            {issue.message}
            {issue.count && (
              <Badge className="ml-auto bg-amber-500">
                {issue.count}
              </Badge>
            )}
          </AlertDescription>
        </Alert>
      ))}

      {/* Info */}
      {infos.map((issue, idx) => (
        <Alert key={`info-${idx}`} className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <AlertCircle className="h-4 w-4 text-blue-600" />
          <AlertDescription className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
            {issue.message}
            {issue.count && (
              <Badge className="ml-auto bg-blue-500">
                {issue.count}
              </Badge>
            )}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
