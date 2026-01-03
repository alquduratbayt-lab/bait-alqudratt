export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          type: 'student' | 'parent'
          parent_id: string | null
          subscription_type: string | null
          subscription_status: string | null
          subscription_start: string | null
          subscription_end: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          type: 'student' | 'parent'
          parent_id?: string | null
          subscription_type?: string | null
          subscription_status?: string | null
          subscription_start?: string | null
          subscription_end?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          type?: 'student' | 'parent'
          parent_id?: string | null
          subscription_type?: string | null
          subscription_status?: string | null
          subscription_start?: string | null
          subscription_end?: string | null
          created_at?: string
        }
      }
      subjects: {
        Row: {
          id: string
          name: string
          type: string
          lessons_count: number
          duration: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          lessons_count: number
          duration: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          lessons_count?: number
          duration?: number
          created_at?: string
        }
      }
      admins: {
        Row: {
          id: string
          email: string
          password: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          password: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          password?: string
          created_at?: string
        }
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
  }
}
