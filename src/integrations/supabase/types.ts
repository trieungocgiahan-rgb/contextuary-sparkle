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
          theme: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          daily_goal?: number
          display_name?: string | null
          id: string
          theme?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          daily_goal?: number
          display_name?: string | null
          id?: string
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
          created_at: string
          example_sentence: string | null
          frequency_rank: number
          id: string
          memory_hint: string | null
          pronunciation: string | null
          updated_at: string
          vietnamese_meaning: string | null
          word: string
        }
        Insert: {
          created_at?: string
          example_sentence?: string | null
          frequency_rank: number
          id?: string
          memory_hint?: string | null
          pronunciation?: string | null
          updated_at?: string
          vietnamese_meaning?: string | null
          word: string
        }
        Update: {
          created_at?: string
          example_sentence?: string | null
          frequency_rank?: number
          id?: string
          memory_hint?: string | null
          pronunciation?: string | null
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
      count_daily_picks: { Args: never; Returns: number }
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
      word_status: ["new", "learning", "reviewing", "mastered"],
    },
  },
} as const
