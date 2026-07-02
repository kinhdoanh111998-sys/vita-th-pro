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
      affiliate_configs: {
        Row: {
          active: boolean
          commission_percent: number
          created_at: string
          id: string
          note: string | null
          ref_code: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          commission_percent?: number
          created_at?: string
          id?: string
          note?: string | null
          ref_code: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          commission_percent?: number
          created_at?: string
          id?: string
          note?: string | null
          ref_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      attendances: {
        Row: {
          check_in_approved: boolean
          check_in_approved_at: string | null
          check_in_approved_by: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          ot_approved: boolean
          ot_approved_at: string | null
          ot_approved_by: string | null
          ot_hours: number
          shift_id: string | null
          updated_at: string
        }
        Insert: {
          check_in_approved?: boolean
          check_in_approved_at?: string | null
          check_in_approved_by?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          ot_approved?: boolean
          ot_approved_at?: string | null
          ot_approved_by?: string | null
          ot_hours?: number
          shift_id?: string | null
          updated_at?: string
        }
        Update: {
          check_in_approved?: boolean
          check_in_approved_at?: string | null
          check_in_approved_by?: string | null
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          ot_approved?: boolean
          ot_approved_at?: string | null
          ot_approved_by?: string | null
          ot_hours?: number
          shift_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendances_check_in_approved_by_fkey"
            columns: ["check_in_approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_ot_approved_by_fkey"
            columns: ["ot_approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendances_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
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
      bonus_tiers: {
        Row: {
          active: boolean
          bonus_amount: number
          bonus_type: string
          created_at: string
          id: string
          target_amount: number
          tier_name: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          bonus_amount?: number
          bonus_type?: string
          created_at?: string
          id?: string
          target_amount?: number
          tier_name: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          bonus_amount?: number
          bonus_type?: string
          created_at?: string
          id?: string
          target_amount?: number
          tier_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          affiliate_ref: string | null
          assigned_staff_id: string | null
          booking_at: string | null
          booking_date: string | null
          booking_time: string | null
          created_at: string
          customer_id: string | null
          customer_name: string
          id: string
          note: string | null
          notes: string | null
          phone: string
          referrer_phone: string | null
          service: string | null
          service_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          affiliate_ref?: string | null
          assigned_staff_id?: string | null
          booking_at?: string | null
          booking_date?: string | null
          booking_time?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name: string
          id?: string
          note?: string | null
          notes?: string | null
          phone: string
          referrer_phone?: string | null
          service?: string | null
          service_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          affiliate_ref?: string | null
          assigned_staff_id?: string | null
          booking_at?: string | null
          booking_date?: string | null
          booking_time?: string | null
          created_at?: string
          customer_id?: string | null
          customer_name?: string
          id?: string
          note?: string | null
          notes?: string | null
          phone?: string
          referrer_phone?: string | null
          service?: string | null
          service_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_assigned_staff_id_fkey"
            columns: ["assigned_staff_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public"
            referencedColumns: ["id"]
          },
        ]
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
      news_comment_contacts: {
        Row: {
          comment_id: string
          contact_info: string
          created_at: string
        }
        Insert: {
          comment_id: string
          contact_info: string
          created_at?: string
        }
        Update: {
          comment_id?: string
          contact_info?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_comment_contacts_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: true
            referencedRelation: "news_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      news_comments: {
        Row: {
          content: string
          created_at: string
          full_name: string
          id: string
          news_id: string
          status: string
        }
        Insert: {
          content: string
          created_at?: string
          full_name: string
          id?: string
          news_id: string
          status?: string
        }
        Update: {
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
      notifications: {
        Row: {
          actor_id: string | null
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          recipient_id: string | null
          ref_id: string | null
          ref_type: string | null
          title: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string | null
          ref_id?: string | null
          ref_type?: string | null
          title: string
          type: string
        }
        Update: {
          actor_id?: string | null
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          recipient_id?: string | null
          ref_id?: string | null
          ref_type?: string | null
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: Database["public"]["Enums"]["order_item_type"]
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: Database["public"]["Enums"]["order_item_type"]
          order_id: string
          quantity: number
          total_price: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: Database["public"]["Enums"]["order_item_type"]
          order_id?: string
          quantity?: number
          total_price?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          commission_rate: number
          created_at: string
          customer_id: string
          discount_amount: number
          id: string
          order_code: string | null
          quantity: number | null
          sales_staff_id: string | null
          service_id: string | null
          status: string
          subtotal_amount: number
          total_amount: number
          voucher_id: string | null
        }
        Insert: {
          commission_rate?: number
          created_at?: string
          customer_id: string
          discount_amount?: number
          id?: string
          order_code?: string | null
          quantity?: number | null
          sales_staff_id?: string | null
          service_id?: string | null
          status?: string
          subtotal_amount?: number
          total_amount?: number
          voucher_id?: string | null
        }
        Update: {
          commission_rate?: number
          created_at?: string
          customer_id?: string
          discount_amount?: number
          id?: string
          order_code?: string | null
          quantity?: number | null
          sales_staff_id?: string | null
          service_id?: string | null
          status?: string
          subtotal_amount?: number
          total_amount?: number
          voucher_id?: string | null
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
            foreignKeyName: "orders_sales_staff_id_fkey"
            columns: ["sales_staff_id"]
            isOneToOne: false
            referencedRelation: "users"
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
          {
            foreignKeyName: "orders_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      role_definitions: {
        Row: {
          app_role: Database["public"]["Enums"]["app_role"]
          created_at: string
          id: string
          is_system: boolean
          key: string
          label: string
        }
        Insert: {
          app_role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
          id?: string
          is_system?: boolean
          key: string
          label: string
        }
        Update: {
          app_role?: Database["public"]["Enums"]["app_role"]
          created_at?: string
          id?: string
          is_system?: boolean
          key?: string
          label?: string
        }
        Relationships: []
      }
      salary_configs: {
        Row: {
          base_salary_per_shift: number
          created_at: string
          id: string
          note: string | null
          ot_hourly_rate: number
          role: string
          updated_at: string
        }
        Insert: {
          base_salary_per_shift?: number
          created_at?: string
          id?: string
          note?: string | null
          ot_hourly_rate?: number
          role: string
          updated_at?: string
        }
        Update: {
          base_salary_per_shift?: number
          created_at?: string
          id?: string
          note?: string | null
          ot_hourly_rate?: number
          role?: string
          updated_at?: string
        }
        Relationships: []
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
      shift_approval_requests: {
        Row: {
          created_at: string
          id: string
          month: string
          review_note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          staff_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          month: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          month?: string
          review_note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      shift_registrations: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          note: string | null
          shift_id: string
          status: Database["public"]["Enums"]["shift_registration_status"]
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          note?: string | null
          shift_id: string
          status?: Database["public"]["Enums"]["shift_registration_status"]
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          note?: string | null
          shift_id?: string
          status?: Database["public"]["Enums"]["shift_registration_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_registrations_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_registrations_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_registrations_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string
          description: string | null
          end_time: string
          id: string
          is_active: boolean
          name: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_time: string
          id?: string
          is_active?: boolean
          name: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_time?: string
          id?: string
          is_active?: boolean
          name?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_shifts: {
        Row: {
          created_at: string
          date: string
          id: string
          request_batch_id: string | null
          shift_type: string
          staff_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          request_batch_id?: string | null
          shift_type: string
          staff_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          request_batch_id?: string | null
          shift_type?: string
          staff_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "staff_shifts_request_batch_id_fkey"
            columns: ["request_batch_id"]
            isOneToOne: false
            referencedRelation: "shift_approval_requests"
            referencedColumns: ["id"]
          },
        ]
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
          end_time: string | null
          id: string
          notes: string | null
          staff_acceptance: string
          start_time: string | null
          status: string
          technician_id: string
          treatment_id: string
        }
        Insert: {
          commission_amount?: number
          created_at?: string
          customer_id: string
          end_time?: string | null
          id?: string
          notes?: string | null
          staff_acceptance?: string
          start_time?: string | null
          status?: string
          technician_id: string
          treatment_id: string
        }
        Update: {
          commission_amount?: number
          created_at?: string
          customer_id?: string
          end_time?: string | null
          id?: string
          notes?: string | null
          staff_acceptance?: string
          start_time?: string | null
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
          service_id: string | null
          session_number: number
          status: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          order_id: string
          qr_code_id?: string
          service_id?: string | null
          session_number: number
          status?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string
          qr_code_id?: string
          service_id?: string | null
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
          {
            foreignKeyName: "treatments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "treatments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services_public"
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
      voucher_conditions: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: Database["public"]["Enums"]["order_item_type"]
          voucher_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: Database["public"]["Enums"]["order_item_type"]
          voucher_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: Database["public"]["Enums"]["order_item_type"]
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_conditions_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      voucher_customers: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          voucher_id: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          voucher_id: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_customers_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_customers_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      vouchers: {
        Row: {
          code: string
          cover_image: string | null
          created_at: string
          discount_type: Database["public"]["Enums"]["voucher_discount_type"]
          discount_value: number
          headline: string | null
          id: string
          is_active: boolean
          sub_headline: string | null
          updated_at: string
          usage_limit: number | null
          used_count: number
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          code: string
          cover_image?: string | null
          created_at?: string
          discount_type?: Database["public"]["Enums"]["voucher_discount_type"]
          discount_value: number
          headline?: string | null
          id?: string
          is_active?: boolean
          sub_headline?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          code?: string
          cover_image?: string | null
          created_at?: string
          discount_type?: Database["public"]["Enums"]["voucher_discount_type"]
          discount_value?: number
          headline?: string | null
          id?: string
          is_active?: boolean
          sub_headline?: string | null
          updated_at?: string
          usage_limit?: number | null
          used_count?: number
          valid_from?: string | null
          valid_to?: string | null
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
      fn_check_in: {
        Args: { p_shift_id: string }
        Returns: {
          check_in_approved: boolean
          check_in_approved_at: string | null
          check_in_approved_by: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          ot_approved: boolean
          ot_approved_at: string | null
          ot_approved_by: string | null
          ot_hours: number
          shift_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "attendances"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      fn_check_out: {
        Args: { p_attendance_id: string; p_notes?: string }
        Returns: {
          check_in_approved: boolean
          check_in_approved_at: string | null
          check_in_approved_by: string | null
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          ot_approved: boolean
          ot_approved_at: string | null
          ot_approved_by: string | null
          ot_hours: number
          shift_id: string | null
          updated_at: string
        }
        SetofOptions: {
          from: "*"
          to: "attendances"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "staff" | "customer" | "manager"
      order_item_type: "product" | "service"
      shift_registration_status: "pending" | "approved" | "rejected"
      voucher_discount_type: "percent" | "fixed_amount"
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
      app_role: ["admin", "staff", "customer", "manager"],
      order_item_type: ["product", "service"],
      shift_registration_status: ["pending", "approved", "rejected"],
      voucher_discount_type: ["percent", "fixed_amount"],
    },
  },
} as const
