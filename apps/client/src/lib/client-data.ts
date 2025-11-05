// Document interface
export interface Document {
  id: number;
  name: string;
  size: string;
  date: string;
  type: 'pdf' | 'image';
  category: 'cliente' | 'proyecto' | 'legal' | 'diseno' | 'construccion';
}

// Phase interface
export interface Phase {
  id: number;
  name: string;
  status: 'completed' | 'in-progress' | 'pending';
  progress: number;
  startDate: string;
  endDate: string;
}

// Client with multiple projects
export const mockClientData = {
  clientId: "client_1",
  clientName: "Familia Martínez",
  projects: [
    {
      id: "project_juriquilla",
      clientName: "Familia Martínez",
      name: "Casa Residencial Juriquilla",
      location: "Juriquilla, Querétaro",
      progress: 45,
      currentPhase: "Estructura",
      projectStage: "construction" as const,
      totalAmount: 4500000,
      totalPaid: 2250000,
      totalPending: 2250000,
      startDate: "2024-03-15",
      estimatedEndDate: "2025-03-15",
      heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
      renders: [
        {
          id: 1,
          url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
          title: "Fachada Principal",
          phase: "Diseño",
          date: "2024-03-20"
        },
        {
          id: 2,
          url: "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
          title: "Vista Interior Sala",
          phase: "Diseño",
          date: "2024-03-22"
        },
        {
          id: 3,
          url: "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80",
          title: "Vista Posterior",
          phase: "Diseño",
          date: "2024-03-25"
        }
      ],
      team: [
        {
          id: 1,
          name: "Arq. Carlos Mendoza",
          role: "Arquitecto Líder",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
          phone: "+52 442 123 4567",
          email: "carlos.mendoza@dovita.mx"
        },
        {
          id: 2,
          name: "Ing. Laura Ramírez",
          role: "Ingeniera de Obra",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura",
          phone: "+52 442 234 5678",
          email: "laura.ramirez@dovita.mx"
        },
        {
          id: 3,
          name: "Lic. Ana Torres",
          role: "Administradora de Proyecto",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana",
          phone: "+52 442 345 6789",
          email: "ana.torres@dovita.mx"
        }
      ],
      documents: [
        { id: 1, name: 'Escrituras.pdf', size: '3.1 MB', date: '1 Mar 2024', type: 'pdf' as const, category: 'cliente' as const },
        { id: 2, name: 'Identificación Oficial.pdf', size: '450 KB', date: '1 Mar 2024', type: 'pdf' as const, category: 'cliente' as const },
        { id: 3, name: 'Planos Arquitectónicos.pdf', size: '2.5 MB', date: '15 Mar 2024', type: 'pdf' as const, category: 'proyecto' as const },
        { id: 4, name: 'Especificaciones Técnicas.pdf', size: '890 KB', date: '8 Mar 2024', type: 'pdf' as const, category: 'proyecto' as const },
        { id: 5, name: 'Contrato de Construcción.pdf', size: '2.8 MB', date: '15 Mar 2024', type: 'pdf' as const, category: 'legal' as const },
        { id: 6, name: 'Permiso de Construcción.pdf', size: '1.5 MB', date: '20 Mar 2024', type: 'pdf' as const, category: 'legal' as const },
        { id: 7, name: 'Diseño Interior.pdf', size: '4.2 MB', date: '12 Mar 2024', type: 'pdf' as const, category: 'diseno' as const },
        { id: 8, name: 'Renders 3D.jpg', size: '2.1 MB', date: '10 Mar 2024', type: 'image' as const, category: 'diseno' as const },
        { id: 9, name: 'Paleta de Colores.pdf', size: '650 KB', date: '8 Mar 2024', type: 'pdf' as const, category: 'diseno' as const },
        { id: 10, name: 'Avance Semana 1.pdf', size: '1.8 MB', date: '22 Mar 2024', type: 'pdf' as const, category: 'construccion' as const },
        { id: 11, name: 'Fotos Obra.jpg', size: '3.5 MB', date: '21 Mar 2024', type: 'image' as const, category: 'construccion' as const },
        { id: 12, name: 'Bitácora Construcción.pdf', size: '920 KB', date: '20 Mar 2024', type: 'pdf' as const, category: 'construccion' as const },
      ] as Document[],
      phases: [
        { id: 1, name: 'Cimentación', status: 'completed' as const, progress: 100, startDate: '8 Abr 2024', endDate: '25 Abr 2024' },
        { id: 2, name: 'Estructura', status: 'in-progress' as const, progress: 45, startDate: '28 Abr 2024', endDate: '30 May 2024' },
        { id: 3, name: 'Instalaciones', status: 'pending' as const, progress: 0, startDate: '1 Jun 2024', endDate: '30 Jun 2024' },
        { id: 4, name: 'Acabados Interiores', status: 'pending' as const, progress: 0, startDate: '1 Jul 2024', endDate: '20 Ago 2024' },
        { id: 5, name: 'Acabados Exteriores', status: 'pending' as const, progress: 0, startDate: '21 Ago 2024', endDate: '10 Sep 2024' },
        { id: 6, name: 'Inspección Final', status: 'pending' as const, progress: 0, startDate: '11 Sep 2024', endDate: '14 Sep 2024' },
        { id: 7, name: 'Entrega', status: 'pending' as const, progress: 0, startDate: '15 Sep 2024', endDate: '15 Sep 2024' },
      ] as Phase[]
    },
    {
      id: "project_playa",
      clientName: "Familia Martínez",
      name: "Casa Playa del Carmen",
      location: "Playa del Carmen, Q. Roo",
      progress: 53, // 2 fases completas (40%) + fase actual 65% de 20% = 53%
      currentPhase: "Diseño de Interiores",
      projectStage: "design" as const,
      totalAmount: 6200000,
      totalPaid: 50000,
      totalPending: 70000,
      startDate: "2024-02-01",
      estimatedEndDate: "2025-12-01",
      heroImage: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
      renders: [
        {
          id: 1,
          url: "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
          title: "Fachada con Vista al Mar",
          phase: "Diseño",
          date: "2024-08-15"
        },
        {
          id: 2,
          url: "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
          title: "Vista Terraza Principal",
          phase: "Diseño",
          date: "2024-08-20"
        }
      ],
      team: [
        {
          id: 1,
          name: "Arq. María González",
          role: "Arquitecta Líder",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
          phone: "+52 984 123 4567",
          email: "maria.gonzalez@dovita.mx"
        },
        {
          id: 2,
          name: "Ing. Roberto Sánchez",
          role: "Ingeniero de Obra",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto",
          phone: "+52 984 234 5678",
          email: "roberto.sanchez@dovita.mx"
        }
      ],
      documents: [
        { id: 13, name: 'Escrituras Terreno Playa.pdf', size: '2.8 MB', date: '10 Feb 2024', type: 'pdf' as const, category: 'cliente' as const },
        { id: 14, name: 'INE Propietario.pdf', size: '380 KB', date: '10 Feb 2024', type: 'pdf' as const, category: 'cliente' as const },
        { id: 15, name: 'Planos Casa Playa.pdf', size: '3.2 MB', date: '20 Feb 2024', type: 'pdf' as const, category: 'proyecto' as const },
        { id: 16, name: 'Especificaciones Técnicas Playa.pdf', size: '1.1 MB', date: '18 Feb 2024', type: 'pdf' as const, category: 'proyecto' as const },
        { id: 17, name: 'Contrato Construcción Playa.pdf', size: '3.0 MB', date: '25 Feb 2024', type: 'pdf' as const, category: 'legal' as const },
        { id: 18, name: 'Propuesta Conceptual.jpg', size: '3.5 MB', date: '5 Mar 2024', type: 'image' as const, category: 'diseno' as const },
        { id: 19, name: 'Diseño Interior Playa.pdf', size: '5.1 MB', date: '15 Mar 2024', type: 'pdf' as const, category: 'diseno' as const },
        { id: 20, name: 'Renders Vista al Mar.jpg', size: '2.8 MB', date: '18 Mar 2024', type: 'image' as const, category: 'diseno' as const },
        { id: 21, name: 'Paleta Tropical.pdf', size: '720 KB', date: '20 Mar 2024', type: 'pdf' as const, category: 'diseno' as const },
        { id: 22, name: 'Render Fachada Principal.jpg', size: '3.2 MB', date: '25 Mar 2024', type: 'image' as const, category: 'diseno' as const },
        { id: 23, name: 'Planos Ejecutivos.pdf', size: '4.5 MB', date: '1 Abr 2024', type: 'pdf' as const, category: 'diseno' as const },
      ] as Document[],
      phases: [
        { id: 1, name: 'Diseño Conceptual', status: 'completed' as const, progress: 100, startDate: '1 Feb 2024', endDate: '20 Feb 2024' },
        { id: 2, name: 'Diseño Arquitectónico', status: 'completed' as const, progress: 100, startDate: '21 Feb 2024', endDate: '15 Mar 2024' },
        { id: 3, name: 'Diseño de Interiores', status: 'in-progress' as const, progress: 65, startDate: '16 Mar 2024', endDate: '10 Abr 2024' },
        { id: 4, name: 'Planos Ejecutivos', status: 'pending' as const, progress: 0, startDate: '11 Abr 2024', endDate: '30 Abr 2024' },
        { id: 5, name: 'Permisos y Licencias', status: 'pending' as const, progress: 0, startDate: '1 May 2024', endDate: '20 May 2024' },
      ] as Phase[]
    }
  ]
};

