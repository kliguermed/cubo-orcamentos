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
      asset_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          parent_id: string | null
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          parent_id?: string | null
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "asset_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      asset_change_logs: {
        Row: {
          action: string
          changed_by: string | null
          changes: Json | null
          created_at: string
          entity_id: string
          entity_type: string
          id: string
        }
        Insert: {
          action: string
          changed_by?: string | null
          changes?: Json | null
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
        }
        Update: {
          action?: string
          changed_by?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
        }
        Relationships: []
      }
      asset_environment_mappings: {
        Row: {
          asset_id: string
          created_at: string
          environment_name_pattern: string
          id: string
          priority: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_id: string
          created_at?: string
          environment_name_pattern: string
          id?: string
          priority?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_id?: string
          created_at?: string
          environment_name_pattern?: string
          id?: string
          priority?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "asset_environment_mappings_asset_id_fkey"
            columns: ["asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      assets: {
        Row: {
          categories: string[] | null
          checksum: string
          copyright_info: string | null
          created_at: string
          height: number | null
          id: string
          is_default: boolean | null
          mime_type: string
          tags: string[] | null
          updated_at: string
          url: string
          usage_count: number | null
          user_id: string
          width: number | null
        }
        Insert: {
          categories?: string[] | null
          checksum: string
          copyright_info?: string | null
          created_at?: string
          height?: number | null
          id?: string
          is_default?: boolean | null
          mime_type: string
          tags?: string[] | null
          updated_at?: string
          url: string
          usage_count?: number | null
          user_id: string
          width?: number | null
        }
        Update: {
          categories?: string[] | null
          checksum?: string
          copyright_info?: string | null
          created_at?: string
          height?: number | null
          id?: string
          is_default?: boolean | null
          mime_type?: string
          tags?: string[] | null
          updated_at?: string
          url?: string
          usage_count?: number | null
          user_id?: string
          width?: number | null
        }
        Relationships: []
      }
      budgets: {
        Row: {
          client_cpf_cnpj: string | null
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          id: string
          labor_type: string | null
          labor_value: number | null
          markup_percentage: number | null
          protocol_number: number
          rt_distribution: string | null
          rt_type: string | null
          rt_value: number | null
          status: string
          total_amount: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          client_cpf_cnpj?: string | null
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          id?: string
          labor_type?: string | null
          labor_value?: number | null
          markup_percentage?: number | null
          protocol_number?: number
          rt_distribution?: string | null
          rt_type?: string | null
          rt_value?: number | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          client_cpf_cnpj?: string | null
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          id?: string
          labor_type?: string | null
          labor_value?: number | null
          markup_percentage?: number | null
          protocol_number?: number
          rt_distribution?: string | null
          rt_type?: string | null
          rt_value?: number | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      environment_templates: {
        Row: {
          background_image_url: string | null
          created_at: string
          description: string | null
          html_content: string | null
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          background_image_url?: string | null
          created_at?: string
          description?: string | null
          html_content?: string | null
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          background_image_url?: string | null
          created_at?: string
          description?: string | null
          html_content?: string | null
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      environments: {
        Row: {
          budget_id: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          focal_point: Json | null
          id: string
          image_url: string | null
          name: string
          subtotal: number | null
          updated_at: string
        }
        Insert: {
          budget_id: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          focal_point?: Json | null
          id?: string
          image_url?: string | null
          name: string
          subtotal?: number | null
          updated_at?: string
        }
        Update: {
          budget_id?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          focal_point?: Json | null
          id?: string
          image_url?: string | null
          name?: string
          subtotal?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "environments_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          created_at: string
          environment_id: string
          id: string
          name: string
          purchase_price: number
          quantity: number
          sale_price: number
          subtotal: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          environment_id: string
          id?: string
          name: string
          purchase_price?: number
          quantity?: number
          sale_price?: number
          subtotal?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          environment_id?: string
          id?: string
          name?: string
          purchase_price?: number
          quantity?: number
          sale_price?: number
          subtotal?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_environment_id_fkey"
            columns: ["environment_id"]
            isOneToOne: false
            referencedRelation: "environments"
            referencedColumns: ["id"]
          },
        ]
      }
      page_layouts: {
        Row: {
          closing_background: boolean | null
          closing_text: string | null
          cover_background: boolean | null
          cover_title: string | null
          created_at: string
          id: string
          payment_methods: string | null
          service_scope: string | null
          updated_at: string
          user_id: string
          warranty_background: boolean | null
          warranty_text: string | null
        }
        Insert: {
          closing_background?: boolean | null
          closing_text?: string | null
          cover_background?: boolean | null
          cover_title?: string | null
          created_at?: string
          id?: string
          payment_methods?: string | null
          service_scope?: string | null
          updated_at?: string
          user_id: string
          warranty_background?: boolean | null
          warranty_text?: string | null
        }
        Update: {
          closing_background?: boolean | null
          closing_text?: string | null
          cover_background?: boolean | null
          cover_title?: string | null
          created_at?: string
          id?: string
          payment_methods?: string | null
          service_scope?: string | null
          updated_at?: string
          user_id?: string
          warranty_background?: boolean | null
          warranty_text?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      proposal_template_settings: {
        Row: {
          created_at: string
          default_environment_asset_id: string | null
          id: string
          main_cover_asset_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_environment_asset_id?: string | null
          id?: string
          main_cover_asset_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_environment_asset_id?: string | null
          id?: string
          main_cover_asset_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "proposal_template_settings_default_environment_asset_id_fkey"
            columns: ["default_environment_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "proposal_template_settings_main_cover_asset_id_fkey"
            columns: ["main_cover_asset_id"]
            isOneToOne: false
            referencedRelation: "assets"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          id: string
          labor_type: string
          labor_value: number
          markup_percentage: number
          payment_terms: string | null
          rt_distribution: string
          rt_type: string
          rt_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          labor_type: string
          labor_value?: number
          markup_percentage?: number
          payment_terms?: string | null
          rt_distribution?: string
          rt_type: string
          rt_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          labor_type?: string
          labor_value?: number
          markup_percentage?: number
          payment_terms?: string | null
          rt_distribution?: string
          rt_type?: string
          rt_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
