import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Database, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useDataSource } from "@/contexts/client-app/DataSourceContext";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  client_id: string;
  client_name: string;
}

export default function PreviewBar() {
  const location = useLocation();
  const { source, setSource, forceClientId, setForceClientId, isPreviewMode } = useDataSource();
  
  // Solo renderizar en rutas /client/*
  const isClientRoute = location.pathname.startsWith('/client');
  
  // Query para obtener clientes reales de Supabase
  const { data: realClients = [], isLoading: loadingClients } = useQuery({
    queryKey: ['preview-clients'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('id, name, email')
        .order('name');
      
      if (error) throw error;
      return data.map(c => ({
        client_id: c.id,
        client_name: c.name,
      }));
    },
    enabled: isPreviewMode && isClientRoute,
  });

  // Combinar con mock clients si está en modo mock
  const mockClients: Client[] = [
    { client_id: 'mock_1', client_name: 'Familia Martínez (Mock)' },
    { client_id: 'mock_2', client_name: 'Familia González (Mock)' },
    { client_id: 'mock_3', client_name: 'Familia Rodríguez (Mock)' }
  ];

  const displayClients = source === 'mock' ? mockClients : realClients;

  // Auto-select first client if none selected
  useEffect(() => {
    if (isPreviewMode && isClientRoute && !forceClientId && displayClients.length > 0) {
      const firstClientId = displayClients[0].client_id;
      setForceClientId(firstClientId);
    }
  }, [isPreviewMode, isClientRoute, forceClientId, displayClients, setForceClientId]);


  const handleClientChange = (clientId: string) => {
    setForceClientId(clientId);
    
    // Clear current project to force reload
    localStorage.removeItem("currentProjectId");
    
    toast({
      title: "Cliente seleccionado",
      description: "Los datos se actualizarán automáticamente",
    });
  };

  const handleMockToggle = (checked: boolean) => {
    setSource(checked ? 'mock' : 'real');
    
    // Clear current selections when switching
    localStorage.removeItem("currentProjectId");
    if (!checked && displayClients.length > 0) {
      // When switching to real, select first real client
      setForceClientId(displayClients[0].client_id);
    }
    
    toast({
      title: checked ? "Modo Mock Data" : "Modo Datos Reales",
      description: "Los datos se actualizarán automáticamente",
    });
  };

  const handleBackoffice = () => {
    const backofficeUrl = localStorage.getItem("clientapp.backofficeUrl") || "/";
    window.location.href = backofficeUrl;
  };

  // No renderizar si no está en modo preview o no está en ruta de cliente
  if (!isPreviewMode || !isClientRoute) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-primary/95 backdrop-blur-sm border-b border-primary-foreground/20 shadow-lg">
      <div className="container mx-auto px-4 py-2 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Eye className="h-4 w-4 text-primary-foreground" />
          <span className="text-sm font-medium text-primary-foreground">Modo Previsualización</span>
        </div>

        {displayClients.length > 0 && (
          <div className="flex items-center gap-2">
            <Label className="text-sm text-primary-foreground">Cliente:</Label>
            <Select value={forceClientId || undefined} onValueChange={handleClientChange}>
              <SelectTrigger className="h-8 w-[200px] bg-background/10 text-primary-foreground border-primary-foreground/30">
                <SelectValue placeholder={loadingClients ? "Cargando..." : "Seleccionar cliente"} />
              </SelectTrigger>
              <SelectContent>
                {displayClients.map((client) => (
                  <SelectItem key={client.client_id} value={client.client_id}>
                    {client.client_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {source === 'real' && realClients.length === 0 && !loadingClients && (
          <div className="text-xs text-primary-foreground/80 bg-primary-foreground/10 px-2 py-1 rounded">
            Sin clientes reales. Activa Mock Data →
          </div>
        )}

        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary-foreground" />
          <Label className="text-sm text-primary-foreground">Mock Data:</Label>
          <Switch
            checked={source === 'mock'}
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