// Backward compatibility - default to first project
export const mockProjectData = mockClientData.projects[0];

export const mockPhotos = [
  {
    id: 1,
    projectId: "project_juriquilla",
    url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800",
    phase: "Cimentación",
    date: "2024-04-10",
    description: "Excavación completada y cimbra instalada",
    location: { lat: 20.5888, lng: -100.3899 }
  },
  {
    id: 2,
    projectId: "project_juriquilla",
    url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800&q=80",
    phase: "Estructura",
    date: "2024-05-05",
    description: "Columnas de planta baja terminadas",
    location: { lat: 20.5888, lng: -100.3899 }
  },
  {
    id: 3,
    projectId: "project_juriquilla",
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800&q=80",
    phase: "Estructura",
    date: "2024-05-12",
    description: "Losa de entrepiso en proceso",
    location: { lat: 20.5888, lng: -100.3899 }
  },
  {
    id: 4,
    projectId: "project_playa",
    url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=800",
    phase: "Cimentación",
    date: "2024-09-15",
    description: "Inicio de excavación en terreno costero",
    location: { lat: 20.6296, lng: -87.0739 }
  },
  {
    id: 5,
    projectId: "project_playa",
    url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800",
    phase: "Cimentación",
    date: "2024-10-01",
    description: "Cimbra de zapatas instalada",
    location: { lat: 20.6296, lng: -87.0739 }
  }
];

