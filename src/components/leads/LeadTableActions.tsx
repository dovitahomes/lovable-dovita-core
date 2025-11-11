import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Pencil, History } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LeadQuickActions } from "./LeadQuickActions";
import { CreateFollowUpDialog } from "./CreateFollowUpDialog";
import { ActivityTimeline } from "./ActivityTimeline";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LeadTableActionsProps {
  lead: any;
  onEdit?: () => void;
}

export function LeadTableActions({ lead, onEdit }: LeadTableActionsProps) {
  const navigate = useNavigate();
  const [followUpOpen, setFollowUpOpen] = useState(false);
  const [timelineOpen, setTimelineOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-1">
        <LeadQuickActions 
          leadId={lead.id}
          leadName={lead.nombre_completo}
          leadEmail={lead.email}
        />
        
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setFollowUpOpen(true)}
                className="h-8 w-8 p-0"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Editar</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setTimelineOpen(true)}
                className="h-8 w-8 p-0"
              >
                <History className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Ver historial</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {lead.client_id && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/clientes/${lead.client_id}`)}
                  className="h-8 w-8 p-0"
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Ver cliente</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>

      <CreateFollowUpDialog
        open={followUpOpen}
        onOpenChange={setFollowUpOpen}
        leadId={lead.id}
        leadName={lead.nombre_completo}
      />

      <ActivityTimeline
        open={timelineOpen}
        onOpenChange={setTimelineOpen}
        leadId={lead.id}
        leadName={lead.nombre_completo}
      />
    </>
  );
}
