import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BudgetMajor } from "@/hooks/useBudgetMajors";

type AddMajorSelectorProps = {
  availableMajors: BudgetMajor[];
  onAddMajor: (mayorId: string) => void;
  disabled?: boolean;
};

export function AddMajorSelector({ availableMajors, onAddMajor, disabled }: AddMajorSelectorProps) {
  if (availableMajors.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4 text-center border rounded-lg bg-muted/20">
        No hay mayores disponibles para agregar al cronograma
      </div>
    );
  }

  return (
    <div>
      <Label>Añadir Mayor al Cronograma</Label>
      <Select onValueChange={onAddMajor} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Selecciona un mayor para agregar" />
        </SelectTrigger>
        <SelectContent>
          {availableMajors.map((major) => (
            <SelectItem key={major.mayor_id} value={major.mayor_id}>
              <div className="flex justify-between items-center gap-4">
                <span>{major.mayor_name}</span>
                <span className="text-xs text-muted-foreground">
                  ${major.importe.toLocaleString("es-MX", { minimumFractionDigits: 0 })}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
