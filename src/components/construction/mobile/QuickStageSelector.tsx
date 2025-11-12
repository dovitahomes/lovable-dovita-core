import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Stage {
  id: string;
  name: string;
  progress: number;
}

interface QuickStageSelectorProps {
  stages: Stage[];
  selectedStageId: string | null;
  onSelect: (stageId: string) => void;
}

export function QuickStageSelector({ stages, selectedStageId, onSelect }: QuickStageSelectorProps) {
  if (stages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p className="text-sm">No hay etapas disponibles</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-[300px] pr-4">
      <div className="space-y-2">
        {stages.map((stage) => (
          <Button
            key={stage.id}
            variant={selectedStageId === stage.id ? "default" : "outline"}
            className="w-full justify-start h-auto py-4 relative"
            onClick={() => onSelect(stage.id)}
          >
            <div className="flex-1 text-left">
              <div className="font-medium">{stage.name}</div>
              <div className="text-xs opacity-70 mt-1">
                {stage.progress}% completo
              </div>
            </div>
            {selectedStageId === stage.id && (
              <Check className="h-5 w-5 ml-2 shrink-0" />
            )}
          </Button>
        ))}
      </div>
    </ScrollArea>
  );
}
