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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      banners: {
        Row: {
          created_at: string
          cta: string | null
          id: string
          image: string | null
          image_url: string | null
          is_active: boolean
          link_url: string | null
          sort_order: number
          subtitle: string | null
          title: string
          type: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta?: string | null
          id?: string
          image?: string | null
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title: string
          type?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta?: string | null
          id?: string
          image?: string | null
          image_url?: string | null
          is_active?: boolean
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
          type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          affiliate_ref: string | null
          booking_date: string | null
          booking_time: string | null
          created_at: string
          customer_name: string
          id: string
          note: string | null
          phone: string
          referrer_phone: string | null
          service: string | null
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_ref?: string | null
          booking_date?: string | null
          booking_time?: string | null
          created_at?: string
          customer_name: string
          id?: string
          note?: string | null
          phone: string
          referrer_phone?: string | null
          service?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_ref?: string | null
          booking_date?: string | null
          booking_time?: string | null
          created_at?: string
          customer_name?: string
          id?: string
          note?: string | null
          phone?: string
          referrer_phone?: string | null
          service?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      commissions: {
        Row: {
          amount: number
          commission_type: string
          created_at: string
          id: string
          note: string | null
          paid_at: string | null
          reference_id: string | null
          staff_id: string
          status: string
        }
        Insert: {
          amount?: number
          commission_type?: string
          created_at?: string
          id?: string
          note?: string | null
          paid_at?: string | null
          reference_id?: string | null
          staff_id: string
          status?: string
        }
        Update: {
          amount?: number
          commission_type?: string
          created_at?: string
          id?: string
          note?: string | null
          paid_at?: string | null
          reference_id?: string | null
          staff_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "commissions_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          affiliate_ref: string | null
          content: string | null
          created_at: string
          id: string
          name: string
          phone: string
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_ref?: string | null
          content?: string | null
          created_at?: string
          id?: string
          name: string
          phone: string
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_ref?: string | null
          content?: string | null
          created_at?: string
          id?: string
          name?: string
          phone?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          dob: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          name: string
          note: string | null
          notes: string | null
          phone: string | null
          source: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          dob?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          name: string
          note?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          dob?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          name?: string
          note?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string | null
        }
        Relationships: []
      }
      event_media: {
        Row: {
          created_at: string
          event_id: string
          id: string
          media_type: string
          media_url: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          media_type?: string
          media_url: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          media_type?: string
          media_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_media_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          email: string | null
          event_id: string
          full_name: string
          id: string
          phone: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_id: string
          full_name: string
          id?: string
          phone: string
        }
        Update: {
          created_at?: string
          email?: string | null
          event_id?: string
          full_name?: string
          id?: string
          phone?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string | null
          content_rich: string | null
          cover_url: string | null
          created_at: string
          end_at: string
          format: string
          id: string
          is_free: boolean
          location: string | null
          max_attendees: number | null
          price: number | null
          start_at: string
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content_rich?: string | null
          cover_url?: string | null
          created_at?: string
          end_at: string
          format?: string
          id?: string
          is_free?: boolean
          location?: string | null
          max_attendees?: number | null
          price?: number | null
          start_at: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content_rich?: string | null
          cover_url?: string | null
          created_at?: string
          end_at?: string
          format?: string
          id?: string
          is_free?: boolean
          location?: string | null
          max_attendees?: number | null
          price?: number | null
          start_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          category: string
          content_rich: string | null
          cover_url: string | null
          created_at: string
          id: string
          is_featured: boolean
          published_at: string | null
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          content_rich?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          published_at?: string | null
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content_rich?: string | null
          cover_url?: string | null
          created_at?: string
          id?: string
          is_featured?: boolean
          published_at?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_comments: {
        Row: {
          contact_info: string | null
          content: string
          created_at: string
          full_name: string
          id: string
          news_id: string
          status: string
        }
        Insert: {
          contact_info?: string | null
          content: string
          created_at?: string
          full_name: string
          id?: string
          news_id: string
          status?: string
        }
        Update: {
          contact_info?: string | null
          content?: string
          created_at?: string
          full_name?: string
          id?: string
          news_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_comments_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          quantity: number
          service_id: string
          status: string
          total_amount: number
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          quantity?: number
          service_id: string
          status?: string
          total_amount?: number
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          quantity?: number
          service_id?: string
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string | null
          cost_price: number
          created_at: string
          default_sessions: number
          description: string | null
          features: string | null
          id: string
          image_url: string | null
          image_urls: string[]
          is_hidden: boolean
          name: string
          price: number
          sale_price: number | null
          short_description: string | null
          sku: string | null
          stock_quantity: number
          type: string
        }
        Insert: {
          category?: string | null
          cost_price?: number
          created_at?: string
          default_sessions?: number
          description?: string | null
          features?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[]
          is_hidden?: boolean
          name: string
          price?: number
          sale_price?: number | null
          short_description?: string | null
          sku?: string | null
          stock_quantity?: number
          type?: string
        }
        Update: {
          category?: string | null
          cost_price?: number
          created_at?: string
          default_sessions?: number
          description?: string | null
          features?: string | null
          id?: string
          image_url?: string | null
          image_urls?: string[]
          is_hidden?: boolean
          name?: string
          price?: number
          sale_price?: number | null
          short_description?: string | null
          sku?: string | null
          stock_quantity?: number
          type?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          facebook_link: string | null
          hotline: string | null
          id: string
          updated_at: string
          zalo_link: string | null
        }
        Insert: {
          facebook_link?: string | null
          hotline?: string | null
          id?: string
          updated_at?: string
          zalo_link?: string | null
        }
        Update: {
          facebook_link?: string | null
          hotline?: string | null
          id?: string
          updated_at?: string
          zalo_link?: string | null
        }
        Relationships: []
      }
      tours: {
        Row: {
          commission_amount: number
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          status: string
          technician_id: string
          treatment_id: string
        }
        Insert: {
          commission_amount?: number
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          status?: string
          technician_id: string
          treatment_id: string
        }
        Update: {
          commission_amount?: number
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          status?: string
          technician_id?: string
          treatment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tours_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_technician_id_fkey"
            columns: ["technician_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_treatment_id_fkey"
            columns: ["treatment_id"]
            isOneToOne: false
            referencedRelation: "treatments"
            referencedColumns: ["id"]
          },
        ]
      }
      treatments: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          order_id: string
          qr_code_id: string
          session_number: number
          status: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          order_id: string
          qr_code_id?: string
          session_number: number
          status?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string
          qr_code_id?: string
          session_number?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "treatments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
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
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          role?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          role?: string
        }
        Relationships: []
      }
    }
    Views: {
      community_feed: {
        Row: {
          category: string | null
          cover_url: string | null
          created_at: string | null
          end_at: string | null
          id: string | null
          post_type: string | null
          start_at: string | null
          summary: string | null
          title: string | null
        }
        Relationships: []
      }
      services_public: {
        Row: {
          category: string | null
          created_at: string | null
          default_sessions: number | null
          description: string | null
          features: string | null
          id: string | null
          image_url: string | null
          image_urls: string[] | null
          is_hidden: boolean | null
          name: string | null
          price: number | null
          sale_price: number | null
          short_description: string | null
          sku: string | null
          stock_quantity: number | null
          type: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          default_sessions?: number | null
          description?: string | null
          features?: string | null
          id?: string | null
          image_url?: string | null
          image_urls?: string[] | null
          is_hidden?: boolean | null
          name?: string | null
          price?: number | null
          sale_price?: number | null
          short_description?: string | null
          sku?: string | null
          stock_quantity?: number | null
          type?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          default_sessions?: number | null
          description?: string | null
          features?: string | null
          id?: string | null
          image_url?: string | null
          image_urls?: string[] | null
          is_hidden?: boolean | null
          name?: string | null
          price?: number | null
          sale_price?: number | null
          short_description?: string | null
          sku?: string | null
          stock_quantity?: number | null
          type?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "customer"
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
      app_role: ["admin", "staff", "customer"],
    },
  },
} as const
