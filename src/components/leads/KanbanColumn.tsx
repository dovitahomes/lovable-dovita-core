import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SortableLeadCard } from "./SortableLeadCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeadStatus } from "@/hooks/useLeads";

interface KanbanColumnProps {
  status: LeadStatus;
  title: string;
  leads: any[];
  isLoading: boolean;
  onConvert: (lead: any) => void;
}

const statusColors: Record<LeadStatus, string> = {
  nuevo: "bg-blue-500",
  contactado: "bg-yellow-500",
  calificado: "bg-green-500",
  convertido: "bg-purple-500",
  perdido: "bg-red-500"
};

export function KanbanColumn({ status, title, leads, isLoading, onConvert }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  
  return (
    <Card className={`flex flex-col h-full min-w-[280px] ${isOver ? 'ring-2 ring-primary' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
            {title}
          </CardTitle>
          <Badge variant="secondary">{leads?.length || 0}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-3" ref={setNodeRef}>
        {isLoading ? (
          <>
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </>
        ) : (
          <SortableContext items={leads?.map(l => l.id) || []} strategy={verticalListSortingStrategy}>
            {leads?.map((lead) => (
              <SortableLeadCard 
                key={lead.id} 
                lead={lead} 
                onConvert={() => onConvert(lead)} 
              />
            ))}
            {(!leads || leads.length === 0) && (
              <div className="text-center text-sm text-muted-foreground py-8">
                Sin leads
              </div>
            )}
          </SortableContext>
        )}
      </CardContent>
    </Card>
  );
}