export const mockMinistraciones = [
  {
    id: 1,
    projectId: "project_juriquilla",
    amount: 450000,
    date: "2024-03-15",
    status: "paid" as const,
    concept: "Anticipo - Diseño Arquitectónico"
  },
  {
    id: 2,
    projectId: "project_juriquilla",
    amount: 900000,
    date: "2024-04-01",
    status: "paid" as const,
    concept: "Primera Ministración - Cimentación"
  },
  {
    id: 3,
    projectId: "project_juriquilla",
    amount: 900000,
    date: "2024-05-01",
    status: "pending" as const,
    concept: "Segunda Ministración - Estructura"
  },
  {
    id: 4,
    projectId: "project_juriquilla",
    amount: 900000,
    date: "2024-06-01",
    status: "future" as const,
    concept: "Tercera Ministración - Instalaciones"
  },
  {
    id: 5,
    projectId: "project_playa",
    amount: 50000,
    date: "2024-02-15",
    status: "paid" as const,
    concept: "Anticipo - Proyecto de Diseño"
  },
  {
    id: 6,
    projectId: "project_playa",
    amount: 40000,
    date: "2024-03-20",
    status: "pending" as const,
    concept: "Segunda Ministración - Diseño Arquitectónico"
  },
  {
    id: 7,
    projectId: "project_playa",
    amount: 30000,
    date: "2024-04-15",
    status: "future" as const,
    concept: "Tercera Ministración - Diseño Final"
  }
];

