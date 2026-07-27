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
      ai_challenge_cache: {
        Row: {
          cache_key: string
          created_at: string
          id: string
          payload: Json
          user_id: string
        }
        Insert: {
          cache_key: string
          created_at?: string
          id?: string
          payload: Json
          user_id: string
        }
        Update: {
          cache_key?: string
          created_at?: string
          id?: string
          payload?: Json
          user_id?: string
        }
        Relationships: []
      }
      daily_progress: {
        Row: {
          created_at: string
          date: string
          id: string
          updated_at: string
          user_id: string
          words_added: number
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          updated_at?: string
          user_id: string
          words_added?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          updated_at?: string
          user_id?: string
          words_added?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          daily_goal: number
          display_name: string | null
          id: string
          show_timer: boolean
          theme: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_goal?: number
          display_name?: string | null
          id: string
          show_timer?: boolean
          theme?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_goal?: number
          display_name?: string | null
          id?: string
          show_timer?: boolean
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      quiz_words: {
        Row: {
          correct: boolean
          created_at: string
          id: string
          question_type: string
          quiz_id: string
          user_id: string
          word_id: string
        }
        Insert: {
          correct?: boolean
          created_at?: string
          id?: string
          question_type?: string
          quiz_id: string
          user_id: string
          word_id: string
        }
        Update: {
          correct?: boolean
          created_at?: string
          id?: string
          question_type?: string
          quiz_id?: string
          user_id?: string
          word_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quiz_words_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "quizzes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiz_words_word_id_fkey"
            columns: ["word_id"]
            isOneToOne: false
            referencedRelation: "words"
            referencedColumns: ["id"]
          },
        ]
      }
      quizzes: {
        Row: {
          created_at: string
          id: string
          mode: string
          score: number
          total_questions: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          mode?: string
          score?: number
          total_questions?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          mode?: string
          score?: number
          total_questions?: number
          user_id?: string
        }
        Relationships: []
      }
      sat_words: {
        Row: {
          collocations: string[]
          created_at: string
          example_sentence: string | null
          example_sentences: string[]
          frequency_rank: number
          id: string
          memory_hint: string | null
          needs_review: boolean
          part_of_speech: string | null
          pronunciation: string | null
          review_reason: string | null
          suggested_correction: string | null
          synonyms: string[]
          updated_at: string
          vietnamese_meaning: string | null
          word: string
        }
        Insert: {
          collocations?: string[]
          created_at?: string
          example_sentence?: string | null
          example_sentences?: string[]
          frequency_rank: number
          id?: string
          memory_hint?: string | null
          needs_review?: boolean
          part_of_speech?: string | null
          pronunciation?: string | null
          review_reason?: string | null
          suggested_correction?: string | null
          synonyms?: string[]
          updated_at?: string
          vietnamese_meaning?: string | null
          word: string
        }
        Update: {
          collocations?: string[]
          created_at?: string
          example_sentence?: string | null
          example_sentences?: string[]
          frequency_rank?: number
          id?: string
          memory_hint?: string | null
          needs_review?: boolean
          part_of_speech?: string | null
          pronunciation?: string | null
          review_reason?: string | null
          suggested_correction?: string | null
          synonyms?: string[]
          updated_at?: string
          vietnamese_meaning?: string | null
          word?: string
        }
        Relationships: []
      }
      tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
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
      words: {
        Row: {
          antonyms: string[]
          collocations: string[]
          created_at: string
          examples: Json
          id: string
          ipa: string | null
          is_favorite: boolean
          memory_hint: string | null
          nuance_note: string | null
          part_of_speech: string | null
          status: Database["public"]["Enums"]["word_status"]
          synonyms: string[]
          tag_id: string | null
          updated_at: string
          user_id: string
          vietnamese_meaning: string | null
          word: string
        }
        Insert: {
          antonyms?: string[]
          collocations?: string[]
          created_at?: string
          examples?: Json
          id?: string
          ipa?: string | null
          is_favorite?: boolean
          memory_hint?: string | null
          nuance_note?: string | null
          part_of_speech?: string | null
          status?: Database["public"]["Enums"]["word_status"]
          synonyms?: string[]
          tag_id?: string | null
          updated_at?: string
          user_id: string
          vietnamese_meaning?: string | null
          word: string
        }
        Update: {
          antonyms?: string[]
          collocations?: string[]
          created_at?: string
          examples?: Json
          id?: string
          ipa?: string | null
          is_favorite?: boolean
          memory_hint?: string | null
          nuance_note?: string | null
          part_of_speech?: string | null
          status?: Database["public"]["Enums"]["word_status"]
          synonyms?: string[]
          tag_id?: string | null
          updated_at?: string
          user_id?: string
          vietnamese_meaning?: string | null
          word?: string
        }
        Relationships: [
          {
            foreignKeyName: "words_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_enrich_sat_word: {
        Args: {
          _example_sentence: string
          _id: string
          _memory_hint: string
          _pronunciation: string
          _vietnamese_meaning: string
        }
        Returns: undefined
      }
      admin_flag_sat_word: {
        Args: { _id: string; _reason: string; _suggestion: string }
        Returns: undefined
      }
      admin_list_review_words: {
        Args: never
        Returns: {
          frequency_rank: number
          id: string
          review_reason: string
          suggested_correction: string
          word: string
        }[]
      }
      admin_resolve_sat_word: {
        Args: { _action: string; _id: string; _new_word: string }
        Returns: undefined
      }
      admin_upsert_sat_word: {
        Args: { _rank: number; _word: string }
        Returns: string
      }
      count_daily_picks: { Args: never; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      list_daily_picks: {
        Args: { _limit: number; _offset: number }
        Returns: {
          example_sentence: string
          frequency_rank: number
          id: string
          memory_hint: string
          pronunciation: string
          vietnamese_meaning: string
          word: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      word_status: "new" | "learning" | "reviewing" | "mastered"
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
      app_role: ["admin", "user"],
      word_status: ["new", "learning", "reviewing", "mastered"],
    },
  },
} as const
