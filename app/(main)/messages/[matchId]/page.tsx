"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Send, ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Message, Profile } from "@/types/database";
import Link from "next/link";

export default function ChatPage() {
  const { matchId } = useParams<{ matchId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [newMsg, setNewMsg] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCurrentUserId(user.id);

      const { data: match } = await supabase.from("matches").select("*").eq("id", matchId).single();
      if (!match) return;
      const partnerId = match.dog1_id === user.id ? match.dog2_id : match.dog1_id;
      const { data: p } = await supabase.from("profiles").select("*").eq("id", partnerId).single();
      setPartner(p as Profile);

      const { data: msgs } = await supabase.from("messages").select("*").eq("match_id", matchId).order("created_at", { ascending: true });
      setMessages(msgs ?? []);

      await supabase.from("messages").update({ is_read: true }).eq("match_id", matchId).neq("sender_id", user.id).eq("is_read", false);

      // リアルタイム（相手のメッセージのみ追加、重複防止）
      supabase.channel(`chat-${matchId}`)
        .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `match_id=eq.${matchId}` },
          (payload) => {
            const newMessage = payload.new as Message;
            if (newMessage.sender_id === user.id) return; // 自分の送信は楽観的更新で表示済み
            setMessages(prev => {
              if (prev.some(m => m.id === newMessage.id)) return prev;
              return [...prev, newMessage];
            });
          })
        .subscribe();
    }
    load();
  }, [matchId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMsg.trim() || !currentUserId || sending) return;
    setSending(true);
    const content = newMsg.trim();
    setNewMsg(""); // 入力欄を即クリア

    const supabase = createClient();
    const { data } = await supabase
      .from("messages")
      .insert({ match_id: matchId, sender_id: currentUserId, content })
      .select()
      .single();

    if (data) {
      // 楽観的更新：送信したメッセージを即座に表示
      setMessages(prev => {
        if (prev.some(m => m.id === (data as Message).id)) return prev;
        return [...prev, data as Message];
      });
    }
    setSending(false);
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="flex items-center gap-3 px-4 py-3 bg-white border-b border-gray-100 flex-none">
        <Link href="/matches" className="p-1 text-gray-500 touch-manipulation"><ChevronLeft size={22} /></Link>
        <div className="w-9 h-9 rounded-full bg-amber-100 overflow-hidden flex items-center justify-center">
          {partner?.avatar_url ? <img src={partner.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-lg">🐕</span>}
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-900">{partner?.dog_name}</p>
          {partner?.breed && <p className="text-xs text-gray-400">{partner.breed}</p>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-gray-400 text-sm py-8">マッチしました！最初のメッセージを送ってみよう🐾</p>
        )}
        {messages.map(msg => {
          const isMine = msg.sender_id === currentUserId;
          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={["px-4 py-2.5 rounded-2xl max-w-[75%] text-sm",
                isMine ? "bg-amber-500 text-white rounded-br-sm" : "bg-white text-gray-800 shadow-sm rounded-bl-sm"].join(" ")}>
                {msg.content}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div className="flex-none bg-white border-t border-gray-100 px-4 py-3">
        <form onSubmit={sendMessage} className="flex items-center gap-3">
          <input value={newMsg} onChange={e => setNewMsg(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400" />
          <button type="submit" disabled={sending || !newMsg.trim()} className="text-amber-500 disabled:text-gray-300 touch-manipulation">
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
