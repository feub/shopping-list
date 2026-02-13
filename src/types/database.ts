// Database types for Supabase
// These match the schema in supabase/migrations/001_initial_schema.sql

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lists: {
        Row: {
          id: string;
          name: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          is_archived: boolean;
          version: number;
          last_synced_at: string | null;
        };
        Insert: {
          id?: string;
          name?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          is_archived?: boolean;
          version?: number;
          last_synced_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          is_archived?: boolean;
          version?: number;
          last_synced_at?: string | null;
        };
      };
      list_members: {
        Row: {
          id: string;
          list_id: string;
          user_id: string;
          role: 'viewer' | 'editor' | 'owner';
          added_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          user_id: string;
          role?: 'viewer' | 'editor' | 'owner';
          added_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          user_id?: string;
          role?: 'viewer' | 'editor' | 'owner';
          added_at?: string;
        };
      };
      items: {
        Row: {
          id: string;
          list_id: string;
          text: string;
          is_bought: boolean;
          is_deleted: boolean;
          order_index: number;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          version: number;
          last_synced_at: string | null;
          notes: string | null;
          quantity: number;
          is_important: boolean;
        };
        Insert: {
          id?: string;
          list_id: string;
          text: string;
          is_bought?: boolean;
          is_deleted?: boolean;
          order_index: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          version?: number;
          last_synced_at?: string | null;
          notes?: string | null;
          quantity?: number;
          is_important?: boolean;
        };
        Update: {
          id?: string;
          list_id?: string;
          text?: string;
          is_bought?: boolean;
          is_deleted?: boolean;
          order_index?: number;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          version?: number;
          last_synced_at?: string | null;
          notes?: string | null;
          quantity?: number;
          is_important?: boolean;
        };
      };
      saved_lists: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          usage_count: number;
          last_used_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          usage_count?: number;
          last_used_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
          usage_count?: number;
          last_used_at?: string | null;
        };
      };
      saved_list_items: {
        Row: {
          id: string;
          saved_list_id: string;
          text: string;
          order_index: number;
          notes: string | null;
          quantity: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          saved_list_id: string;
          text: string;
          order_index: number;
          notes?: string | null;
          quantity?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          saved_list_id?: string;
          text?: string;
          order_index?: number;
          notes?: string | null;
          quantity?: number;
          created_at?: string;
        };
      };
      favorite_items: {
        Row: {
          id: string;
          user_id: string;
          text: string;
          quantity: number;
          notes: string | null;
          usage_count: number;
          last_used_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          text: string;
          quantity?: number;
          notes?: string | null;
          usage_count?: number;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          text?: string;
          quantity?: number;
          notes?: string | null;
          usage_count?: number;
          last_used_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
