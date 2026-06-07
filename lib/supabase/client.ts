import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mpndzplpjnyylyenunbs.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wbmR6cGxwam55eWx5ZW51bmJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMDczODQsImV4cCI6MjA5NTg4MzM4NH0.xp85DXTWiwGamd55Pf47mLLATKRvkSGAIGogk9rPMr8";

export function createClient(): SupabaseClient<Database> {
  return createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY) as unknown as SupabaseClient<Database>;
}