export const appointmentTypes = [
  "Visita al terreno/obra",
  "Revisión de avances",
  "Entrega de documentos",
  "Firma de contratos",
  "Junta de avances",
  "Reunión virtual",
  "Otro"
];

export const mockAppointments = [
  {
    id: 1,
    projectId: "project_juriquilla",
    type: "Revisión de Avances",
    date: "2025-11-05",
    time: "10:00",
    duration: 60,
    status: "confirmed" as const,
    teamMember: {
      id: 1,
      name: "Arq. Carlos Mendoza",
      role: "Arquitecto Líder",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos"
    },
    location: "Obra - Casa Juriquilla",
    notes: "Revisión de estructura y acabados de planta baja",
    isVirtual: false
  },
  {
    id: 2,
    projectId: "project_juriquilla",
    type: "Junta de Avances",
    date: "2025-11-10",
    time: "16:00",
    duration: 45,
    status: "pending" as const,
    teamMember: {
      id: 2,
      name: "Ing. Laura Ramírez",
      role: "Ingeniera de Obra",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura"
    },
    location: "Virtual - Google Meet",
    notes: "Revisión de presupuesto y próximas ministraciones",
    isVirtual: true,
    meetingLink: "https://meet.google.com/abc-defg-hij"
  },
  {
    id: 3,
    projectId: "project_juriquilla",
    type: "Entrega de Documentos",
    date: "2025-10-25",
    time: "11:00",
    duration: 30,
    status: "completed" as const,
    teamMember: {
      id: 3,
      name: "Lic. Ana Torres",
      role: "Administradora de Proyecto",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana"
    },
    location: "Oficina Dovita",
    notes: "Entrega de planos arquitectónicos firmados",
    isVirtual: false
  },
  {
    id: 4,
    projectId: "project_juriquilla",
    type: "Visita al terreno/obra",
    date: "2025-11-15",
    time: "09:00",
    duration: 90,
    status: "confirmed" as const,
    teamMember: {
      id: 1,
      name: "Arq. Carlos Mendoza",
      role: "Arquitecto Líder",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos"
    },
    location: "Terreno - Juriquilla",
    notes: "Inspección final de cimentación antes de proceder con estructura",
    isVirtual: false
  },
  {
    id: 5,
    projectId: "project_playa",
    type: "Revisión de Avances",
    date: "2025-11-08",
    time: "11:00",
    duration: 60,
    status: "confirmed" as const,
    teamMember: {
      id: 1,
      name: "Arq. María González",
      role: "Arquitecta Líder",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria"
    },
    location: "Obra - Playa del Carmen",
    notes: "Revisión de avance en cimentación",
    isVirtual: false
  }
];

export const budgetCategories = [
  { projectId: "project_juriquilla", name: "Materiales", budgeted: 1800000, spent: 850000 },
  { projectId: "project_juriquilla", name: "Mano de Obra", budgeted: 1500000, spent: 680000 },
  { projectId: "project_juriquilla", name: "Permisos y Licencias", budgeted: 300000, spent: 300000 },
  { projectId: "project_juriquilla", name: "Diseño Arquitectónico", budgeted: 450000, spent: 450000 },
  { projectId: "project_juriquilla", name: "Otros Gastos", budgeted: 450000, spent: 120000 },
  { projectId: "project_playa", name: "Materiales", budgeted: 2480000, spent: 350000 },
  { projectId: "project_playa", name: "Mano de Obra", budgeted: 2170000, spent: 280000 },
  { projectId: "project_playa", name: "Permisos y Licencias", budgeted: 620000, spent: 300000 },
  { projectId: "project_playa", name: "Diseño Arquitectónico", budgeted: 620000, spent: 0 },
  { projectId: "project_playa", name: "Otros Gastos", budgeted: 310000, spent: 0 }
];

