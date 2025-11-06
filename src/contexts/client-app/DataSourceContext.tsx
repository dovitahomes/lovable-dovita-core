import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type DataSource = 'mock' | 'real';

interface DataSourceContextType {
  source: DataSource;
  setSource: (source: DataSource) => void;
  forceClientId: string | null;
  setForceClientId: (id: string | null) => void;
  isPreviewMode: boolean;
}

const DataSourceContext = createContext<DataSourceContextType | undefined>(undefined);

export function DataSourceProvider({ children }: { children: ReactNode }) {
  const [source, setSourceState] = useState<DataSource>(() => {
    const saved = localStorage.getItem('clientapp.useMock');
    return saved === 'false' ? 'real' : 'mock';
  });
  
  const [forceClientId, setForceClientIdState] = useState<string | null>(() => {
    return localStorage.getItem('clientapp.forceClientId');
  });

  const [isPreviewMode, setIsPreviewMode] = useState(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromUrl = urlParams.has('preview');
    const fromStorage = localStorage.getItem('clientapp.previewMode') === 'true';
    return fromUrl || fromStorage;
  });
  
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('preview')) {
      setIsPreviewMode(true);
      localStorage.setItem('clientapp.previewMode', 'true');
    }
  }, []);
  
  const setSource = (newSource: DataSource) => {
    setSourceState(newSource);
    // Persistir en localStorage para mantener estado entre sesiones
    localStorage.setItem('clientapp.useMock', newSource === 'mock' ? 'true' : 'false');
  };

  const setForceClientId = (id: string | null) => {
    setForceClientIdState(id);
    if (id) {
      // Guardar cliente seleccionado
      localStorage.setItem('clientapp.forceClientId', id);
    } else {
      // Limpiar si no hay cliente
      localStorage.removeItem('clientapp.forceClientId');
    }
  };
  
  return (
    <DataSourceContext.Provider 
      value={{ 
        source, 
        setSource, 
        forceClientId, 
        setForceClientId,
        isPreviewMode
      }}
    >
      {children}
    </DataSourceContext.Provider>
  );
}

export function useDataSource() {
  const context = useContext(DataSourceContext);
  if (!context) {
    throw new Error('useDataSource must be used within DataSourceProvider');
  }
  return context;
}
