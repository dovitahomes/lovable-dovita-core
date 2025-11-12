import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, X, GripVertical } from "lucide-react";
import { Mayor } from "../ParametricBudgetWizard";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface StepMayorSelectionProps {
  selectedMayores: Mayor[];
  onMayoresChange: (mayores: Mayor[]) => void;
}

function SortableMayorCard({ mayor, onRemove }: { mayor: Mayor; onRemove: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: mayor.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border bg-card p-4 transition-all",
        isDragging && "opacity-50 shadow-lg"
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="flex items-center justify-between pl-8">
        <div className="flex items-center gap-3">
          <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white">
            {mayor.code}
          </Badge>
          <span className="font-semibold">{mayor.name}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function StepMayorSelection({ selectedMayores, onMayoresChange }: StepMayorSelectionProps) {
  const { data: mayores, isLoading } = useQuery({
    queryKey: ['tu_mayores'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tu_nodes')
        .select('id, code, name')
        .eq('type', 'mayor')
        .eq('project_scope', 'global')
        .order('code');
      if (error) throw error;
      return data as Mayor[];
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = selectedMayores.findIndex((m) => m.id === active.id);
      const newIndex = selectedMayores.findIndex((m) => m.id === over.id);
      onMayoresChange(arrayMove(selectedMayores, oldIndex, newIndex));
    }
  };

  const handleAddMayor = (mayor: Mayor) => {
    if (!selectedMayores.find((m) => m.id === mayor.id)) {
      onMayoresChange([...selectedMayores, mayor]);
    }
  };

  const handleRemoveMayor = (mayorId: string) => {
    onMayoresChange(selectedMayores.filter((m) => m.id !== mayorId));
  };

  const availableMayores = mayores?.filter(
    (m) => !selectedMayores.find((sm) => sm.id === m.id)
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-20 rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h3 className="text-2xl font-bold">Selección de Mayores</h3>
        <p className="text-muted-foreground">
          Selecciona y ordena los mayores que incluirás en el presupuesto
        </p>
      </div>

      {/* Selected Mayores */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm text-muted-foreground">
              MAYORES SELECCIONADOS ({selectedMayores.length})
            </h4>
            {selectedMayores.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                Arrastra para ordenar
              </Badge>
            )}
          </div>

          {selectedMayores.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No hay mayores seleccionados</p>
              <p className="text-xs mt-1">Selecciona al menos uno de la lista inferior</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={selectedMayores.map((m) => m.id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {selectedMayores.map((mayor) => (
                    <SortableMayorCard
                      key={mayor.id}
                      mayor={mayor}
                      onRemove={() => handleRemoveMayor(mayor.id)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Available Mayores */}
      {availableMayores && availableMayores.length > 0 && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <h4 className="font-semibold text-sm text-muted-foreground">
              MAYORES DISPONIBLES ({availableMayores.length})
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
              {availableMayores.map((mayor) => (
                <Button
                  key={mayor.id}
                  type="button"
                  variant="outline"
                  onClick={() => handleAddMayor(mayor)}
                  className="justify-start gap-3 h-auto py-3"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge variant="secondary" className="shrink-0 text-xs">
                      {mayor.code}
                    </Badge>
                    <span className="truncate text-sm">{mayor.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
