import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Database, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Client {
  client_id: string;
  client_name: string;
}

export default function PreviewBar() {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [useMock, setUseMock] = useState(true);
  const [loading, setLoading] = useState(true);

  // Check if preview mode is active
  useEffect(() => {
    const previewFromStorage = localStorage.getItem("clientapp.previewMode") === "true";
    const previewFromUrl = new URLSearchParams(window.location.search).has("preview");
    const isPreview = previewFromStorage || previewFromUrl;
    setIsPreviewMode(isPreview);

    if (isPreview) {
      // Load current settings
      const forceClientId = localStorage.getItem("clientapp.forceClientId");
      const mockSetting = localStorage.getItem("clientapp.useMock");
      
      setSelectedClientId(forceClientId);
      setUseMock(mockSetting !== "false");
      
      // Load clients from v_client_projects
      loadClients();
    } else {
      setLoading(false);
    }
  }, []);

  const loadClients = async () => {
    try {
      // For now, use mock data. Real implementation would query v_client_projects
      // TODO: Implement real Supabase query when ready
      const clientsList: Client[] = [
        { client_id: 'client_1', client_name: 'Familia Martínez' },
        { client_id: 'client_2', client_name: 'Familia González' }
      ];

      setClients(clientsList);

      // Auto-select first client if none selected
      if (!selectedClientId && clientsList.length > 0) {
        const firstClientId = clientsList[0].client_id;
        setSelectedClientId(firstClientId);
        localStorage.setItem("clientapp.forceClientId", firstClientId);
      }
    } catch (error) {
      console.error("Error loading clients:", error);
      // If no clients, suggest using mock data
      if (clients.length === 0) {
        toast({
          title: "Sin clientes reales",
          description: "Activa Mock Data para previsualizar",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    localStorage.setItem("clientapp.forceClientId", clientId);
    
    // Clear current project to force reload
    localStorage.removeItem("currentProjectId");
    
    toast({
      title: "Cliente seleccionado",
      description: "Recarga la página para ver los cambios",
    });
  };

  const handleMockToggle = (checked: boolean) => {
    setUseMock(checked);
    localStorage.setItem("clientapp.useMock", checked ? "true" : "false");
    
    toast({
      title: "Fuente de datos actualizada",
      description: "Navega para refrescar los datos",
    });
  };

  const handleBackoffice = () => {
    const backofficeUrl = localStorage.getItem("clientapp.backofficeUrl") || "/";
    window.location.href = backofficeUrl;
  };

  if (!isPreviewMode) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-primary/95 backdrop-blur-sm border-b border-primary-foreground/20 shadow-lg">
      <div className="container mx-auto px-4 py-2 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary-foreground" />
          <span className="text-sm font-medium text-primary-foreground">Modo Previsualización</span>
        </div>

        {!loading && clients.length > 0 && (
          <div className="flex items-center gap-2">
            <Label className="text-sm text-primary-foreground">Cliente:</Label>
            <Select value={selectedClientId || undefined} onValueChange={handleClientChange}>
              <SelectTrigger className="h-8 w-[200px] bg-background/10 text-primary-foreground border-primary-foreground/30">
                <SelectValue placeholder="Seleccionar cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((client) => (
                  <SelectItem key={client.client_id} value={client.client_id}>
                    {client.client_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary-foreground" />
          <Label className="text-sm text-primary-foreground">Mock Data:</Label>
          <Switch
            checked={useMock}
            onCheckedChange={handleMockToggle}
            className="data-[state=checked]:bg-primary-foreground"
          />
        </div>

        <div className="ml-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleBackoffice}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Backoffice
          </Button>
        </div>
      </div>
    </div>
  );
}
