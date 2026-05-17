// Gerado manualmente com base em supabase/migrations/001_initial_schema.sql
// Substituir com: pnpm db:types (após supabase link)

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12.2.3"
  }
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          cpf: string | null
          phone: string | null
          avatar_url: string | null
          role: "buyer" | "organizer" | "validator" | "admin"
          marketing_consent: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          cpf?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: "buyer" | "organizer" | "validator" | "admin"
          marketing_consent?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          cpf?: string | null
          phone?: string | null
          avatar_url?: string | null
          role?: "buyer" | "organizer" | "validator" | "admin"
          marketing_consent?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          ticket_lot_id: string
          quantity: number
          holder_name: string | null
          holder_cpf: string | null
          added_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          ticket_lot_id: string
          quantity?: number
          holder_name?: string | null
          holder_cpf?: string | null
        }
        Update: {
          quantity?: number
          holder_name?: string | null
          holder_cpf?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_ticket_lot_id_fkey"
            columns: ["ticket_lot_id"]
            isOneToOne: false
            referencedRelation: "ticket_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      organizers: {
        Row: {
          id: string
          user_id: string
          kind: "pf" | "pj"
          legal_name: string
          trade_name: string | null
          cnpj_or_cpf: string
          bank_account: Json | null
          pagarme_recipient_id: string | null
          kyc_status: "pending" | "approved" | "rejected"
          fee_pct: number
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          kind: "pf" | "pj"
          legal_name: string
          trade_name?: string | null
          cnpj_or_cpf: string
          bank_account?: Json | null
          pagarme_recipient_id?: string | null
          kyc_status?: "pending" | "approved" | "rejected"
          fee_pct?: number
          contact_email?: string | null
          contact_phone?: string | null
        }
        Update: {
          kind?: "pf" | "pj"
          legal_name?: string
          trade_name?: string | null
          cnpj_or_cpf?: string
          bank_account?: Json | null
          kyc_status?: "pending" | "approved" | "rejected"
          fee_pct?: number
          contact_email?: string | null
          contact_phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          id: string
          organizer_id: string
          slug: string
          title: string
          description: string | null
          category: "show" | "esporte" | "religioso" | "curso" | "outro"
          banner_url: string | null
          venue_name: string | null
          address: string | null
          city: string | null
          state: string | null
          lat: number | null
          lng: number | null
          starts_at: string
          ends_at: string | null
          status: "draft" | "published" | "cancelled" | "finished"
          capacity: number
          cover_policy: Json
          age_rating: string | null
          is_nominal: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organizer_id: string
          slug: string
          title: string
          description?: string | null
          category?: "show" | "esporte" | "religioso" | "curso" | "outro"
          banner_url?: string | null
          venue_name?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          lat?: number | null
          lng?: number | null
          starts_at: string
          ends_at?: string | null
          status?: "draft" | "published" | "cancelled" | "finished"
          capacity?: number
          cover_policy?: Json
          age_rating?: string | null
          is_nominal?: boolean
        }
        Update: {
          slug?: string
          title?: string
          description?: string | null
          category?: "show" | "esporte" | "religioso" | "curso" | "outro"
          banner_url?: string | null
          venue_name?: string | null
          address?: string | null
          city?: string | null
          state?: string | null
          lat?: number | null
          lng?: number | null
          starts_at?: string
          ends_at?: string | null
          status?: "draft" | "published" | "cancelled" | "finished"
          capacity?: number
          cover_policy?: Json
          age_rating?: string | null
          is_nominal?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_types: {
        Row: {
          id: string
          event_id: string
          name: string
          description: string | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          description?: string | null
          position?: number
        }
        Update: {
          name?: string
          description?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_types_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_lots: {
        Row: {
          id: string
          ticket_type_id: string
          event_id: string
          name: string
          price_cents: number
          quantity_total: number
          quantity_sold: number
          quantity_reserved: number
          is_half_price: boolean
          starts_at: string
          ends_at: string | null
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          ticket_type_id: string
          event_id: string
          name: string
          price_cents: number
          quantity_total: number
          quantity_sold?: number
          quantity_reserved?: number
          is_half_price?: boolean
          starts_at?: string
          ends_at?: string | null
          position?: number
        }
        Update: {
          name?: string
          price_cents?: number
          quantity_total?: number
          quantity_sold?: number
          quantity_reserved?: number
          is_half_price?: boolean
          starts_at?: string
          ends_at?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "ticket_lots_ticket_type_id_fkey"
            columns: ["ticket_type_id"]
            isOneToOne: false
            referencedRelation: "ticket_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_lots_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          id: string
          buyer_id: string
          event_id: string
          status: "pending" | "paid" | "cancelled" | "refunded" | "expired" | "failed"
          subtotal_cents: number
          service_fee_cents: number
          total_cents: number
          payment_method: "pix" | "credit_card" | null
          gateway_order_id: string | null
          reserved_until: string | null
          paid_at: string | null
          cancelled_at: string | null
          metadata: Json
          buyer_ip: string | null
          buyer_user_agent: string | null
          fingerprint_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          buyer_id: string
          event_id: string
          status?: "pending" | "paid" | "cancelled" | "refunded" | "expired" | "failed"
          subtotal_cents: number
          service_fee_cents?: number
          total_cents: number
          payment_method?: "pix" | "credit_card" | null
          gateway_order_id?: string | null
          reserved_until?: string | null
          paid_at?: string | null
          cancelled_at?: string | null
          metadata?: Json
          buyer_ip?: string | null
          buyer_user_agent?: string | null
          fingerprint_id?: string | null
        }
        Update: {
          status?: "pending" | "paid" | "cancelled" | "refunded" | "expired" | "failed"
          payment_method?: "pix" | "credit_card" | null
          gateway_order_id?: string | null
          reserved_until?: string | null
          paid_at?: string | null
          cancelled_at?: string | null
          metadata?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          ticket_lot_id: string
          quantity: number
          unit_price_cents: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          ticket_lot_id: string
          quantity: number
          unit_price_cents: number
        }
        Update: {
          quantity?: number
          unit_price_cents?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_ticket_lot_id_fkey"
            columns: ["ticket_lot_id"]
            isOneToOne: false
            referencedRelation: "ticket_lots"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          id: string
          order_id: string
          ticket_lot_id: string
          event_id: string
          qr_hash: string
          holder_name: string
          holder_cpf: string
          is_half_price: boolean
          half_price_doc_type:
            | "estudante"
            | "idoso"
            | "pcd"
            | "jovem_baixa_renda"
            | "doador_sangue"
            | "professor"
            | null
          half_price_doc_url: string | null
          status: "valid" | "used" | "cancelled" | "refunded" | "paused"
          used_at: string | null
          used_by: string | null
          gate: string | null
          created_at: string
          transfer_token: string | null
          transfer_expires_at: string | null
          transferred_from: string | null
          transferred_at: string | null
          refund_requested_at: string | null
          refund_reason: string | null
        }
        Insert: {
          id?: string
          order_id: string
          ticket_lot_id: string
          event_id: string
          qr_hash: string
          holder_name: string
          holder_cpf: string
          is_half_price?: boolean
          half_price_doc_type?:
            | "estudante"
            | "idoso"
            | "pcd"
            | "jovem_baixa_renda"
            | "doador_sangue"
            | "professor"
            | null
          half_price_doc_url?: string | null
          status?: "valid" | "used" | "cancelled" | "refunded" | "paused"
          transfer_token?: string | null
          transfer_expires_at?: string | null
          transferred_from?: string | null
          transferred_at?: string | null
          refund_requested_at?: string | null
          refund_reason?: string | null
        }
        Update: {
          status?: "valid" | "used" | "cancelled" | "refunded" | "paused"
          used_at?: string | null
          used_by?: string | null
          gate?: string | null
          holder_name?: string
          holder_cpf?: string
          transfer_token?: string | null
          transfer_expires_at?: string | null
          transferred_from?: string | null
          transferred_at?: string | null
          refund_requested_at?: string | null
          refund_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tickets_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      event_validators: {
        Row: {
          event_id: string
          user_id: string
          gate: string | null
          added_by: string | null
          added_at: string
        }
        Insert: {
          event_id: string
          user_id: string
          gate?: string | null
          added_by?: string | null
        }
        Update: {
          gate?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_validators_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_validators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      check_ins: {
        Row: {
          id: string
          ticket_id: string | null
          event_id: string
          validator_id: string | null
          result:
            | "valid"
            | "already_used"
            | "invalid_hmac"
            | "cancelled"
            | "refunded"
            | "paused"
            | "not_found"
            | "wrong_event"
          scanned_at: string
          gate: string | null
          offline_synced: boolean
          payload_hash: string | null
        }
        Insert: {
          id?: string
          ticket_id?: string | null
          event_id: string
          validator_id?: string | null
          result:
            | "valid"
            | "already_used"
            | "invalid_hmac"
            | "cancelled"
            | "refunded"
            | "paused"
            | "not_found"
            | "wrong_event"
          gate?: string | null
          offline_synced?: boolean
          payload_hash?: string | null
        }
        Update: Record<string, never>
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          actor_id: string | null
          action: string
          target_table: string | null
          target_id: string | null
          metadata: Json | null
          ip: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          actor_id?: string | null
          action: string
          target_table?: string | null
          target_id?: string | null
          metadata?: Json | null
          ip?: string | null
          user_agent?: string | null
        }
        Update: Record<string, never>
        Relationships: []
      }
    }
    Views: {
      organizer_balance: {
        Row: {
          organizer_id: string
          available_cents: number
          pending_cents: number
          withdrawn_cents: number
        }
        Relationships: []
      }
    }
    Functions: {
      reserve_lot: {
        Args: { p_lot_id: string; p_quantity: number; p_order_id: string }
        Returns: void
      }
      release_lot: {
        Args: { p_lot_id: string; p_quantity: number }
        Returns: void
      }
      confirm_order: {
        Args: { p_order_id: string }
        Returns: void
      }
      expire_pending_orders: {
        Args: Record<string, never>
        Returns: number
      }
      validate_ticket: {
        Args: { p_payload: string; p_validator_id: string; p_gate?: string }
        Returns: Json
      }
      is_admin: { Args: Record<string, never>; Returns: boolean }
      is_organizer: { Args: Record<string, never>; Returns: boolean }
      organizer_id_of_user: { Args: Record<string, never>; Returns: string }
      owns_event: { Args: { p_event_id: string }; Returns: boolean }
      can_validate_event: { Args: { p_event_id: string }; Returns: boolean }
    }
    Enums: Record<string, never>
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]

export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]

export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
