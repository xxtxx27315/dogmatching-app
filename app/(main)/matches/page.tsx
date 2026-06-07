"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MatchWithProfile } from "@/types/database";
import Link from "next/link";

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from("matches").select("*")
        .or(`dog1_id.eq.${user.id},dog2_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (!data) { setLoading(false); return; }

      const enriched = await Promise.all(data.map(async (m) => {
        const partnerId = m.dog1_id === user.id ? m.dog2_id : m.dog1_id;
        const { data: partner } = await supabase.from("profiles").select("*").eq("id", partnerId).single();
        const { data: lastMsg } = await supabase.from("messages").select("*").eq("match_id", m.id).order("created_at", { ascending: false }).limit(1).single();
        const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("match_id", m.id).eq("is_read", false).neq("sender_id", user.id);
        return { ...m, partner, last_message: lastMsg ?? null, unread: count ?? 0 };
      }));

      setMatches(enriched as MatchWithProfile[]);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>;

  if (matches.length === 0) return (
    <div className="flex flex-col items-center justify-center h-64 px-8 text-center">
      <div className="text-5xl mb-4">🐾</div>
      <p className="text-gray-600 font-medium">まだマッチがいません</p>
      <p className="text-gray-400 text-sm mt-1">探すページでわんこを探してみよう！</p>
      <Link href="/discover" className="mt-4 bg-amber-500 text-white px-6 py-2.5 rounded-full text-sm font-semibold">探す</Link>
    </div>
  );

  return (
    <div className="divide-y divide-gray-100 bg-white">
      {matches.map(m => (
        <Link key={m.id} href={`/messages/${m.id}`}>
          <div className="flex items-center gap-3 px-4 py-3 active:bg-gray-50">
            <div className="w-12 h-12 rounded-full bg-amber-100 overflow-hidden flex-none flex items-center justify-center">
              {m.partner?.avatar_url ? <img src={m.partner.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">🐕</span>}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="font-semibold text-gray-900">{m.partner?.dog_name}</p>
                {m.last_message && <p className="text-xs text-gray-400">{new Date(m.last_message.created_at).toLocaleDateString("ja-JP")}</p>}
              </div>
              <p className="text-sm text-gray-500 truncate">{m.last_message?.content ?? "マッチしました！話しかけてみよう🐾"}</p>
            </div>
            {m.unread > 0 && <span className="w-5 h-5 bg-amber-500 text-white text-xs font-bold rounded-full flex items-center justify-center flex-none">{m.unread}</span>}
          </div>
        </Link>
      ))}
    </div>
  );
}
