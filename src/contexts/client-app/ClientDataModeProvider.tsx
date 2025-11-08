/**
 * Client Data Mode Provider
 * 
 * Controla el modo de datos del Client App:
 * - useMock=true: Usa fixtures locales (solo para demos/preview)
 * - useMock=false: Consulta Supabase (vistas v_client_*)
 * 
 * PRODUCCIÓN: useMock siempre false
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface ClientDataModeContextType {
  useMock: boolean;
  setUseMock: (value: boolean) => void;
}

const ClientDataModeContext = createContext<ClientDataModeContextType | undefined>(undefined);

interface ClientDataModeProviderProps {
  children: ReactNode;
}

export function ClientDataModeProvider({ children }: ClientDataModeProviderProps) {
  // En producción, forzar false
  const isProd = import.meta.env.PROD;
  
  // Leer de localStorage (solo en desarrollo)
  const [useMock, setUseMockState] = useState<boolean>(() => {
    if (isProd) return false;
    
    const stored = localStorage.getItem('clientapp.useMock');
    return stored === 'true';
  });

  // Sincronizar con localStorage
  const setUseMock = (value: boolean) => {
    if (isProd) {
      console.warn('[ClientDataMode] Cannot set mock mode in production');
      return;
    }
    
    setUseMockState(value);
    localStorage.setItem('clientapp.useMock', value.toString());
  };

  // Sincronizar con DataSourceContext (para compatibilidad con PreviewBar)
  useEffect(() => {
    if (isProd) return;
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'clientapp.useMock') {
        setUseMockState(e.newValue === 'true');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isProd]);

  return (
    <ClientDataModeContext.Provider value={{ useMock, setUseMock }}>
      {children}
    </ClientDataModeContext.Provider>
  );
}

export function useClientDataMode() {
  const context = useContext(ClientDataModeContext);
  if (!context) {
    throw new Error('useClientDataMode must be used within ClientDataModeProvider');
  }
  return context;
}
