"use client";
import { useEffect, useState, useCallback } from "react";
import { Heart, X, MapPin, Trophy } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { Profile } from "@/types/database";

type Tab = "discover" | "ranking";
type Period = "daily" | "monthly";
type RankEntry = {
  id: string;
  dog_name: string;
  breed: string | null;
  avatar_url: string | null;
  location: string | null;
  like_count: number;
};

const SIZE_LABEL: Record<string, string> = { small: "小型犬", medium: "中型犬", large: "大型犬" };
const MEDAL = ["🥇", "🥈", "🥉"];
const MS_DAY = 24 * 60 * 60 * 1000;

/* ===================== メインページ ===================== */
export default function DiscoverPage() {
  const [tab, setTab] = useState<Tab>("discover");

  return (
    <div className="flex flex-col h-full">
      <div className="flex bg-white border-b border-gray-100 flex-none">
        <button
          onClick={() => setTab("discover")}
          className={[
            "flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors",
            tab === "discover" ? "text-gray-900 border-amber-500" : "text-gray-400 border-transparent",
          ].join(" ")}
        >
          <Heart size={15} />探す
        </button>
        <button
          onClick={() => setTab("ranking")}
          className={[
            "flex-1 py-3 text-sm font-semibold flex items-center justify-center gap-1.5 border-b-2 transition-colors",
            tab === "ranking" ? "text-gray-900 border-amber-500" : "text-gray-400 border-transparent",
          ].join(" ")}
        >
          <Trophy size={15} />ランキング
        </button>
      </div>

      {tab === "discover" ? <DiscoverTab /> : <RankingTab />}
    </div>
  );
}

/* ===================== 探すタブ ===================== */
function DiscoverTab() {
  const [dogs, setDogs] = useState<Profile[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [matched, setMatched] = useState<string | null>(null);

  const fetchDogs = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setCurrentUserId(user.id);

    const { data: liked } = await supabase.from("likes").select("to_dog").eq("from_dog", user.id);
    const excludeIds = [user.id, ...(liked?.map((l) => l.to_dog) ?? [])];
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("*")
      .eq("is_active", true)
      .limit(50);

    const data = (allProfiles ?? []).filter((p) => !excludeIds.includes(p.id));
    setDogs(data as Profile[]);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDogs(); }, [fetchDogs]);

  async function handleLike() {
    if (!currentUserId || index >= dogs.length) return;
    const target = dogs[index];
    const supabase = createClient();

    const { error: likeErr } = await supabase
      .from("likes")
      .insert({ from_dog: currentUserId, to_dog: target.id });

    if (likeErr) {
      setIndex((i) => i + 1);
      return;
    }

    const { data: match } = await supabase
      .from("matches")
      .select("id")
      .or(`and(dog1_id.eq.${currentUserId},dog2_id.eq.${target.id}),and(dog1_id.eq.${target.id},dog2_id.eq.${currentUserId})`)
      .single();

    if (match) setMatched(target.dog_name);
    else setIndex((i) => i + 1);
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (matched) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-black text-gray-900 mb-2">{matched}とマッチしました！</h2>
        <p className="text-gray-500 text-sm mb-6">さっそくメッセージを送ってみよう🐾</p>
        <button
          onClick={() => { setMatched(null); setIndex((i) => i + 1); }}
          className="bg-amber-500 text-white font-bold px-8 py-3 rounded-full touch-manipulation"
        >
          探し続ける
        </button>
      </div>
    );
  }

  if (index >= dogs.length) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-5xl mb-4">🐾</div>
        <p className="text-gray-600 font-medium">今日はここまで！</p>
        <p className="text-gray-400 text-sm mt-1">また後で来てね</p>
      </div>
    );
  }

  const dog = dogs[index];
  return (
    <div className="flex-1 flex flex-col p-4 overflow-hidden">
      <div className="flex-1 bg-white rounded-3xl shadow-lg overflow-hidden relative">
        {dog.avatar_url ? (
          <img src={dog.avatar_url} alt={dog.dog_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-amber-50 flex items-center justify-center">
            <span className="text-8xl">🐕</span>
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5">
          <h2 className="text-2xl font-black text-white">{dog.dog_name}</h2>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {dog.gender && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{ background: dog.gender === "male" ? "rgba(59,130,246,0.4)" : "rgba(236,72,153,0.4)", color: "white" }}>
                {dog.gender === "male" ? "♂ おとこの子" : "♀ おんなの子"}
              </span>
            )}
            {dog.breed && <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{dog.breed}</span>}
            {dog.age_years != null && <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{dog.age_years}歳</span>}
            {dog.size && <span className="bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">{SIZE_LABEL[dog.size]}</span>}
          </div>
          {dog.location && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin size={12} className="text-white/70" />
              <span className="text-white/70 text-xs">{dog.location}</span>
            </div>
          )}
          {dog.bio && <p className="text-white/80 text-sm mt-2 line-clamp-2">{dog.bio}</p>}
          {(dog.personality ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {(dog.personality ?? []).slice(0, 4).map((p) => (
                <span key={p} className="bg-amber-400/80 text-white text-xs px-2 py-0.5 rounded-full">{p}</span>
              ))}
            </div>
          )}
          {(dog.walk_time ?? []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {(dog.walk_time ?? []).slice(0, 2).map((t) => (
                <span key={t} className="bg-white/15 text-white text-xs px-2 py-0.5 rounded-full">🦮 {t}</span>
              ))}
            </div>
          )}
        </div>
        <div className="absolute top-4 right-4 bg-black/30 text-white text-xs px-2 py-1 rounded-full">
          {dogs.length - index}匹
        </div>
      </div>

      <div className="flex gap-4 justify-center pt-4 pb-1">
        <button
          onClick={() => setIndex((i) => i + 1)}
          className="w-16 h-16 rounded-full bg-white shadow-lg flex items-center justify-center active:scale-90 transition-transform touch-manipulation border border-gray-100"
        >
          <X size={28} className="text-gray-400" />
        </button>
        <button
          onClick={handleLike}
          className="w-20 h-20 rounded-full bg-amber-500 shadow-lg shadow-amber-200 flex items-center justify-center active:scale-90 transition-transform touch-manipulation"
        >
          <Heart size={32} fill="white" className="text-white" />
        </button>
      </div>
    </div>
  );
}

