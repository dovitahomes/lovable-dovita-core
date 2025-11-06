import { useEffect, useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Database, Eye, AlertCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { useDataSource } from "@/contexts/client-app/DataSourceContext";
import { useAppMode } from "@/hooks/client-app/useAppMode";
import { supabase } from "@/integrations/supabase/client";

interface Client {
  client_id: string;
  client_name: string;
}

export default function PreviewBar() {
  const location = useLocation();
  const { source, setSource, forceClientId, setForceClientId } = useDataSource();
  const { isPreviewMode, userRole } = useAppMode();
  const [isSwitching, setIsSwitching] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isInUse, setIsInUse] = useState(false);
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

  // Re-programar cierre automático cuando el estado "en uso" cambie
  useEffect(() => {
    if (isExpanded && !isInUse) {
      // Si está expandido pero ya NO está en uso, programar cierre
      closeTimeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 2000);
    }
    
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, [isInUse, isExpanded]);
  
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
    // 1. Limpiar preview mode y storage
    localStorage.removeItem("clientapp.previewMode");
    localStorage.removeItem("clientapp.useMock");
    localStorage.removeItem("clientapp.forceClientId");
    localStorage.removeItem("clientapp.backofficeUrl");
    localStorage.removeItem("currentProjectId");
    
    // 2. SIEMPRE redirigir al dashboard del ERP
    window.location.href = '/';
  };

  // Manejar toggle de expansión (para móvil con tap y delay)
  const handleToggleExpand = () => {
    if (isMobile) {
      const newExpandedState = !isExpanded;
      setIsExpanded(newExpandedState);
      
      // Si se está expandiendo, iniciar timeout para cerrar automáticamente
      if (newExpandedState) {
        closeTimeoutRef.current = setTimeout(() => {
          // Solo cerrar si NO está en uso
          if (!isInUse) {
            setIsExpanded(false);
          }
        }, 2000);
      } else {
        // Si se está cerrando manualmente, cancelar timeout y resetear estado
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
        setIsInUse(false);
      }
    }
  };

  // Manejar eventos de mouse (para desktop con delay)
  const handleMouseEnter = () => {
    if (!isMobile) {
      // Marcar como "en uso" y cancelar cualquier timeout pendiente
      setIsInUse(true);
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      setIsExpanded(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobile) {
      // Marcar como NO en uso al salir
      setIsInUse(false);
      
      // Programar cierre automático con 2 segundos de delay
      closeTimeoutRef.current = setTimeout(() => {
        setIsExpanded(false);
      }, 2000);
    }
  };

  // No renderizar si:
  // - No es colaborador
  // - No está en modo preview
  // - No está en ruta de cliente
  if (userRole !== 'collaborator' || !isPreviewMode || !isClientRoute) {
    return null;
  }

  return (
    <>
      {/* Lengüeta colapsada - Siempre visible como overlay fijo */}
      <div 
        className={cn(
          "fixed z-[100] bg-[hsl(var(--dovita-yellow))]/90 text-primary rounded-b-lg shadow-md cursor-pointer flex items-center gap-2 active:scale-95 transition-all duration-300 touch-manipulation",
          isMobile 
            ? "top-[env(safe-area-inset-top,0)] right-4 px-2 py-1" 
            : "top-0 left-1/2 -translate-x-1/2 px-4 py-2",
          isExpanded && "opacity-0 pointer-events-none"
        )}
        onClick={handleToggleExpand}
        onMouseEnter={handleMouseEnter}
      >
        <Eye className={isMobile ? "h-3 w-3" : "h-4 w-4"} />
        {!isMobile && (
          <>
            <span className="text-xs font-medium whitespace-nowrap">Modo Preview</span>
            <ChevronDown className="h-3 w-3" />
          </>
        )}
      </div>

      {/* Overlay para cerrar en móvil al hacer tap fuera */}
      {isMobile && isExpanded && (
        <div
          className="fixed inset-0 bg-black/20 z-[98]"
          onClick={() => {
            if (closeTimeoutRef.current) {
              clearTimeout(closeTimeoutRef.current);
              closeTimeoutRef.current = null;
            }
            setIsExpanded(false);
          }}
        />
      )}

      {/* Barra expandida - Contenido completo */}
      <div 
        className={cn(
          "fixed left-0 right-0 z-[100] transition-all duration-300 ease-in-out",
          isMobile ? "top-[env(safe-area-inset-top,0)]" : "top-0",
          isExpanded ? "translate-y-0" : "-translate-y-full"
        )}
        onMouseLeave={handleMouseLeave}
      >
        <div className="bg-primary/95 backdrop-blur-sm border-b border-primary-foreground/20 shadow-lg">
          <div className={cn(
            "container mx-auto px-4 flex items-center flex-wrap",
            isMobile ? "py-1.5 gap-2" : "py-2 gap-4"
          )}>
          {/* Botón de cierre para móvil */}
          {isMobile && (
            <button
              onClick={() => {
                if (closeTimeoutRef.current) {
                  clearTimeout(closeTimeoutRef.current);
                  closeTimeoutRef.current = null;
                }
                setIsExpanded(false);
              }}
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
              <Select 
                value={forceClientId || undefined} 
                onValueChange={handleClientChange}
                onOpenChange={(open) => {
                  if (isMobile) {
                    setIsInUse(open);
                    if (open && closeTimeoutRef.current) {
                      clearTimeout(closeTimeoutRef.current);
                      closeTimeoutRef.current = null;
                    }
                  }
                }}
              >
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
              onFocus={() => {
                if (isMobile) {
                  setIsInUse(true);
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                    closeTimeoutRef.current = null;
                  }
                }
              }}
              onBlur={() => {
                if (isMobile) {
                  setIsInUse(false);
                }
              }}
            />
          </div>

          <div className="ml-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleBackoffice}
              className="gap-2 h-7 sm:h-8 text-xs sm:text-sm px-2 sm:px-3"
              onFocus={() => {
                if (isMobile) {
                  setIsInUse(true);
                  if (closeTimeoutRef.current) {
                    clearTimeout(closeTimeoutRef.current);
                    closeTimeoutRef.current = null;
                  }
                }
              }}
              onBlur={() => {
                if (isMobile) {
                  setIsInUse(false);
                }
              }}
            >
              <ArrowLeft className="h-3 sm:h-4 w-3 sm:w-4" />
              <span className="hidden sm:inline">Backoffice</span>
              <span className="sm:hidden">Back</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
