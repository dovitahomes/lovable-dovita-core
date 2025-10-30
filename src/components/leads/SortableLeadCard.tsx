import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { LeadCard } from "./LeadCard";

interface SortableLeadCardProps {
  lead: any;
  onConvert: () => void;
}

export function SortableLeadCard({ lead, onConvert }: SortableLeadCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: lead.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <LeadCard lead={lead} onConvert={onConvert} isDragging={isDragging} />
    </div>
  );
}
