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
      athlete_contacts: {
        Row: {
          athlete_email: string | null
          athlete_id: string
          athlete_phone: string | null
          club_coach_name: string | null
          club_coach_phone: string | null
          created_at: string
          guardian_email: string | null
          guardian_name: string | null
          guardian_phone: string | null
          id: string
          updated_at: string
        }
        Insert: {
          athlete_email?: string | null
          athlete_id: string
          athlete_phone?: string | null
          club_coach_name?: string | null
          club_coach_phone?: string | null
          created_at?: string
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          athlete_email?: string | null
          athlete_id?: string
          athlete_phone?: string | null
          club_coach_name?: string | null
          club_coach_phone?: string | null
          created_at?: string
          guardian_email?: string | null
          guardian_name?: string | null
          guardian_phone?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_contacts_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: true
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_events: {
        Row: {
          athlete_id: string
          created_at: string
          event_date: string
          event_time: string | null
          id: string
          is_mayb: boolean
          location: string | null
          notes: string | null
          opponent: string | null
        }
        Insert: {
          athlete_id: string
          created_at?: string
          event_date: string
          event_time?: string | null
          id?: string
          is_mayb?: boolean
          location?: string | null
          notes?: string | null
          opponent?: string | null
        }
        Update: {
          athlete_id?: string
          created_at?: string
          event_date?: string
          event_time?: string | null
          id?: string
          is_mayb?: boolean
          location?: string | null
          notes?: string | null
          opponent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "athlete_events_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_photos: {
        Row: {
          athlete_id: string
          caption: string | null
          created_at: string
          id: string
          url: string
        }
        Insert: {
          athlete_id: string
          caption?: string | null
          created_at?: string
          id?: string
          url: string
        }
        Update: {
          athlete_id?: string
          caption?: string | null
          created_at?: string
          id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_photos_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athlete_videos: {
        Row: {
          athlete_id: string
          created_at: string
          id: string
          title: string | null
          url: string
        }
        Insert: {
          athlete_id: string
          created_at?: string
          id?: string
          title?: string | null
          url: string
        }
        Update: {
          athlete_id?: string
          created_at?: string
          id?: string
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "athlete_videos_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      athletes: {
        Row: {
          act_score: number | null
          bio: string | null
          created_at: string
          full_name: string
          gpa: number | null
          grad_year: number | null
          height_inches: number | null
          high_school: string | null
          hometown: string | null
          id: string
          instagram_handle: string | null
          intended_major: string | null
          is_published: boolean
          jersey_number: string | null
          position: string | null
          profile_photo_url: string | null
          sat_score: number | null
          state: string | null
          tiktok_handle: string | null
          updated_at: string
          user_id: string
          weight_lbs: number | null
        }
        Insert: {
          act_score?: number | null
          bio?: string | null
          created_at?: string
          full_name: string
          gpa?: number | null
          grad_year?: number | null
          height_inches?: number | null
          high_school?: string | null
          hometown?: string | null
          id?: string
          instagram_handle?: string | null
          intended_major?: string | null
          is_published?: boolean
          jersey_number?: string | null
          position?: string | null
          profile_photo_url?: string | null
          sat_score?: number | null
          state?: string | null
          tiktok_handle?: string | null
          updated_at?: string
          user_id: string
          weight_lbs?: number | null
        }
        Update: {
          act_score?: number | null
          bio?: string | null
          created_at?: string
          full_name?: string
          gpa?: number | null
          grad_year?: number | null
          height_inches?: number | null
          high_school?: string | null
          hometown?: string | null
          id?: string
          instagram_handle?: string | null
          intended_major?: string | null
          is_published?: boolean
          jersey_number?: string | null
          position?: string | null
          profile_photo_url?: string | null
          sat_score?: number | null
          state?: string | null
          tiktok_handle?: string | null
          updated_at?: string
          user_id?: string
          weight_lbs?: number | null
        }
        Relationships: []
      }
      coach_requests: {
        Row: {
          college: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          message: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["coach_request_status"]
          title: string | null
          user_id: string
        }
        Insert: {
          college?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["coach_request_status"]
          title?: string | null
          user_id: string
        }
        Update: {
          college?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          message?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["coach_request_status"]
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      coach_saved_athletes: {
        Row: {
          athlete_id: string
          coach_user_id: string
          created_at: string
          id: string
          notes: string | null
        }
        Insert: {
          athlete_id: string
          coach_user_id: string
          created_at?: string
          id?: string
          notes?: string | null
        }
        Update: {
          athlete_id?: string
          coach_user_id?: string
          created_at?: string
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coach_saved_athletes_athlete_id_fkey"
            columns: ["athlete_id"]
            isOneToOne: false
            referencedRelation: "athletes"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
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
      app_role: "admin" | "coach" | "athlete"
      coach_request_status: "pending" | "approved" | "rejected"
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
      app_role: ["admin", "coach", "athlete"],
      coach_request_status: ["pending", "approved", "rejected"],
    },
  },
} as const
