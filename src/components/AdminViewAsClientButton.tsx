import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AdminViewAsClientButton() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [selectedClientEmail, setSelectedClientEmail] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");

  // Fetch all clients
  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ["all-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("email, name")
        .order("name");
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Fetch projects for selected client
  const { data: projects, isLoading: loadingProjects } = useQuery({
    queryKey: ["client-projects-for-impersonate", selectedClientEmail],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          id,
          status,
          clients!inner(name, email)
        `)
        .eq("clients.email", selectedClientEmail);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedClientEmail,
  });

  const handleViewAsClient = () => {
    if (!selectedProjectId) {
      toast({
        title: "Error",
        description: "Por favor selecciona un proyecto",
        variant: "destructive",
      });
      return;
    }

    // Set impersonation flag and navigate
    localStorage.setItem("asClient", "true");
    localStorage.setItem("client.activeProject", selectedProjectId);
    navigate(`/client?asClient=1&project=${selectedProjectId}`);
    setOpen(false);
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        className="gap-2"
        onClick={() => setOpen(true)}
      >
        <Eye className="h-4 w-4" />
        Ver como cliente
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ver como cliente</DialogTitle>
            <DialogDescription>
              Selecciona un cliente y proyecto para ver su portal
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Client Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cliente</label>
              {loadingClients ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <Select value={selectedClientEmail} onValueChange={(value) => {
                  setSelectedClientEmail(value);
                  setSelectedProjectId(""); // Reset project selection
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.email} value={client.email}>
                        {client.name} ({client.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Project Selection */}
            {selectedClientEmail && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Proyecto</label>
                {loadingProjects ? (
                  <div className="flex items-center justify-center p-4">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : projects && projects.length > 0 ? (
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un proyecto" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          Proyecto de {project.clients?.name || "Sin nombre"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Este cliente no tiene proyectos asignados
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleViewAsClient}
              disabled={!selectedProjectId}
            >
              Ver portal
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
