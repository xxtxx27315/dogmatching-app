export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string; username: string; dog_name: string;
          breed: string | null; age_years: number | null;
          size: "small" | "medium" | "large" | null;
          gender: "male" | "female" | null;
          walk_time: string[];
          personality: string[]; bio: string | null;
          avatar_url: string | null; location: string | null;
          is_active: boolean; created_at: string; updated_at: string;
        };
        Insert: {
          id: string; username: string; dog_name?: string;
          breed?: string | null; age_years?: number | null;
          size?: "small" | "medium" | "large" | null;
          gender?: "male" | "female" | null;
          walk_time?: string[];
          personality?: string[]; bio?: string | null;
          avatar_url?: string | null; location?: string | null;
          is_active?: boolean; created_at?: string; updated_at?: string;
        };
        Update: {
          id?: string; username?: string; dog_name?: string;
          breed?: string | null; age_years?: number | null;
          size?: "small" | "medium" | "large" | null;
          gender?: "male" | "female" | null;
          walk_time?: string[];
          personality?: string[]; bio?: string | null;
          avatar_url?: string | null; location?: string | null;
          is_active?: boolean; created_at?: string; updated_at?: string;
        };
        Relationships: [];
      };
      likes: {
        Row: { id: string; from_dog: string; to_dog: string; created_at: string };
        Insert: { id?: string; from_dog: string; to_dog: string; created_at?: string };
        Update: { id?: string; from_dog?: string; to_dog?: string; created_at?: string };
        Relationships: [];
      };
      matches: {
        Row: { id: string; dog1_id: string; dog2_id: string; created_at: string };
        Insert: { id?: string; dog1_id: string; dog2_id: string; created_at?: string };
        Update: { id?: string; dog1_id?: string; dog2_id?: string; created_at?: string };
        Relationships: [];
      };
      messages: {
        Row: { id: string; match_id: string; sender_id: string; content: string; is_read: boolean; created_at: string };
        Insert: { id?: string; match_id: string; sender_id: string; content: string; is_read?: boolean; created_at?: string };
        Update: { id?: string; match_id?: string; sender_id?: string; content?: string; is_read?: boolean; created_at?: string };
        Relationships: [];
      };
      posts: {
        Row: { id: string; user_id: string; content: string; image_url: string | null; created_at: string };
        Insert: { id?: string; user_id: string; content: string; image_url?: string | null; created_at?: string };
        Update: { id?: string; user_id?: string; content?: string; image_url?: string | null; created_at?: string };
        Relationships: [];
      };
      post_likes: {
        Row: { id: string; post_id: string; user_id: string; created_at: string };
        Insert: { id?: string; post_id: string; user_id: string; created_at?: string };
        Update: { id?: string; post_id?: string; user_id?: string; created_at?: string };
        Relationships: [];
      };
      spots: {
        Row: {
          id: string; posted_by: string; name: string;
          category: "restaurant" | "cafe" | "park" | "shop" | "hotel" | "other";
          prefecture: string | null; address: string | null;
          note: string | null; image_url: string | null; created_at: string;
        };
        Insert: {
          id?: string; posted_by: string; name: string;
          category: "restaurant" | "cafe" | "park" | "shop" | "hotel" | "other";
          prefecture?: string | null; address?: string | null;
          note?: string | null; image_url?: string | null; created_at?: string;
        };
        Update: {
          id?: string; posted_by?: string; name?: string;
          category?: "restaurant" | "cafe" | "park" | "shop" | "hotel" | "other";
          prefecture?: string | null; address?: string | null;
          note?: string | null; image_url?: string | null; created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Like = Database["public"]["Tables"]["likes"]["Row"];
export type Match = Database["public"]["Tables"]["matches"]["Row"];
export type Message = Database["public"]["Tables"]["messages"]["Row"];
export type Post = Database["public"]["Tables"]["posts"]["Row"];
export type PostLike = Database["public"]["Tables"]["post_likes"]["Row"];
export type Spot = Database["public"]["Tables"]["spots"]["Row"];

export type MatchWithProfile = Match & { partner: Profile; last_message?: Message | null; unread: number };
export type PostWithProfile = Post & { profiles: Profile; post_likes: { user_id: string }[] };
