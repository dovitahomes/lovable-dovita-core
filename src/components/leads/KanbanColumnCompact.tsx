import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SortableLeadCardCompact } from "./SortableLeadCardCompact";
import { Skeleton } from "@/components/ui/skeleton";
import type { LeadStatus } from "@/hooks/useLeads";
import { cn } from "@/lib/utils";

interface KanbanColumnCompactProps {
  status: LeadStatus;
  title: string;
  leads: any[];
  isLoading: boolean;
  onOpenDetails: (leadId: string) => void;
  className?: string;
}

const statusColors: Record<LeadStatus, string> = {
  nuevo: "bg-gray-500",
  contactado: "bg-blue-500",
  propuesta: "bg-purple-500",
  convertido: "bg-green-500",
  perdido: "bg-red-500"
};

export function KanbanColumnCompact({ 
  status, 
  title, 
  leads, 
  isLoading, 
  onOpenDetails,
  className 
}: KanbanColumnCompactProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  
  return (
    <Card className={cn(
      "flex flex-col h-full",
      isOver && 'ring-2 ring-primary',
      className
    )}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusColors[status]}`} />
            {title}
          </CardTitle>
          <Badge variant="secondary">{leads?.length || 0}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto space-y-2" ref={setNodeRef}>
        {isLoading ? (
          <>
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </>
        ) : (
          <SortableContext items={leads?.map(l => l.id) || []} strategy={verticalListSortingStrategy}>
            {leads?.map((lead) => (
              <SortableLeadCardCompact 
                key={lead.id} 
                lead={lead} 
                onOpenDetails={onOpenDetails}
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