// Group chat messages
export const mockChatMessages = [
  {
    id: 1,
    projectId: "project_juriquilla",
    content: "Buenos días familia Martínez, les comparto las fotos del avance de esta semana. Como pueden ver, ya terminamos la estructura de planta baja.",
    timestamp: "2025-10-28T09:30:00",
    isClient: false,
    sender: {
      name: "Arq. Carlos Mendoza",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
      role: "Arquitecto Líder"
    },
    status: "read" as const
  },
  {
    id: 2,
    projectId: "project_juriquilla",
    content: "¡Se ve increíble! Muchas gracias por mantenernos informados. ¿Cuándo empezarían con la losa del segundo piso?",
    timestamp: "2025-10-28T10:15:00",
    isClient: true,
    status: "read" as const
  },
  {
    id: 3,
    projectId: "project_juriquilla",
    content: "Con gusto! De acuerdo al cronograma, comenzamos con la losa la próxima semana. El concreto ya está programado para el miércoles.",
    timestamp: "2025-10-28T10:20:00",
    isClient: false,
    sender: {
      name: "Ing. Laura Ramírez",
      role: "Ingeniera de Obra",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura"
    },
    status: "read" as const
  },
  {
    id: 4,
    projectId: "project_juriquilla",
    content: "Perfecto. Por cierto, ya subí los documentos que me solicitaron a la carpeta de Documentos.",
    timestamp: "2025-10-28T10:25:00",
    isClient: true,
    status: "read" as const
  },
  {
    id: 5,
    projectId: "project_juriquilla",
    content: "Excelente, ya los recibimos. Todo está en orden. Les confirmo que su próxima ministración está programada para el 5 de noviembre.",
    timestamp: "2025-10-28T11:00:00",
    isClient: false,
    sender: {
      name: "Lic. Ana Torres",
      role: "Administradora de Proyecto",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Ana"
    },
    status: "read" as const
  },
  {
    id: 6,
    projectId: "project_juriquilla",
    content: "Gracias Ana. Una pregunta, ¿podríamos agendar una visita para este fin de semana? Queremos ver el avance en persona.",
    timestamp: "2025-10-28T14:30:00",
    isClient: true,
    status: "read" as const
  },
  {
    id: 7,
    projectId: "project_juriquilla",
    content: "¡Claro que sí! Los espero el sábado a las 10:00 AM. Les haré un recorrido completo y podemos revisar cualquier detalle que tengan en mente.",
    timestamp: "2025-10-28T14:45:00",
    isClient: false,
    sender: {
      name: "Arq. Carlos Mendoza",
      role: "Arquitecto Líder",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos"
    },
    status: "read" as const
  },
  {
    id: 8,
    projectId: "project_juriquilla",
    content: "Perfecto, ahí estaremos. ¡Muchas gracias a todos por el excelente trabajo!",
    timestamp: "2025-10-28T15:00:00",
    isClient: true,
    status: "delivered" as const
  },
  {
    id: 9,
    projectId: "project_juriquilla",
    content: "Para nosotros es un placer trabajar con ustedes. ¡Nos vemos el sábado! 👍",
    timestamp: "2025-10-28T15:05:00",
    isClient: false,
    sender: {
      name: "Ing. Laura Ramírez",
      role: "Ingeniera de Obra",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura"
    },
    status: "delivered" as const
  },
  {
    id: 10,
    projectId: "project_playa",
    content: "Hola familia Martínez! Les comparto el avance de la cimentación en Playa del Carmen. Todo va según lo planeado.",
    timestamp: "2025-10-30T10:00:00",
    isClient: false,
    sender: {
      name: "Arq. María González",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Maria",
      role: "Arquitecta Líder"
    },
    status: "read" as const
  },
  {
    id: 11,
    projectId: "project_playa",
    content: "¡Qué emoción! Gracias por el update María. ¿Ya tienen fecha estimada para terminar la cimentación?",
    timestamp: "2025-10-30T10:30:00",
    isClient: true,
    status: "read" as const
  },
  {
    id: 12,
    projectId: "project_playa",
    content: "Sí! Estimamos tenerla lista para mediados de noviembre. El clima nos ha favorecido mucho.",
    timestamp: "2025-10-30T11:00:00",
    isClient: false,
    sender: {
      name: "Ing. Roberto Sánchez",
      role: "Ingeniero de Obra",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Roberto"
    },
    status: "delivered" as const
  }
];

