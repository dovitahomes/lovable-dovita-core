import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LeadCardCompact } from "./LeadCardCompact";

interface SortableLeadCardCompactProps {
  lead: any;
  onOpenDetails: (leadId: string) => void;
}

export function SortableLeadCardCompact({ lead, onOpenDetails }: SortableLeadCardCompactProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCardCompact 
        lead={lead} 
        onOpenDetails={onOpenDetails}
        isDragging={isDragging}
      />
    </div>
  );
}
