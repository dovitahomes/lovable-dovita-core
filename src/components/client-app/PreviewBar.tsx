import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Database, Eye, AlertCircle, ChevronDown } from "lucide-react";
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
  const [isSwitching, setIsSwitching] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);
  
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
      
      // VALIDACIÓN: Solo auto-seleccionar si el ID es válido para el source actual
      const isValidId = source === 'mock' 
        ? firstClientId.startsWith('mock_') 
        : !firstClientId.startsWith('mock_');
      
      if (isValidId) {
        setForceClientId(firstClientId);
      }
    }
  }, [isPreviewMode, isClientRoute, forceClientId, displayClients, setForceClientId, source]);


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
    setIsSwitching(true);
    
    const newSource = checked ? 'mock' : 'real';
    setSource(newSource);
    
    // Clear current selections when switching
    localStorage.removeItem("currentProjectId");
    
    // CORRECCIÓN: Usar la lista correcta según el nuevo source
    const clientsToUse = newSource === 'mock' ? mockClients : realClients;
    
    if (clientsToUse.length > 0) {
      // Seleccionar el primer cliente del source correcto
      setForceClientId(clientsToUse[0].client_id);
    } else {
      // Si no hay clientes en el nuevo source, limpiar selección
      setForceClientId(null);
    }
    
    toast({
      title: checked ? "Modo Mock Data" : "Modo Datos Reales",
      description: clientsToUse.length > 0 
        ? "Los datos se actualizarán automáticamente" 
        : "No hay clientes disponibles. Cambia a Mock Data para continuar.",
    });
    
    // Dar tiempo para que React re-renderice con los nuevos datos
    setTimeout(() => setIsSwitching(false), 300);
  };

  const handleBackoffice = () => {
    const backofficeUrl = localStorage.getItem("clientapp.backofficeUrl") || "/";
    window.location.href = backofficeUrl;
  };

  // Manejar toggle de expansión (para móvil con tap)
  const handleToggleExpand = () => {
    if (isMobile) {
      setIsExpanded(!isExpanded);
    }
  };

  // Manejar eventos de mouse (para desktop con delay)
  const handleMouseEnter = () => {
    if (!isMobile) {
      // Cancelar cualquier timeout pendiente
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      // Agregar delay de 1 segundo antes de cerrar
      closeTimeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 1000);
    }
  };

  // No renderizar si no está en modo preview o no está en ruta de cliente
  if (!isPreviewMode || !isClientRoute) {
    return null;
  }

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ease-in-out"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isExpanded ? 'translateY(0)' : 'translateY(-100%)',
      }}
    >
      {/* Barra colapsada - Tab visible */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full bg-[hsl(var(--dovita-yellow))] text-primary px-4 py-2 rounded-b-lg shadow-lg cursor-pointer flex items-center gap-2 active:scale-95 transition-transform touch-manipulation"
        onClick={handleToggleExpand}
        style={{
          opacity: isExpanded ? 0 : 1,
          transition: 'opacity 0.2s ease-in-out',
          pointerEvents: isExpanded ? 'none' : 'auto',
        }}
      >
        <Eye className="h-3 w-3" />
        <span className="text-xs font-medium whitespace-nowrap">Modo Preview</span>
        <ChevronDown className="h-3 w-3" />
      </div>

      {/* Overlay para cerrar en móvil al hacer tap fuera */}
      {isMobile && isExpanded && (
        <div
          className="fixed inset-0 bg-transparent -z-10"
          onClick={() => setIsExpanded(false)}
        />
      )}

      {/* Barra expandida - Contenido completo */}
      <div className="bg-primary/95 backdrop-blur-sm border-b border-primary-foreground/20 shadow-lg">
        <div className="container mx-auto px-4 py-2 flex items-center gap-4 flex-wrap">
          {/* Botón de cierre para móvil */}
          {isMobile && (
            <button
              onClick={() => setIsExpanded(false)}
              className="text-primary-foreground hover:text-primary-foreground/80 active:scale-95 transition-transform"
              aria-label="Cerrar"
            >
              <ChevronDown className="h-5 w-5 rotate-180" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary-foreground" />
            <span className="text-sm font-medium text-primary-foreground hidden sm:inline">Modo Previsualización</span>
            <span className="text-xs font-medium text-primary-foreground sm:hidden">Preview</span>
          </div>

          {displayClients.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <Label className="text-xs sm:text-sm text-primary-foreground whitespace-nowrap">Cliente:</Label>
              <Select value={forceClientId || undefined} onValueChange={handleClientChange}>
                <SelectTrigger 
                  className="h-8 w-[160px] sm:w-[200px] bg-background/10 text-primary-foreground border-primary-foreground/30 text-xs sm:text-sm"
                  disabled={isSwitching}
                >
                  <SelectValue placeholder={
                    isSwitching ? "Cambiando..." : 
                    loadingClients ? "Cargando..." : 
                    "Seleccionar"
                  } />
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
            <div className="text-xs text-primary-foreground/80 bg-primary-foreground/10 px-2 py-1 rounded flex items-center gap-2">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              <span className="hidden sm:inline">Sin clientes reales. Activa Mock Data para continuar →</span>
              <span className="sm:hidden">Sin clientes →</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Database className="h-3 sm:h-4 w-3 sm:w-4 text-primary-foreground" />
            <Label className="text-xs sm:text-sm text-primary-foreground whitespace-nowrap hidden sm:inline">Mock Data:</Label>
            <Label className="text-xs text-primary-foreground whitespace-nowrap sm:hidden">Mock:</Label>
            <Switch
              checked={source === 'mock'}
              onCheckedChange={handleMockToggle}
              className="data-[state=checked]:bg-primary-foreground scale-90 sm:scale-100"
            />
          </div>

          <div className="ml-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBackoffice}
              className="gap-2 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
            >
              <ArrowLeft className="h-3 sm:h-4 w-3 sm:w-4" />
              <span className="hidden sm:inline">Backoffice</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
