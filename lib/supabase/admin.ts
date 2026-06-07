import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://mpndzplpjnyylyenunbs.supabase.co";

const SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// サービスロールキーを使用するサーバー専用クライアント（RLS をバイパス）
// Server Actions / API Routes でのみ使用すること
export function createAdminClient(): SupabaseClient<Database> {
  return createSupabaseClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  }) as unknown as SupabaseClient<Database>;
}
