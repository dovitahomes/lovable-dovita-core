// Tipos para las vistas del cliente
export interface ClientProject {
  project_id: string;
  client_id: string;
  client_name: string;
  client_email: string;
  project_status: string;
  terreno_m2: number | null;
  ubicacion_json: any;
  created_at: string;
}

export interface ClientProjectSummary {
  project_id: string;
  project_name: string;
  start_date: string | null;
  estimated_end_date: string | null;
  progress_percent: number;
  total_amount: number;
  total_paid: number;
  total_pending: number;
  last_payment_at: string | null;
  status: string;
}

export interface ClientDocument {
  doc_id: string;
  project_id: string;
  name: string;
  storage_path: string;
  mime_type: string;
  file_size: number;
  uploaded_at: string;
  visibility: string;
  category: string;
  label: string | null;
}

export interface ClientPhoto {
  photo_id: string;
  project_id: string;
  storage_path: string;
  caption: string | null;
  taken_at: string;
  visibility: string;
  latitude: number | null;
  longitude: number | null;
  phase_name: string;
}

export interface ClientMinistration {
  project_id: string;
  seq: number;
  label: string;
  percent: number;
  cumulative_percent: number;
  notes: string | null;
  date: string;
}

export interface ClientFinancialSummary {
  project_id: string;
  total_amount: number;
  paid_amount: number;
  pending_amount: number;
  spent_amount: number;
  last_payment_at: string | null;
}

export interface ClientBudgetCategory {
  project_id: string;
  mayor_id: string;
  name: string;
  budgeted: number;
  spent: number;
}

export interface ClientAppointment {
  appointment_id: string;
  project_id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  notes: string | null;
  location: string | null;
  attendees: any;
}

// Tipo Database para Supabase client
export interface Database {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          email: string | null;
          phone: string | null;
          created_at: string;
        };
      };
      projects: {
        Row: {
          id: string;
          client_id: string;
          status: string;
          terreno_m2: number | null;
          ubicacion_json: any;
          created_at: string;
        };
      };
    };
    Views: {
      v_client_projects: {
        Row: ClientProject;
      };
      v_client_project_summary: {
        Row: ClientProjectSummary;
      };
      v_client_documents: {
        Row: ClientDocument;
      };
      v_client_photos: {
        Row: ClientPhoto;
      };
      v_client_ministrations: {
        Row: ClientMinistration;
      };
      v_client_financial_summary: {
        Row: ClientFinancialSummary;
      };
      v_client_budget_categories: {
        Row: ClientBudgetCategory;
      };
      v_client_appointments: {
        Row: ClientAppointment;
      };
    };
  };
}
