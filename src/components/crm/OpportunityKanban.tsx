import { useState } from "react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Building2, DollarSign } from "lucide-react";

export type OpportunityStage = 'prospecto' | 'calificado' | 'propuesta' | 'negociacion' | 'ganado' | 'perdido';

interface OpportunityCardProps {
  opportunity: any;
  isDragging?: boolean;
  onClick: () => void;
}

const STAGE_CONFIG = {
  prospecto: { label: 'Prospecto', color: 'bg-blue-500', probability: 10 },
  calificado: { label: 'Calificado', color: 'bg-yellow-500', probability: 25 },
  propuesta: { label: 'Propuesta', color: 'bg-purple-500', probability: 50 },
  negociacion: { label: 'Negociación', color: 'bg-orange-500', probability: 75 },
  ganado: { label: 'Ganado', color: 'bg-green-500', probability: 100 },
  perdido: { label: 'Perdido', color: 'bg-red-500', probability: 0 }
};

function OpportunityCard({ opportunity, isDragging, onClick }: OpportunityCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ id: opportunity.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Card 
        className={`cursor-pointer hover:shadow-md transition-shadow ${isDragging ? 'shadow-lg' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm line-clamp-2">{opportunity.name}</h4>
            <Badge variant="outline" className="text-xs shrink-0">
              {opportunity.folio}
            </Badge>
          </div>
          
          {opportunity.account?.name && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="h-3 w-3" />
              <span className="truncate">{opportunity.account.name}</span>
            </div>
          )}

          {opportunity.amount && (
            <div className="flex items-center gap-1 text-sm font-semibold text-primary">
              <DollarSign className="h-4 w-4" />
              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(opportunity.amount)}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>{opportunity.probability}% prob.</span>
            {opportunity.expected_close_date && (
              <span>{formatDistanceToNow(new Date(opportunity.expected_close_date), { locale: es, addSuffix: true })}</span>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function KanbanColumn({ stage, title, opportunities, isLoading, onOpportunityClick }: any) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const config = STAGE_CONFIG[stage as OpportunityStage];

  return (
    <Card className={`flex flex-col h-full min-w-[280px] w-[280px] md:min-w-[300px] md:w-[300px] ${isOver ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${config.color}`} />
            {title}
          </CardTitle>
          <Badge variant="secondary">{opportunities.length}</Badge>
        </div>
      </CardHeader>
      <CardContent ref={setNodeRef} className="flex-1 overflow-y-auto space-y-2 p-4 pt-0">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 w-full" />)}
          </div>
        ) : opportunities.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            Sin oportunidades
          </div>
        ) : (
          <SortableContext items={opportunities.map((o: any) => o.id)} strategy={verticalListSortingStrategy}>
            {opportunities.map((opp: any) => (
              <OpportunityCard key={opp.id} opportunity={opp} onClick={() => onOpportunityClick(opp)} />
            ))}
          </SortableContext>
        )}
      </CardContent>
    </Card>
  );
}

interface OpportunityKanbanProps {
  opportunities: any[];
  isLoading: boolean;
  onOpportunityClick: (opportunity: any) => void;
  onStageChange: (opportunityId: string, newStage: OpportunityStage) => void;
}

export function OpportunityKanban({ opportunities, isLoading, onOpportunityClick, onStageChange }: OpportunityKanbanProps) {
  const [activeDragOpp, setActiveDragOpp] = useState<any>(null);

  const COLUMNS = [
    { stage: 'prospecto' as OpportunityStage, title: 'Prospecto' },
    { stage: 'calificado' as OpportunityStage, title: 'Calificado' },
    { stage: 'propuesta' as OpportunityStage, title: 'Propuesta' },
    { stage: 'negociacion' as OpportunityStage, title: 'Negociación' },
    { stage: 'ganado' as OpportunityStage, title: 'Ganado' },
    { stage: 'perdido' as OpportunityStage, title: 'Perdido' }
  ];

  const handleDragStart = (event: DragStartEvent) => {
    const opp = opportunities.find(o => o.id === event.active.id);
    setActiveDragOpp(opp);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragOpp(null);

    if (!over || active.id === over.id) return;

    const newStage = over.id as OpportunityStage;
    onStageChange(active.id as string, newStage);
  };

  const getOpportunitiesByStage = (stage: OpportunityStage) => {
    return opportunities.filter(o => o.stage === stage);
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full min-w-max">
          {COLUMNS.map(({ stage, title }) => (
            <KanbanColumn
              key={stage}
              stage={stage}
              title={title}
              opportunities={getOpportunitiesByStage(stage)}
              isLoading={isLoading}
              onOpportunityClick={onOpportunityClick}
            />
          ))}
        </div>
      </div>

      <DragOverlay>
        {activeDragOpp ? (
          <OpportunityCard opportunity={activeDragOpp} isDragging onClick={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

export { STAGE_CONFIG };
