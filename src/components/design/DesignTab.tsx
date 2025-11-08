import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DesignPhaseTimeline } from "./DesignPhaseTimeline";
import { PhasesSection } from "./PhasesSection";
import { ChangeLogsSection } from "./ChangeLogsSection";
import { DeliverablesSection } from "./DeliverablesSection";
import { Layers, FileText, Upload, TrendingUp } from "lucide-react";

interface DesignTabProps {
  projectId: string;
}

export function DesignTab({ projectId }: DesignTabProps) {
  return (
    <Tabs defaultValue="timeline" className="w-full">
      <TabsList>
        <TabsTrigger value="timeline" className="gap-2">
          <TrendingUp className="h-4 w-4" />
          Timeline
        </TabsTrigger>
        <TabsTrigger value="phases" className="gap-2">
          <Layers className="h-4 w-4" />
          Fases
        </TabsTrigger>
        <TabsTrigger value="changelog" className="gap-2">
          <FileText className="h-4 w-4" />
          Bitácora
        </TabsTrigger>
        <TabsTrigger value="deliverables" className="gap-2">
          <Upload className="h-4 w-4" />
          Entregables
        </TabsTrigger>
      </TabsList>

      <TabsContent value="timeline" className="mt-6">
        <DesignPhaseTimeline projectId={projectId} />
      </TabsContent>

      <TabsContent value="phases" className="mt-6">
        <PhasesSection projectId={projectId} />
      </TabsContent>

      <TabsContent value="changelog" className="mt-6">
        <ChangeLogsSection projectId={projectId} />
      </TabsContent>

      <TabsContent value="deliverables" className="mt-6">
        <DeliverablesSection projectId={projectId} />
      </TabsContent>
    </Tabs>
  );
}