/* ===================== ランキングタブ ===================== */
function RankingTab() {
  const [period, setPeriod] = useState<Period>("daily");
  const [ranking, setRanking] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRanking() {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);

      const since = period === "daily"
        ? new Date(Date.now() - MS_DAY).toISOString()
        : new Date(Date.now() - 30 * MS_DAY).toISOString();

      const { data: likeData, error } = await supabase
        .from("likes")
        .select("to_dog")
        .gte("created_at", since);

      if (error || !likeData || likeData.length === 0) {
        setRanking([]);
        setLoading(false);
        return;
      }

      const countMap: Record<string, number> = {};
      for (const l of likeData) {
        countMap[l.to_dog] = (countMap[l.to_dog] ?? 0) + 1;
      }

      const topIds = Object.entries(countMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([id]) => id);

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, dog_name, breed, avatar_url, location")
        .in("id", topIds);

      const result: RankEntry[] = topIds.map((id) => {
        const p = profiles?.find((pr) => pr.id === id);
        return {
          id,
          dog_name: p?.dog_name ?? "不明",
          breed: p?.breed ?? null,
          avatar_url: p?.avatar_url ?? null,
          location: p?.location ?? null,
          like_count: countMap[id],
        };
      });

      setRanking(result);
      setLoading(false);
    }
    fetchRanking();
  }, [period]);

  const myRank = ranking.findIndex((r) => r.id === currentUserId);

  return (
    <div className="flex-1 overflow-y-auto" style={{ background: "#faf7f4" }}>
      {/* ヘッダー */}
      <div
        className="px-4 pt-5 pb-6 text-center"
        style={{ background: "linear-gradient(160deg, #4a3728 0%, #7a5c44 100%)" }}
      >
        <div className="text-3xl mb-1">🏆</div>
        <h2 className="text-xl font-black text-white">ランキング</h2>
        <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
          いいねが多い子ほど上位に！
        </p>

        {/* 期間切替 */}
        <div className="flex gap-2 mt-4">
          {(["daily", "monthly"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className="flex-1 py-2 rounded-full text-sm font-bold transition-all touch-manipulation"
              style={{
                background: period === p ? "#c8956c" : "rgba(255,255,255,0.15)",
                color: "white",
                boxShadow: period === p ? "0 2px 12px rgba(200,149,108,0.5)" : "none",
              }}
            >
              {p === "daily" ? "📅 日間" : "📆 月間"}
            </button>
          ))}
        </div>

        {/* 自分のランキング表示 */}
        {myRank >= 0 && (
          <div
            className="mt-4 mx-auto px-5 py-2.5 rounded-2xl inline-flex items-center gap-2"
            style={{ background: "rgba(255,255,255,0.18)", border: "1px solid rgba(255,255,255,0.3)" }}
          >
            <span className="text-lg">🐾</span>
            <span className="text-white text-sm font-bold">
              あなたの子は現在 <span style={{ color: "#ffd700", fontSize: 18 }}>{myRank + 1}位</span>！
            </span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#c8956c", borderTopColor: "transparent" }} />
        </div>
      ) : ranking.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center px-8">
          <div className="text-5xl mb-3">🐾</div>
          <p className="text-sm font-bold" style={{ color: "#4a3728" }}>まだランキングがありません</p>
          <p className="text-xs mt-1" style={{ color: "#a89080" }}>いいねするとランキングが始まります！</p>
        </div>
      ) : (
        <div className="px-4 py-4 space-y-3">

          {/* TOP3 特別表示 */}
          {ranking.length >= 1 && (
            <div className="mb-2">
              {/* 1位 */}
              {ranking[0] && (
                <Link href={`/users/${ranking[0].id}`} className="block">
                <div
                  className="relative rounded-3xl p-4 mb-3 overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #fff8e6 0%, #ffedb3 100%)",
                    border: "2px solid #f5c842",
                    boxShadow: "0 4px 20px rgba(245,200,66,0.3)",
                  }}
                >
                  {/* キラキラ背景 */}
                  <div className="absolute top-2 right-3 text-2xl opacity-30">✨</div>
                  <div className="absolute bottom-2 left-3 text-xl opacity-20">⭐</div>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center flex-none">
                      <span className="text-3xl">👑</span>
                      <span className="text-xs font-black mt-0.5" style={{ color: "#b8860b" }}>1位</span>
                    </div>
                    <div
                      className="w-16 h-16 rounded-full overflow-hidden flex-none flex items-center justify-center"
                      style={{ border: "3px solid #f5c842", boxShadow: "0 0 12px rgba(245,200,66,0.5)" }}
                    >
                      {ranking[0].avatar_url
                        ? <img src={ranking[0].avatar_url} alt="" className="w-full h-full object-cover" />
                        : <span className="text-3xl">🐕</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-black text-gray-900 text-base truncate">{ranking[0].dog_name}</p>
                      {ranking[0].breed && <p className="text-xs" style={{ color: "#a89080" }}>{ranking[0].breed}</p>}
                      {ranking[0].location && <p className="text-xs" style={{ color: "#a89080" }}>📍{ranking[0].location}</p>}
                    </div>
                    <div className="flex flex-col items-center flex-none">
                      <Heart size={20} fill="#e05c5c" className="text-red-500" />
                      <span className="font-black text-xl" style={{ color: "#e05c5c" }}>{ranking[0].like_count}</span>
                      <span className="text-xs" style={{ color: "#a89080" }}>いいね</span>
                    </div>
                  </div>
                  {ranking[0].id === currentUserId && (
                    <div className="mt-2 text-center">
                      <span
                        className="inline-block text-xs font-bold px-3 py-1 rounded-full"
                        style={{ background: "#f5c842", color: "#4a3728" }}
                      >
                        🎉 あなたの子が1位です！
                      </span>
                    </div>
                  )}
                </div>
                </Link>
              )}

              {/* 2位・3位を横並び */}
              <div className="flex gap-2 mb-2">
                {[1, 2].map((i) => {
                  if (!ranking[i]) return null;
                  const colors = i === 1
                    ? { bg: "linear-gradient(135deg, #f0f0f0 0%, #e0e0e0 100%)", border: "#b0b0b0", text: "#707070", crown: "🥈" }
                    : { bg: "linear-gradient(135deg, #fff0e8 0%, #ffd9c0 100%)", border: "#c87a50", text: "#8b4a28", crown: "🥉" };
                  return (
                    <Link key={ranking[i].id} href={`/users/${ranking[i].id}`} className="flex-1">
                    <div
                      className="rounded-2xl p-3 h-full"
                      style={{ background: colors.bg, border: `1.5px solid ${colors.border}` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl">{colors.crown}</span>
                        <span className="text-xs font-black" style={{ color: colors.text }}>{i + 1}位</span>
                      </div>
                      <div
                        className="w-12 h-12 rounded-full overflow-hidden mx-auto flex items-center justify-center mb-1"
                        style={{ border: `2px solid ${colors.border}` }}
                      >
                        {ranking[i].avatar_url
                          ? <img src={ranking[i].avatar_url} alt="" className="w-full h-full object-cover" />
                          : <span className="text-2xl">🐕</span>}
                      </div>
                      <p className="text-xs font-bold text-center text-gray-900 truncate">{ranking[i].dog_name}</p>
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <Heart size={12} fill="#e05c5c" className="text-red-500" />
                        <span className="text-sm font-black" style={{ color: "#e05c5c" }}>{ranking[i].like_count}</span>
                      </div>
                      {ranking[i].id === currentUserId && (
                        <p className="text-[10px] text-center mt-1 font-bold" style={{ color: colors.text }}>← あなたの子！</p>
                      )}
                    </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4位以下 */}
          {ranking.slice(3).map((entry, idx) => {
            const rank = idx + 4;
            const isMe = entry.id === currentUserId;
            return (
              <Link key={entry.id} href={`/users/${entry.id}`} className="block">
              <div
                className="flex items-center gap-3 p-3 rounded-2xl"
                style={{
                  background: isMe ? "#f5ede4" : "white",
                  border: isMe ? "1.5px solid #c8956c" : "1px solid #e0d5c8",
                }}
              >
                <div className="w-7 text-center flex-none">
                  <span className="text-sm font-black" style={{ color: "#a89080" }}>{rank}</span>
                </div>
                <div
                  className="w-10 h-10 rounded-full overflow-hidden flex-none flex items-center justify-center"
                  style={{ border: "1.5px solid #e0d5c8" }}
                >
                  {entry.avatar_url
                    ? <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                    : <span className="text-lg">🐕</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-bold text-sm truncate" style={{ color: "#2c1f14" }}>{entry.dog_name}</p>
                    {isMe && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full" style={{ background: "#c8956c", color: "white" }}>あなた</span>}
                  </div>
                  {entry.breed && <p className="text-xs" style={{ color: "#a89080" }}>{entry.breed}</p>}
                </div>
                <div className="flex items-center gap-1 flex-none">
                  <Heart size={13} fill="#e05c5c" className="text-red-500" />
                  <span className="font-black text-sm" style={{ color: "#e05c5c" }}>{entry.like_count}</span>
                </div>
              </div>
              </Link>
            );
          })}

          {/* 自分がランク外の場合 */}
          {myRank < 0 && currentUserId && (
            <div
              className="mt-2 p-4 rounded-2xl text-center"
              style={{ background: "#f5ede4", border: "1.5px dashed #c8956c" }}
            >
              <p className="text-sm font-bold" style={{ color: "#4a3728" }}>
                🐾 あなたの子はまだランク外
              </p>
              <p className="text-xs mt-1" style={{ color: "#a89080" }}>
                他のわんこに見てもらおう！いいねを集めると上位に入れます
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
