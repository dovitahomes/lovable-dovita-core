export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      alianzas: {
        Row: {
          activa: boolean | null
          comision_porcentaje: number | null
          contacto_email: string | null
          contacto_nombre: string | null
          contacto_telefono: string | null
          created_at: string
          fecha_fin: string | null
          fecha_inicio: string | null
          id: string
          nombre: string
          notas: string | null
          tipo: string
          updated_at: string
        }
        Insert: {
          activa?: boolean | null
          comision_porcentaje?: number | null
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          nombre: string
          notas?: string | null
          tipo: string
          updated_at?: string
        }
        Update: {
          activa?: boolean | null
          comision_porcentaje?: number | null
          contacto_email?: string | null
          contacto_nombre?: string | null
          contacto_telefono?: string | null
          created_at?: string
          fecha_fin?: string | null
          fecha_inicio?: string | null
          id?: string
          nombre?: string
          notas?: string | null
          tipo?: string
          updated_at?: string
        }
        Relationships: []
      }
      budget_attachments: {
        Row: {
          budget_item_id: string
          created_at: string
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_by: string | null
        }
        Insert: {
          budget_item_id: string
          created_at?: string
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          budget_item_id?: string
          created_at?: string
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_attachments_budget_item_id_fkey"
            columns: ["budget_item_id"]
            isOneToOne: false
            referencedRelation: "budget_items"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          budget_id: string
          cant_necesaria: number | null
          cant_real: number
          costo_unit: number
          created_at: string
          descripcion: string | null
          desperdicio_pct: number
          honorarios_pct: number
          id: string
          mayor_id: string | null
          order_index: number
          partida_id: string | null
          precio_unit: number | null
          proveedor_alias: string | null
          subpartida_id: string | null
          total: number | null
          unidad: string
        }
        Insert: {
          budget_id: string
          cant_necesaria?: number | null
          cant_real?: number
          costo_unit?: number
          created_at?: string
          descripcion?: string | null
          desperdicio_pct?: number
          honorarios_pct?: number
          id?: string
          mayor_id?: string | null
          order_index?: number
          partida_id?: string | null
          precio_unit?: number | null
          proveedor_alias?: string | null
          subpartida_id?: string | null
          total?: number | null
          unidad: string
        }
        Update: {
          budget_id?: string
          cant_necesaria?: number | null
          cant_real?: number
          costo_unit?: number
          created_at?: string
          descripcion?: string | null
          desperdicio_pct?: number
          honorarios_pct?: number
          id?: string
          mayor_id?: string | null
          order_index?: number
          partida_id?: string | null
          precio_unit?: number | null
          proveedor_alias?: string | null
          subpartida_id?: string | null
          total?: number | null
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_mayor_id_fkey"
            columns: ["mayor_id"]
            isOneToOne: false
            referencedRelation: "tu_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_partida_id_fkey"
            columns: ["partida_id"]
            isOneToOne: false
            referencedRelation: "tu_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_subpartida_id_fkey"
            columns: ["subpartida_id"]
            isOneToOne: false
            referencedRelation: "tu_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_templates: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          items: Json
          name: string
          type: Database["public"]["Enums"]["budget_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          items: Json
          name: string
          type: Database["public"]["Enums"]["budget_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          items?: Json
          name?: string
          type?: Database["public"]["Enums"]["budget_type"]
        }
        Relationships: []
      }
      budgets: {
        Row: {
          cliente_view_enabled: boolean
          created_at: string
          created_by: string | null
          id: string
          is_template: boolean
          iva_enabled: boolean
          notas: string | null
          project_id: string
          published_at: string | null
          shared_with_construction: boolean
          status: Database["public"]["Enums"]["budget_status"]
          template_name: string | null
          type: Database["public"]["Enums"]["budget_type"]
          updated_at: string
          version: number
        }
        Insert: {
          cliente_view_enabled?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          is_template?: boolean
          iva_enabled?: boolean
          notas?: string | null
          project_id: string
          published_at?: string | null
          shared_with_construction?: boolean
          status?: Database["public"]["Enums"]["budget_status"]
          template_name?: string | null
          type: Database["public"]["Enums"]["budget_type"]
          updated_at?: string
          version?: number
        }
        Update: {
          cliente_view_enabled?: boolean
          created_at?: string
          created_by?: string | null
          id?: string
          is_template?: boolean
          iva_enabled?: boolean
          notas?: string | null
          project_id?: string
          published_at?: string | null
          shared_with_construction?: boolean
          status?: Database["public"]["Enums"]["budget_status"]
          template_name?: string | null
          type?: Database["public"]["Enums"]["budget_type"]
          updated_at?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address_json: Json | null
          created_at: string
          email: string | null
          fiscal_json: Json | null
          id: string
          name: string
          person_type: Database["public"]["Enums"]["person_type"]
          phone: string | null
          updated_at: string
        }
        Insert: {
          address_json?: Json | null
          created_at?: string
          email?: string | null
          fiscal_json?: Json | null
          id?: string
          name: string
          person_type: Database["public"]["Enums"]["person_type"]
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address_json?: Json | null
          created_at?: string
          email?: string | null
          fiscal_json?: Json | null
          id?: string
          name?: string
          person_type?: Database["public"]["Enums"]["person_type"]
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contenido_corporativo: {
        Row: {
          color_primario: string | null
          color_secundario: string | null
          created_at: string
          direccion: string | null
          email_principal: string | null
          email_secundario: string | null
          id: string
          isotipo_url: string | null
          logo_url: string | null
          nombre_empresa: string
          sitio_web: string | null
          telefono_principal: string | null
          telefono_secundario: string | null
          updated_at: string
        }
        Insert: {
          color_primario?: string | null
          color_secundario?: string | null
          created_at?: string
          direccion?: string | null
          email_principal?: string | null
          email_secundario?: string | null
          id?: string
          isotipo_url?: string | null
          logo_url?: string | null
          nombre_empresa: string
          sitio_web?: string | null
          telefono_principal?: string | null
          telefono_secundario?: string | null
          updated_at?: string
        }
        Update: {
          color_primario?: string | null
          color_secundario?: string | null
          created_at?: string
          direccion?: string | null
          email_principal?: string | null
          email_secundario?: string | null
          id?: string
          isotipo_url?: string | null
          logo_url?: string | null
          nombre_empresa?: string
          sitio_web?: string | null
          telefono_principal?: string | null
          telefono_secundario?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          created_at: string
          etiqueta: string | null
          file_size: number | null
          file_type: string | null
          file_url: string
          firmado: boolean
          id: string
          metadata: Json | null
          nombre: string
          project_id: string
          tipo_carpeta: string
          updated_at: string
          uploaded_by: string | null
          visibilidad: string
        }
        Insert: {
          created_at?: string
          etiqueta?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url: string
          firmado?: boolean
          id?: string
          metadata?: Json | null
          nombre: string
          project_id: string
          tipo_carpeta: string
          updated_at?: string
          uploaded_by?: string | null
          visibilidad: string
        }
        Update: {
          created_at?: string
          etiqueta?: string | null
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          firmado?: boolean
          id?: string
          metadata?: Json | null
          nombre?: string
          project_id?: string
          tipo_carpeta?: string
          updated_at?: string
          uploaded_by?: string | null
          visibilidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      gantt_items: {
        Row: {
          created_at: string
          end_date: string
          gantt_id: string
          id: string
          major_id: string
          order_index: number
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          gantt_id: string
          id?: string
          major_id: string
          order_index?: number
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          gantt_id?: string
          id?: string
          major_id?: string
          order_index?: number
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "gantt_items_gantt_id_fkey"
            columns: ["gantt_id"]
            isOneToOne: false
            referencedRelation: "gantt_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gantt_items_major_id_fkey"
            columns: ["major_id"]
            isOneToOne: false
            referencedRelation: "tu_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      gantt_ministrations: {
        Row: {
          alcance: string | null
          created_at: string
          date: string
          gantt_id: string
          id: string
          label: string
          order_index: number
        }
        Insert: {
          alcance?: string | null
          created_at?: string
          date: string
          gantt_id: string
          id?: string
          label: string
          order_index?: number
        }
        Update: {
          alcance?: string | null
          created_at?: string
          date?: string
          gantt_id?: string
          id?: string
          label?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "gantt_ministrations_gantt_id_fkey"
            columns: ["gantt_id"]
            isOneToOne: false
            referencedRelation: "gantt_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      gantt_plans: {
        Row: {
          created_at: string
          id: string
          project_id: string
          shared_with_construction: boolean
          type: Database["public"]["Enums"]["gantt_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          shared_with_construction?: boolean
          type: Database["public"]["Enums"]["gantt_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          shared_with_construction?: boolean
          type?: Database["public"]["Enums"]["gantt_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "gantt_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          client_id: string | null
          contacto_json: Json | null
          created_at: string
          direccion: string | null
          email: string | null
          estado: string | null
          id: string
          nombre_completo: string | null
          notas: string | null
          origen: string | null
          origen_lead: string[] | null
          presupuesto_referencia: number | null
          status: Database["public"]["Enums"]["lead_status"]
          sucursal_id: string | null
          telefono: string | null
          terreno_m2: number | null
          ubicacion_terreno_json: Json | null
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          contacto_json?: Json | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          nombre_completo?: string | null
          notas?: string | null
          origen?: string | null
          origen_lead?: string[] | null
          presupuesto_referencia?: number | null
          status?: Database["public"]["Enums"]["lead_status"]
          sucursal_id?: string | null
          telefono?: string | null
          terreno_m2?: number | null
          ubicacion_terreno_json?: Json | null
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          contacto_json?: Json | null
          created_at?: string
          direccion?: string | null
          email?: string | null
          estado?: string | null
          id?: string
          nombre_completo?: string | null
          notas?: string | null
          origen?: string | null
          origen_lead?: string[] | null
          presupuesto_referencia?: number | null
          status?: Database["public"]["Enums"]["lead_status"]
          sucursal_id?: string | null
          telefono?: string | null
          terreno_m2?: number | null
          ubicacion_terreno_json?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          observed_at: string
          precio_unit: number
          proveedor_id: string | null
          source: string | null
          subpartida_id: string
          unidad: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          observed_at?: string
          precio_unit: number
          proveedor_id?: string | null
          source?: string | null
          subpartida_id: string
          unidad: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          observed_at?: string
          precio_unit?: number
          proveedor_id?: string | null
          source?: string | null
          subpartida_id?: string
          unidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_subpartida_id_fkey"
            columns: ["subpartida_id"]
            isOneToOne: false
            referencedRelation: "tu_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      pricing_config: {
        Row: {
          id: string
          updated_at: string
          variance_threshold_pct: number
        }
        Insert: {
          id?: string
          updated_at?: string
          variance_threshold_pct?: number
        }
        Update: {
          id?: string
          updated_at?: string
          variance_threshold_pct?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_members: {
        Row: {
          created_at: string
          id: string
          project_id: string
          role_en_proyecto: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          role_en_proyecto?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          role_en_proyecto?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          client_id: string
          created_at: string
          id: string
          notas: string | null
          status: Database["public"]["Enums"]["project_status"]
          sucursal_id: string | null
          terreno_m2: number | null
          ubicacion_json: Json | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          notas?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          sucursal_id?: string | null
          terreno_m2?: number | null
          ubicacion_json?: Json | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          notas?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          sucursal_id?: string | null
          terreno_m2?: number | null
          ubicacion_json?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      sucursales: {
        Row: {
          activa: boolean | null
          ciudad: string | null
          codigo_postal: string | null
          created_at: string
          direccion: string
          email: string | null
          estado: string | null
          id: string
          nombre: string
          responsable: string | null
          telefono: string | null
          updated_at: string
        }
        Insert: {
          activa?: boolean | null
          ciudad?: string | null
          codigo_postal?: string | null
          created_at?: string
          direccion: string
          email?: string | null
          estado?: string | null
          id?: string
          nombre: string
          responsable?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Update: {
          activa?: boolean | null
          ciudad?: string | null
          codigo_postal?: string | null
          created_at?: string
          direccion?: string
          email?: string | null
          estado?: string | null
          id?: string
          nombre?: string
          responsable?: string | null
          telefono?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      tu_nodes: {
        Row: {
          code: string
          created_at: string
          id: string
          is_universal: boolean
          name: string
          order_index: number
          parent_id: string | null
          project_scope: Database["public"]["Enums"]["project_scope"]
          scope_id: string | null
          type: Database["public"]["Enums"]["node_type"]
          unit_default: string | null
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_universal?: boolean
          name: string
          order_index?: number
          parent_id?: string | null
          project_scope?: Database["public"]["Enums"]["project_scope"]
          scope_id?: string | null
          type: Database["public"]["Enums"]["node_type"]
          unit_default?: string | null
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_universal?: boolean
          name?: string
          order_index?: number
          parent_id?: string | null
          project_scope?: Database["public"]["Enums"]["project_scope"]
          scope_id?: string | null
          type?: Database["public"]["Enums"]["node_type"]
          unit_default?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tu_nodes_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "tu_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          profile_id: string | null
          sucursal_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          profile_id?: string | null
          sucursal_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          profile_id?: string | null
          sucursal_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "users_sucursal_id_fkey"
            columns: ["sucursal_id"]
            isOneToOne: false
            referencedRelation: "sucursales"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          firma_tipo: string | null
          firma_url: string | null
          firmado: boolean
          firmado_at: string | null
          id: string
          payload: Json
          project_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          firma_tipo?: string | null
          firma_url?: string | null
          firmado?: boolean
          firmado_at?: string | null
          id?: string
          payload: Json
          project_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          firma_tipo?: string | null
          firma_url?: string | null
          firmado?: boolean
          firmado_at?: string | null
          id?: string
          payload?: Json
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_price_variance: {
        Args: { new_price: number; subpartida_id_param: string }
        Returns: {
          has_variance: boolean
          previous_price: number
          threshold_pct: number
          variance_pct: number
        }[]
      }
      get_budget_subtotals: {
        Args: { budget_id_param: string }
        Returns: {
          mayor_id: string
          mayor_name: string
          subtotal: number
        }[]
      }
      get_full_code: { Args: { node_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      save_price_history: {
        Args: {
          precio_param: number
          proveedor_param?: string
          source_param?: string
          subpartida_id_param: string
          unidad_param: string
        }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "user" | "colaborador" | "cliente"
      budget_status: "borrador" | "publicado"
      budget_type: "parametrico" | "ejecutivo"
      gantt_type: "parametrico" | "ejecutivo"
      lead_status:
        | "nuevo"
        | "contactado"
        | "calificado"
        | "convertido"
        | "perdido"
      node_type: "departamento" | "mayor" | "partida" | "subpartida"
      person_type: "fisica" | "moral"
      project_scope: "global" | "sucursal" | "proyecto"
      project_status: "activo" | "cerrado" | "archivado"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user", "colaborador", "cliente"],
      budget_status: ["borrador", "publicado"],
      budget_type: ["parametrico", "ejecutivo"],
      gantt_type: ["parametrico", "ejecutivo"],
      lead_status: [
        "nuevo",
        "contactado",
        "calificado",
        "convertido",
        "perdido",
      ],
      node_type: ["departamento", "mayor", "partida", "subpartida"],
      person_type: ["fisica", "moral"],
      project_scope: ["global", "sucursal", "proyecto"],
      project_status: ["activo", "cerrado", "archivado"],
    },
  },
} as const