// ==========================================
// SUPABASE INTEGRATION (READ-ONLY)
// ==========================================

import { supabase } from './supabase';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

// Helper to get signed URL for private files
async function getSignedUrl(path: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('project_docs')
    .createSignedUrl(path, 3600);
  
  if (error) {
    console.error('Error getting signed URL:', error);
    return '';
  }
  
  return data?.signedUrl || '';
}

// ==========================================
// API FUNCTIONS
// ==========================================

export async function getClientProjects(userId: string) {
  if (USE_MOCK) {
    return mockClientData.projects;
  }

  try {
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        id,
        client_id,
        status,
        created_at,
        updated_at,
        notas,
        ubicacion_json,
        terreno_m2,
        clients!inner(
          id,
          name,
          email,
          phone
        )
      `)
      .eq('clients.id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching projects:', error);
      return [];
    }

    return projects || [];
  } catch (error) {
    console.error('Error in getClientProjects:', error);
    return [];
  }
}

export async function getProjectSummary(projectId: string) {
  if (USE_MOCK) {
    const project = mockClientData.projects.find(p => p.id === projectId);
    return project || null;
  }

  try {
    // Get basic project info
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select(`
        id,
        status,
        created_at,
        updated_at,
        notas,
        ubicacion_json,
        terreno_m2,
        clients!inner(
          id,
          name
        )
      `)
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      return null;
    }

    // TODO: Calculate progress from gantt_plans or construction progress
    // For now, return basic data structure
    return {
      id: project.id,
      clientName: project.clients?.name || 'Cliente',
      name: project.clients?.name || 'Proyecto', // TODO: projects table needs name field
      location: project.ubicacion_json?.formatted || 'Sin ubicación',
      progress: 0, // TODO: calculate from gantt or construction data
      currentPhase: 'En proceso',
      projectStage: 'construction' as const,
      totalAmount: 0, // TODO: sum from budgets
      totalPaid: 0, // TODO: sum from transactions
      totalPending: 0,
      startDate: project.created_at,
      estimatedEndDate: project.updated_at, // TODO: get from gantt plan
      status: project.status,
      notes: project.notas
    };
  } catch (error) {
    console.error('Error in getProjectSummary:', error);
    return null;
  }
}

export async function getProjectPhotos(projectId: string) {
  if (USE_MOCK) {
    return mockPhotos.filter(p => p.projectId === projectId);
  }

  try {
    const { data: photos, error } = await supabase
      .from('construction_photos')
      .select('*')
      .eq('project_id', projectId)
      .eq('visibilidad', 'cliente')
      .order('fecha_foto', { ascending: false });

    if (error) {
      console.error('Error fetching photos:', error);
      return [];
    }

    // Get signed URLs for photos
    const photosWithUrls = await Promise.all(
      (photos || []).map(async (photo) => {
        const signedUrl = await getSignedUrl(photo.file_url);
        return {
          id: photo.id,
          projectId: photo.project_id,
          url: signedUrl || photo.file_url,
          phase: 'Construcción', // TODO: link to design_phases
          date: photo.fecha_foto,
          description: photo.descripcion || '',
          location: photo.latitude && photo.longitude 
            ? { lat: Number(photo.latitude), lng: Number(photo.longitude) }
            : undefined
        };
      })
    );

    return photosWithUrls;
  } catch (error) {
    console.error('Error in getProjectPhotos:', error);
    return [];
  }
}

export async function getProjectDocuments(projectId: string) {
  if (USE_MOCK) {
    const project = mockClientData.projects.find(p => p.id === projectId);
    return project?.documents || [];
  }

  try {
    const { data: documents, error } = await supabase
      .from('documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('visibilidad', 'cliente')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return [];
    }

    // Get signed URLs for documents
    const docsWithUrls = await Promise.all(
      (documents || []).map(async (doc) => {
        const signedUrl = await getSignedUrl(doc.file_url);
        return {
          id: doc.id,
          name: doc.nombre,
          size: doc.file_size ? `${(doc.file_size / 1024 / 1024).toFixed(2)} MB` : 'N/A',
          date: new Date(doc.created_at).toLocaleDateString('es-MX'),
          type: doc.file_type?.includes('image') ? 'image' as const : 'pdf' as const,
          category: doc.tipo_carpeta as Document['category'],
          url: signedUrl || doc.file_url
        };
      })
    );

    return docsWithUrls;
  } catch (error) {
    console.error('Error in getProjectDocuments:', error);
    return [];
  }
}

export async function getProjectAppointments(projectId: string) {
  if (USE_MOCK) {
    return mockAppointments.filter(a => a.projectId === projectId);
  }

  try {
    const { data: events, error } = await supabase
      .from('calendar_events')
      .select(`
        id,
        title,
        start_at,
        end_at,
        notes,
        attendees,
        project_id
      `)
      .eq('project_id', projectId)
      .order('start_at', { ascending: true });

    if (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }

    // Transform to appointment format
    const appointments = (events || []).map((event) => {
      const startDate = new Date(event.start_at);
      const endDate = new Date(event.end_at);
      const duration = Math.round((endDate.getTime() - startDate.getTime()) / 60000);
      
      return {
        id: event.id,
        projectId: event.project_id,
        type: event.title,
        date: startDate.toISOString().split('T')[0],
        time: startDate.toTimeString().slice(0, 5),
        duration,
        status: (startDate < new Date() ? 'completed' : 'confirmed') as const,
        teamMember: {
          id: 1,
          name: 'Equipo Dovita',
          role: 'Coordinador',
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Team'
        },
        location: 'Por definir',
        notes: event.notes || '',
        isVirtual: false
      };
    });

    return appointments;
  } catch (error) {
    console.error('Error in getProjectAppointments:', error);
    return [];
  }
}

export async function getProjectFinancial(projectId: string) {
  if (USE_MOCK) {
    const ministrations = mockMinistraciones.filter(m => m.projectId === projectId);
    const categories = budgetCategories.filter(c => c.projectId === projectId);
    
    return {
      ministrations,
      categories,
      summary: {
        totalAmount: ministrations.reduce((sum, m) => sum + m.amount, 0),
        totalPaid: ministrations
          .filter(m => m.status === 'paid')
          .reduce((sum, m) => sum + m.amount, 0),
        totalPending: ministrations
          .filter(m => m.status === 'pending')
          .reduce((sum, m) => sum + m.amount, 0)
      }
    };
  }

  try {
    // Get ministrations from gantt
    const { data: ganttData, error: ganttError } = await supabase
      .from('gantt_plans')
      .select(`
        id,
        gantt_ministrations (
          id,
          date,
          label,
          percent,
          accumulated_percent,
          alcance
        )
      `)
      .eq('project_id', projectId)
      .eq('type', 'ejecutivo')
      .eq('shared_with_construction', true)
      .single();

    if (ganttError) {
      console.error('Error fetching gantt ministrations:', ganttError);
    }

    const ministrations = (ganttData?.gantt_ministrations || []).map((m: any) => ({
      id: m.id,
      projectId,
      amount: 0, // TODO: calculate from budget total * percent
      date: m.date,
      status: new Date(m.date) < new Date() ? 'paid' as const : 'future' as const,
      concept: m.label || m.alcance || 'Ministración'
    }));

    // Get financial summary from view
    const { data: summary, error: summaryError } = await supabase
      .from('vw_client_financial_summary')
      .select('*')
      .eq('project_id', projectId);

    if (summaryError) {
      console.error('Error fetching financial summary:', summaryError);
    }

    const categories = (summary || []).map((item: any) => ({
      projectId,
      name: item.mayor_name || 'Categoría',
      budgeted: item.mayor_expense || 0,
      spent: 0 // TODO: calculate from transactions
    }));

    return {
      ministrations,
      categories,
      summary: {
        totalAmount: summary?.[0]?.total_deposits || 0,
        totalPaid: summary?.[0]?.total_deposits || 0,
        totalPending: summary?.[0]?.balance || 0
      }
    };
  } catch (error) {
    console.error('Error in getProjectFinancial:', error);
    return {
      ministrations: [],
      categories: [],
      summary: { totalAmount: 0, totalPaid: 0, totalPending: 0 }
    };
  }
}
