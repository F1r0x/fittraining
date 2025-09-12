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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      daily_workouts: {
        Row: {
          cooldown: Json | null
          created_at: string
          description: string | null
          difficulty: string
          duration: number
          id: string
          is_active: boolean
          main_workout: Json
          title: string
          type: string
          updated_at: string
          warmup: Json
        }
        Insert: {
          cooldown?: Json | null
          created_at?: string
          description?: string | null
          difficulty: string
          duration: number
          id?: string
          is_active?: boolean
          main_workout: Json
          title: string
          type: string
          updated_at?: string
          warmup: Json
        }
        Update: {
          cooldown?: Json | null
          created_at?: string
          description?: string | null
          difficulty?: string
          duration?: number
          id?: string
          is_active?: boolean
          main_workout?: Json
          title?: string
          type?: string
          updated_at?: string
          warmup?: Json
        }
        Relationships: []
      }
      gym_daily_workouts: {
        Row: {
          cooldown: Json | null
          created_at: string
          description: string | null
          difficulty: string
          duration: number
          id: string
          is_active: boolean
          main_workout: Json
          title: string
          type: string
          updated_at: string
          warmup: Json
        }
        Insert: {
          cooldown?: Json | null
          created_at?: string
          description?: string | null
          difficulty: string
          duration: number
          id?: string
          is_active?: boolean
          main_workout: Json
          title: string
          type: string
          updated_at?: string
          warmup: Json
        }
        Update: {
          cooldown?: Json | null
          created_at?: string
          description?: string | null
          difficulty?: string
          duration?: number
          id?: string
          is_active?: boolean
          main_workout?: Json
          title?: string
          type?: string
          updated_at?: string
          warmup?: Json
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_progress: {
        Row: {
          completed_at: string
          created_at: string
          id: string
          time_taken: number | null
          updated_at: string
          user_id: string
          workout_id: string | null
        }
        Insert: {
          completed_at?: string
          created_at?: string
          id?: string
          time_taken?: number | null
          updated_at?: string
          user_id: string
          workout_id?: string | null
        }
        Update: {
          completed_at?: string
          created_at?: string
          id?: string
          time_taken?: number | null
          updated_at?: string
          user_id?: string
          workout_id?: string | null
        }
        Relationships: []
      }
      workout_sessions: {
        Row: {
          completed_at: string
          created_at: string
          date: string
          description: string | null
          exercises: Json
          id: string
          title: string
          total_time: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          date?: string
          description?: string | null
          exercises: Json
          id?: string
          title: string
          total_time?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          date?: string
          description?: string | null
          exercises?: Json
          id?: string
          title?: string
          total_time?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      workout_type_aliases: {
        Row: {
          alias_name: string
          canonical_workout_type_id: string
          created_at: string
          id: string
        }
        Insert: {
          alias_name: string
          canonical_workout_type_id: string
          created_at?: string
          id?: string
        }
        Update: {
          alias_name?: string
          canonical_workout_type_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_type_aliases_canonical_workout_type_id_fkey"
            columns: ["canonical_workout_type_id"]
            isOneToOne: false
            referencedRelation: "workout_types"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_types: {
        Row: {
          category: string
          id: string
          name: string
          unit: string
          unit2: string | null
        }
        Insert: {
          category: string
          id?: string
          name: string
          unit: string
          unit2?: string | null
        }
        Update: {
          category?: string
          id?: string
          name?: string
          unit?: string
          unit2?: string | null
        }
        Relationships: []
      }
      workouts: {
        Row: {
          created_at: string
          date: string
          db_weight: number | null
          id: string
          kb_weight: number | null
          notes: string | null
          user_id: string
          value: number
          value2: number | null
          workout_type_id: string
        }
        Insert: {
          created_at?: string
          date?: string
          db_weight?: number | null
          id?: string
          kb_weight?: number | null
          notes?: string | null
          user_id: string
          value: number
          value2?: number | null
          workout_type_id: string
        }
        Update: {
          created_at?: string
          date?: string
          db_weight?: number | null
          id?: string
          kb_weight?: number | null
          notes?: string | null
          user_id?: string
          value?: number
          value2?: number | null
          workout_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workouts_workout_type_id_fkey"
            columns: ["workout_type_id"]
            isOneToOne: false
            referencedRelation: "workout_types"
            referencedColumns: ["id"]
          },
        ]
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
