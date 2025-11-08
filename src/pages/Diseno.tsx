import { useState } from "react";
import { PenTool } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DesignTab } from "@/components/design/DesignTab";
import { Skeleton } from "@/components/ui/skeleton";

export default function Diseno() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  
  const { data: projects, isLoading } = useQuery({
    queryKey: ["projects-for-design"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id, clients(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PenTool className="h-8 w-8" />
          <h1 className="text-3xl font-bold">Diseño</h1>
        </div>
        
        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Seleccionar proyecto" />
          </SelectTrigger>
          <SelectContent>
            {projects?.map((project) => (
              <SelectItem key={project.id} value={project.id}>
                {project.clients?.name || `Proyecto ${project.id.slice(0, 8)}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedProjectId ? (
        <DesignTab projectId={selectedProjectId} />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          Selecciona un proyecto para ver sus fases de diseño
        </div>
      )}
    </div>
  );
}
