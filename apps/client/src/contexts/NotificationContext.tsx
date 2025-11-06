import { createContext, useContext, useState, ReactNode } from 'react';

export interface Notification {
  id: string;
  type: 'chat' | 'calendar' | 'document' | 'photo';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  projectId: string;
  actionUrl?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'chat',
    title: 'Nuevo mensaje',
    message: 'Arq. Carlos Mendoza: "Buenos días, les comparto las fotos del avance..."',
    timestamp: '2025-11-04T10:30:00',
    read: false,
    projectId: 'project_juriquilla',
    actionUrl: '/client/chat'
  },
  {
    id: '2',
    type: 'calendar',
    title: 'Cita confirmada',
    message: 'Tu cita de "Revisión de Avances" ha sido confirmada para el 5 de Nov',
    timestamp: '2025-11-03T15:20:00',
    read: false,
    projectId: 'project_juriquilla',
    actionUrl: '/client/appointments'
  },
  {
    id: '3',
    type: 'document',
    title: 'Nuevo documento',
    message: 'Se ha agregado "Planos Ejecutivos.pdf" a la carpeta de Diseño',
    timestamp: '2025-11-02T09:15:00',
    read: false,
    projectId: 'project_playa',
    actionUrl: '/client/documents'
  },
  {
    id: '4',
    type: 'photo',
    title: 'Nuevas fotos de obra',
    message: '5 fotos nuevas de la fase de Estructura',
    timestamp: '2025-11-01T14:45:00',
    read: true,
    projectId: 'project_juriquilla',
    actionUrl: '/client/photos'
  },
  {
    id: '5',
    type: 'chat',
    title: 'Nuevo mensaje',
    message: 'Ing. Laura Ramírez: "El concreto está programado para el miércoles"',
    timestamp: '2025-10-31T11:20:00',
    read: true,
    projectId: 'project_juriquilla',
    actionUrl: '/client/chat'
  }
];

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'read' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      read: false,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [newNotification, ...prev]);
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        addNotification
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
