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
      audit_rule_changes: {
        Row: {
          changed_at: string
          changed_by: string | null
          id: string
          new_value_json: Json
          old_value_json: Json | null
          rule_id: string
        }
        Insert: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_value_json: Json
          old_value_json?: Json | null
          rule_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string | null
          id?: string
          new_value_json?: Json
          old_value_json?: Json | null
          rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_rule_changes_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "business_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          activa: boolean
          bank_id: string
          created_at: string
          id: string
          moneda: Database["public"]["Enums"]["currency_type"]
          numero_cuenta: string
          saldo_actual: number | null
          tipo_cuenta: string | null
          updated_at: string
        }
        Insert: {
          activa?: boolean
          bank_id: string
          created_at?: string
          id?: string
          moneda?: Database["public"]["Enums"]["currency_type"]
          numero_cuenta: string
          saldo_actual?: number | null
          tipo_cuenta?: string | null
          updated_at?: string
        }
        Update: {
          activa?: boolean
          bank_id?: string
          created_at?: string
          id?: string
          moneda?: Database["public"]["Enums"]["currency_type"]
          numero_cuenta?: string
          saldo_actual?: number | null
          tipo_cuenta?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_bank_id_fkey"
            columns: ["bank_id"]
            isOneToOne: false
            referencedRelation: "banks"
            referencedColumns: ["id"]
          },
        ]
      }
      banks: {
        Row: {
          activo: boolean
          codigo: string | null
          created_at: string
          id: string
          nombre: string
        }
        Insert: {
          activo?: boolean
          codigo?: string | null
          created_at?: string
          id?: string
          nombre: string
        }
        Update: {
          activo?: boolean
          codigo?: string | null
          created_at?: string
          id?: string
          nombre?: string
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
          {
            foreignKeyName: "budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_client_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "budgets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_kpi_project_progress"
            referencedColumns: ["project_id"]
          },
        ]
      }
      business_rule_sets: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      business_rules: {
        Row: {
          active_from: string
          active_to: string | null
          created_at: string
          created_by: string | null
          id: string
          key: string
          rule_set_id: string
          scope_id: string | null
          scope_type: Database["public"]["Enums"]["rule_scope_type"]
          updated_at: string
          value_json: Json
        }
        Insert: {
          active_from?: string
          active_to?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          key: string
          rule_set_id: string
          scope_id?: string | null
          scope_type?: Database["public"]["Enums"]["rule_scope_type"]
          updated_at?: string
          value_json: Json
        }
        Update: {
          active_from?: string
          active_to?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          key?: string
          rule_set_id?: string
          scope_id?: string | null
          scope_type?: Database["public"]["Enums"]["rule_scope_type"]
          updated_at?: string
          value_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "business_rules_rule_set_id_fkey"
            columns: ["rule_set_id"]
            isOneToOne: false
            referencedRelation: "business_rule_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          attendees: Json | null
          created_at: string
          created_by: string
          end_at: string
          id: string
          notes: string | null
          project_id: string | null
          start_at: string
          title: string
        }
        Insert: {
          attendees?: Json | null
          created_at?: string
          created_by: string
          end_at: string
          id?: string
          notes?: string | null
          project_id?: string | null
          start_at: string
          title: string
        }
        Update: {
          attendees?: Json | null
          created_at?: string
          created_by?: string
          end_at?: string
          id?: string
          notes?: string | null
          project_id?: string | null
          start_at?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_client_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "calendar_events_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_kpi_project_progress"
            referencedColumns: ["project_id"]
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
      commission_config: {
        Row: {
          alliance_percent: number
          collaborator_architecture_percent: number
          collaborator_construction_percent: number
          id: string
          updated_at: string
        }
        Insert: {
          alliance_percent?: number
          collaborator_architecture_percent?: number
          collaborator_construction_percent?: number
          id?: string
          updated_at?: string
        }
        Update: {
          alliance_percent?: number
          collaborator_architecture_percent?: number
          collaborator_construction_percent?: number
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          base_amount: number
          calculated_amount: number | null
          created_at: string
          deal_ref: string
          id: string
          notes: string | null
          paid_at: string | null
          percent: number
          status: Database["public"]["Enums"]["commission_status"]
          sujeto_id: string
          tipo: Database["public"]["Enums"]["commission_type"]
          updated_at: string
        }
        Insert: {
          base_amount: number
          calculated_amount?: number | null
          created_at?: string
          deal_ref: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          percent: number
          status?: Database["public"]["Enums"]["commission_status"]
          sujeto_id: string
          tipo: Database["public"]["Enums"]["commission_type"]
          updated_at?: string
        }
        Update: {
          base_amount?: number
          calculated_amount?: number | null
          created_at?: string
          deal_ref?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          percent?: number
          status?: Database["public"]["Enums"]["commission_status"]
          sujeto_id?: string
          tipo?: Database["public"]["Enums"]["commission_type"]
          updated_at?: string
        }
        Relationships: []
      }
      construction_photos: {
        Row: {
          created_at: string
          descripcion: string | null
          fecha_foto: string
          file_name: string
          file_url: string
          id: string
          latitude: number | null
          longitude: number | null
          project_id: string
          uploaded_by: string | null
          visibilidad: string
        }
        Insert: {
          created_at?: string
          descripcion?: string | null
          fecha_foto?: string
          file_name: string
          file_url: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          project_id: string
          uploaded_by?: string | null
          visibilidad: string
        }
        Update: {
          created_at?: string
          descripcion?: string | null
          fecha_foto?: string
          file_name?: string
          file_url?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          project_id?: string
          uploaded_by?: string | null
          visibilidad?: string
        }
        Relationships: [
          {
            foreignKeyName: "construction_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "construction_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_client_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "construction_photos_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_kpi_project_progress"
            referencedColumns: ["project_id"]
          },
        ]
      }
      consumption_config: {
        Row: {
          id: string
          near_completion_threshold_pct: number
          updated_at: string
        }
        Insert: {
          id?: string
          near_completion_threshold_pct?: number
          updated_at?: string
        }
        Update: {
          id?: string
          near_completion_threshold_pct?: number
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
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_client_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "documents_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_kpi_project_progress"
            referencedColumns: ["project_id"]
          },
        ]
      }
      finance_config: {
        Row: {
          id: string
          oc_grouping_enabled: boolean
          updated_at: string
        }
        Insert: {
          id?: string
          oc_grouping_enabled?: boolean
          updated_at?: string
        }
        Update: {
          id?: string
          oc_grouping_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "gantt_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_client_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "gantt_plans_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_kpi_project_progress"
            referencedColumns: ["project_id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string
          date: string
          id: string
          invoice_id: string
          transaction_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          date: string
          id?: string
          invoice_id: string
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          id?: string
          invoice_id?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          created_at: string
          emisor_id: string | null
          folio: string | null
          id: string
          issued_at: string
          meta_json: Json | null
          metodo_pago: Database["public"]["Enums"]["payment_method"]
          paid: boolean
          receptor_id: string | null
          tipo: Database["public"]["Enums"]["invoice_type"]
          total_amount: number
          updated_at: string
          uuid: string | null
          xml_url: string | null
        }
        Insert: {
          created_at?: string
          emisor_id?: string | null
          folio?: string | null
          id?: string
          issued_at: string
          meta_json?: Json | null
          metodo_pago: Database["public"]["Enums"]["payment_method"]
          paid?: boolean
          receptor_id?: string | null
          tipo: Database["public"]["Enums"]["invoice_type"]
          total_amount: number
          updated_at?: string
          uuid?: string | null
          xml_url?: string | null
        }
        Update: {
          created_at?: string
          emisor_id?: string | null
          folio?: string | null
          id?: string
          issued_at?: string
          meta_json?: Json | null
          metodo_pago?: Database["public"]["Enums"]["payment_method"]
          paid?: boolean
          receptor_id?: string | null
          tipo?: Database["public"]["Enums"]["invoice_type"]
          total_amount?: number
          updated_at?: string
          uuid?: string | null
          xml_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_emisor_id_fkey"
            columns: ["emisor_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_receptor_id_fkey"
            columns: ["receptor_id"]
            isOneToOne: false
            referencedRelation: "clients"
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
      project_crew: {
        Row: {
          activo: boolean
          contacto_json: Json | null
          created_at: string
          especialidad: string | null
          id: string
          nombre: string
          numero_personas: number | null
          project_id: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          contacto_json?: Json | null
          created_at?: string
          especialidad?: string | null
          id?: string
          nombre: string
          numero_personas?: number | null
          project_id: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          contacto_json?: Json | null
          created_at?: string
          especialidad?: string | null
          id?: string
          nombre?: string
          numero_personas?: number | null
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_crew_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_crew_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_client_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_crew_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_kpi_project_progress"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_equipment: {
        Row: {
          activo: boolean
          costo_renta_diario: number | null
          created_at: string
          descripcion: string | null
          id: string
          nombre: string
          project_id: string
          proveedor_id: string | null
          tipo: Database["public"]["Enums"]["equipment_type"]
          updated_at: string
        }
        Insert: {
          activo?: boolean
          costo_renta_diario?: number | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre: string
          project_id: string
          proveedor_id?: string | null
          tipo: Database["public"]["Enums"]["equipment_type"]
          updated_at?: string
        }
        Update: {
          activo?: boolean
          costo_renta_diario?: number | null
          created_at?: string
          descripcion?: string | null
          id?: string
          nombre?: string
          project_id?: string
          proveedor_id?: string | null
          tipo?: Database["public"]["Enums"]["equipment_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_equipment_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_equipment_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_client_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_equipment_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_kpi_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_equipment_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
        ]
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
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_client_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_members_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_kpi_project_progress"
            referencedColumns: ["project_id"]
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
      project_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          project_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          project_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          project_id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_client_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_kpi_project_progress"
            referencedColumns: ["project_id"]
          },
        ]
      }
      project_subcontractors: {
        Row: {
          activo: boolean
          contacto_json: Json | null
          costo_aproximado: number | null
          created_at: string
          especialidad: string | null
          id: string
          nombre: string
          project_id: string
          updated_at: string
        }
        Insert: {
          activo?: boolean
          contacto_json?: Json | null
          costo_aproximado?: number | null
          created_at?: string
          especialidad?: string | null
          id?: string
          nombre: string
          project_id: string
          updated_at?: string
        }
        Update: {
          activo?: boolean
          contacto_json?: Json | null
          costo_aproximado?: number | null
          created_at?: string
          especialidad?: string | null
          id?: string
          nombre?: string
          project_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_subcontractors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_subcontractors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_client_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "project_subcontractors_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_kpi_project_progress"
            referencedColumns: ["project_id"]
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
      providers: {
        Row: {
          activo: boolean
          code_short: string
          contacto_json: Json | null
          created_at: string
          fiscales_json: Json | null
          id: string
          name: string
          terms_json: Json | null
          updated_at: string
        }
        Insert: {
          activo?: boolean
          code_short: string
          contacto_json?: Json | null
          created_at?: string
          fiscales_json?: Json | null
          id?: string
          name: string
          terms_json?: Json | null
          updated_at?: string
        }
        Update: {
          activo?: boolean
          code_short?: string
          contacto_json?: Json | null
          created_at?: string
          fiscales_json?: Json | null
          id?: string
          name?: string
          terms_json?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          created_at: string
          created_by: string | null
          estado: Database["public"]["Enums"]["purchase_order_status"]
          eta_proveedor: string | null
          fecha_requerida: string | null
          id: string
          notas: string | null
          project_id: string
          proveedor_id: string | null
          qty_ordenada: number | null
          qty_recibida: number | null
          qty_solicitada: number
          subpartida_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          estado?: Database["public"]["Enums"]["purchase_order_status"]
          eta_proveedor?: string | null
          fecha_requerida?: string | null
          id?: string
          notas?: string | null
          project_id: string
          proveedor_id?: string | null
          qty_ordenada?: number | null
          qty_recibida?: number | null
          qty_solicitada: number
          subpartida_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          estado?: Database["public"]["Enums"]["purchase_order_status"]
          eta_proveedor?: string | null
          fecha_requerida?: string | null
          id?: string
          notas?: string | null
          project_id?: string
          proveedor_id?: string | null
          qty_ordenada?: number | null
          qty_recibida?: number | null
          qty_solicitada?: number
          subpartida_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_client_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "purchase_orders_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_kpi_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "purchase_orders_proveedor_id_fkey"
            columns: ["proveedor_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_subpartida_id_fkey"
            columns: ["subpartida_id"]
            isOneToOne: false
            referencedRelation: "tu_nodes"
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
      transactions: {
        Row: {
          account_id: string
          amount: number
          cfdi_id: string | null
          client_id: string | null
          concept: string
          created_at: string
          created_by: string | null
          currency: Database["public"]["Enums"]["currency_type"]
          date: string
          id: string
          project_id: string | null
          provider_id: string | null
          purchase_order_id: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at: string
        }
        Insert: {
          account_id: string
          amount: number
          cfdi_id?: string | null
          client_id?: string | null
          concept: string
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          date: string
          id?: string
          project_id?: string | null
          provider_id?: string | null
          purchase_order_id?: string | null
          type: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Update: {
          account_id?: string
          amount?: number
          cfdi_id?: string | null
          client_id?: string | null
          concept?: string
          created_at?: string
          created_by?: string | null
          currency?: Database["public"]["Enums"]["currency_type"]
          date?: string
          id?: string
          project_id?: string | null
          provider_id?: string | null
          purchase_order_id?: string | null
          type?: Database["public"]["Enums"]["transaction_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_cfdi_id_fkey"
            columns: ["cfdi_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_client_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "transactions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "vw_kpi_project_progress"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "transactions_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "providers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
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
      user_module_permissions: {
        Row: {
          can_create: boolean | null
          can_delete: boolean | null
          can_edit: boolean | null
          can_view: boolean | null
          created_at: string | null
          id: string
          module_name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module_name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          can_create?: boolean | null
          can_delete?: boolean | null
          can_edit?: boolean | null
          can_view?: boolean | null
          created_at?: string | null
          id?: string
          module_name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          fecha_nacimiento: string | null
          full_name: string
          id: string
          last_login_at: string | null
          phone: string | null
          profile_id: string | null
          sucursal_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          fecha_nacimiento?: string | null
          full_name: string
          id?: string
          last_login_at?: string | null
          phone?: string | null
          profile_id?: string | null
          sucursal_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          fecha_nacimiento?: string | null
          full_name?: string
          id?: string
          last_login_at?: string | null
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
          {
            foreignKeyName: "wishlists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "vw_client_financial_summary"
            referencedColumns: ["project_id"]
          },
          {
            foreignKeyName: "wishlists_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: true
            referencedRelation: "vw_kpi_project_progress"
            referencedColumns: ["project_id"]
          },
        ]
      }
    }
    Views: {
      vw_client_financial_summary: {
        Row: {
          balance: number | null
          client_id: string | null
          client_name: string | null
          mayor_code: string | null
          mayor_expense: number | null
          mayor_id: string | null
          mayor_name: string | null
          project_id: string | null
          total_deposits: number | null
          total_expenses: number | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_mayor_id_fkey"
            columns: ["mayor_id"]
            isOneToOne: false
            referencedRelation: "tu_nodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "projects_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_kpi_ap_ar: {
        Row: {
          total_cobrar: number | null
          total_pagar: number | null
        }
        Relationships: []
      }
      vw_kpi_pipeline_value: {
        Row: {
          total_pipeline: number | null
        }
        Relationships: []
      }
      vw_kpi_project_progress: {
        Row: {
          client_name: string | null
          progress_pct: number | null
          project_id: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      vw_kpi_sales_funnel: {
        Row: {
          count: number | null
          status: Database["public"]["Enums"]["lead_status"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      bootstrap_user_access: {
        Args: { target_user_id?: string }
        Returns: undefined
      }
      check_price_variance: {
        Args: { new_price: number; subpartida_id_param: string }
        Returns: {
          has_variance: boolean
          previous_price: number
          threshold_pct: number
          variance_pct: number
        }[]
      }
      ensure_profile: { Args: never; Returns: undefined }
      extract_cfdi_metadata: { Args: { xml_content: string }; Returns: Json }
      get_accounts_payable: {
        Args: never
        Returns: {
          balance: number
          oldest_invoice_date: string
          provider_id: string
          provider_name: string
          total_invoiced: number
          total_paid: number
        }[]
      }
      get_accounts_receivable: {
        Args: never
        Returns: {
          balance: number
          client_id: string
          client_name: string
          oldest_invoice_date: string
          total_invoiced: number
          total_paid: number
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
      get_effective_rule: {
        Args: { p_key: string; p_proyecto_id?: string; p_sucursal_id?: string }
        Returns: Json
      }
      get_full_code: { Args: { node_id: string }; Returns: string }
      get_provider_balance: {
        Args: { p_provider_id: string }
        Returns: {
          balance: number
          total_invoiced: number
          total_paid: number
        }[]
      }
      get_subpartida_consumption: {
        Args: { p_project_id: string; p_subpartida_id: string }
        Returns: {
          consumption_pct: number
          near_limit: boolean
          qty_budgeted: number
          qty_ordered: number
          qty_received: number
          qty_requested: number
        }[]
      }
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
      seed_permissions_for_role: {
        Args: {
          p_role: Database["public"]["Enums"]["app_role"]
          p_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "colaborador" | "cliente" | "contador"
      budget_status: "borrador" | "publicado"
      budget_type: "parametrico" | "ejecutivo"
      commission_status: "calculada" | "pendiente" | "pagada"
      commission_type: "alianza" | "colaborador"
      currency_type: "MXN" | "USD" | "EUR"
      equipment_type: "propia" | "rentada"
      gantt_type: "parametrico" | "ejecutivo"
      invoice_type: "ingreso" | "egreso"
      lead_status:
        | "nuevo"
        | "contactado"
        | "calificado"
        | "convertido"
        | "perdido"
      node_type: "departamento" | "mayor" | "partida" | "subpartida"
      payment_method: "PUE" | "PPD"
      person_type: "fisica" | "moral"
      project_scope: "global" | "sucursal" | "proyecto"
      project_status: "activo" | "cerrado" | "archivado"
      purchase_order_status: "solicitado" | "ordenado" | "recibido"
      rule_scope_type: "global" | "sucursal" | "proyecto"
      transaction_type: "ingreso" | "egreso"
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
      app_role: ["admin", "user", "colaborador", "cliente", "contador"],
      budget_status: ["borrador", "publicado"],
      budget_type: ["parametrico", "ejecutivo"],
      commission_status: ["calculada", "pendiente", "pagada"],
      commission_type: ["alianza", "colaborador"],
      currency_type: ["MXN", "USD", "EUR"],
      equipment_type: ["propia", "rentada"],
      gantt_type: ["parametrico", "ejecutivo"],
      invoice_type: ["ingreso", "egreso"],
      lead_status: [
        "nuevo",
        "contactado",
        "calificado",
        "convertido",
        "perdido",
      ],
      node_type: ["departamento", "mayor", "partida", "subpartida"],
      payment_method: ["PUE", "PPD"],
      person_type: ["fisica", "moral"],
      project_scope: ["global", "sucursal", "proyecto"],
      project_status: ["activo", "cerrado", "archivado"],
      purchase_order_status: ["solicitado", "ordenado", "recibido"],
      rule_scope_type: ["global", "sucursal", "proyecto"],
      transaction_type: ["ingreso", "egreso"],
    },
  },
} as const
