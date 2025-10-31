export const mockProjectData = {
  id: 1,
  clientName: "Familia Martínez",
  name: "Casa Residencial Juriquilla",
  location: "Juriquilla, Querétaro",
  progress: 45,
  currentPhase: "Estructura",
  totalAmount: 4500000,
  totalPaid: 2250000,
  totalPending: 2250000,
  startDate: "2024-03-15",
  estimatedEndDate: "2025-03-15",
  heroImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80", // Modern house render
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
  ]
};

export const mockPhotos = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800",
    phase: "Cimentación",
    date: "2024-04-10",
    description: "Excavación completada y cimbra instalada",
    location: { lat: 20.5888, lng: -100.3899 }
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=800",
    phase: "Estructura",
    date: "2024-05-05",
    description: "Columnas de planta baja terminadas",
    location: { lat: 20.5888, lng: -100.3899 }
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1590496793907-3dc8f7661e9f?w=800",
    phase: "Estructura",
    date: "2024-05-12",
    description: "Losa de entrepiso en proceso",
    location: { lat: 20.5888, lng: -100.3899 }
  }
];

export const mockMinistraciones = [
  {
    id: 1,
    amount: 450000,
    date: "2024-03-15",
    status: "paid" as const,
    concept: "Anticipo - Diseño Arquitectónico"
  },
  {
    id: 2,
    amount: 900000,
    date: "2024-04-01",
    status: "paid" as const,
    concept: "Primera Ministración - Cimentación"
  },
  {
    id: 3,
    amount: 900000,
    date: "2024-05-01",
    status: "pending" as const,
    concept: "Segunda Ministración - Estructura"
  },
  {
    id: 4,
    amount: 900000,
    date: "2024-06-01",
    status: "future" as const,
    concept: "Tercera Ministración - Instalaciones"
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
  }
];

export const budgetCategories = [
  { name: "Materiales", budgeted: 1800000, spent: 850000 },
  { name: "Mano de Obra", budgeted: 1500000, spent: 680000 },
  { name: "Permisos y Licencias", budgeted: 300000, spent: 300000 },
  { name: "Diseño Arquitectónico", budgeted: 450000, spent: 450000 },
  { name: "Otros Gastos", budgeted: 450000, spent: 120000 }
];

// Group chat messages
export const mockChatMessages = [
  {
    id: 1,
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
    content: "¡Se ve increíble! Muchas gracias por mantenernos informados. ¿Cuándo empezarían con la losa del segundo piso?",
    timestamp: "2025-10-28T10:15:00",
    isClient: true,
    status: "read" as const
  },
  {
    id: 3,
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
    content: "Perfecto. Por cierto, ya subí los documentos que me solicitaron a la carpeta de Documentos.",
    timestamp: "2025-10-28T10:25:00",
    isClient: true,
    status: "read" as const
  },
  {
    id: 5,
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
    content: "Gracias Ana. Una pregunta, ¿podríamos agendar una visita para este fin de semana? Queremos ver el avance en persona.",
    timestamp: "2025-10-28T14:30:00",
    isClient: true,
    status: "read" as const
  },
  {
    id: 7,
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
    content: "Perfecto, ahí estaremos. ¡Muchas gracias a todos por el excelente trabajo!",
    timestamp: "2025-10-28T15:00:00",
    isClient: true,
    status: "delivered" as const
  },
  {
    id: 9,
    content: "Para nosotros es un placer trabajar con ustedes. ¡Nos vemos el sábado! 👍",
    timestamp: "2025-10-28T15:05:00",
    isClient: false,
    sender: {
      name: "Ing. Laura Ramírez",
      role: "Ingeniera de Obra",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Laura"
    },
    status: "delivered" as const
  }
];
