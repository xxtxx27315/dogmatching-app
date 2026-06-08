"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Post } from "@/types/database";

const SIZE_LABEL: Record<string, string> = { small: "小型犬", medium: "中型犬", large: "大型犬" };
const GENDER_LABEL: Record<string, string> = { male: "♂ おとこの子", female: "♀ おんなの子" };

function PhotoCarousel({ photos, avatar }: { photos: string[]; avatar: string | null }) {
  const allPhotos = photos.length > 0 ? photos : (avatar ? [avatar] : []);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef(0);

  if (allPhotos.length === 0) {
    return (
      <div className="w-full aspect-square bg-amber-50 flex items-center justify-center text-6xl">🐕</div>
    );
  }

  function prev() { setIndex(i => (i - 1 + allPhotos.length) % allPhotos.length); }
  function next() { setIndex(i => (i + 1) % allPhotos.length); }
  function onTouchStart(e: React.TouchEvent) { touchStartX.current = e.touches[0].clientX; }
  function onTouchEnd(e: React.TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx < -50) next();
    if (dx > 50) prev();
  }

  return (
    <div className="relative w-full aspect-square bg-black select-none"
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <img src={allPhotos[index]} alt="" className="w-full h-full object-cover" style={{ transition: "opacity 0.2s" }} />
      {allPhotos.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center touch-manipulation">
            <ChevronLeft size={18} color="white" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 flex items-center justify-center touch-manipulation">
            <ChevronRight size={18} color="white" />
          </button>
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {allPhotos.map((_, i) => (
              <button key={i} onClick={() => setIndex(i)}
                className="rounded-full touch-manipulation transition-all"
                style={{ width: i === index ? 16 : 6, height: 6, background: i === index ? "white" : "rgba(255,255,255,0.55)" }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function UserProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [liked, setLiked] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
      const [{ data: p }, { data: postData }] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", userId).single(),
        supabase.from("posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      ]);
      setProfile(p as Profile);
      setPosts(postData ?? []);
      if (user) {
        const { data: likeData } = await supabase.from("likes").select("id").eq("from_dog", user.id).eq("to_dog", userId).single();
        setLiked(!!likeData);
      }
      setLoading(false);
    }
    load();
  }, [userId]);

  async function handleLike() {
    if (!currentUserId) return;
    const supabase = createClient();
    if (liked) {
      await supabase.from("likes").delete().eq("from_dog", currentUserId).eq("to_dog", userId);
      setLiked(false);
    } else {
      await supabase.from("likes").insert({ from_dog: currentUserId, to_dog: userId });
      setLiked(true);
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return <div className="p-8 text-center text-gray-400">ユーザーが見つかりません</div>;

  const photoUrls = (profile as Profile & { photo_urls?: string[] }).photo_urls ?? [];
  const maleStyle = { background: "#eff6ff", color: "#1d4ed8" };
  const femaleStyle = { background: "#fdf2f8", color: "#be185d" };

  return (
    <div className="bg-white min-h-full">
      <PhotoCarousel photos={photoUrls} avatar={profile.avatar_url} />

      <div className="px-4 py-5">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex-none overflow-hidden flex items-center justify-center border-2 border-amber-200">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-2xl">🐕</span>}
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900 text-lg leading-tight">{profile.dog_name}</p>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {profile.gender && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={profile.gender === "male" ? maleStyle : femaleStyle}>
                  {GENDER_LABEL[profile.gender]}
                </span>
              )}
              {profile.breed && <span className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full">{profile.breed}</span>}
              {profile.age_years != null && <span className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full">{profile.age_years}歳</span>}
            </div>
          </div>
        </div>

        {currentUserId && currentUserId !== userId && (
          <button onClick={handleLike}
            className={["w-full flex items-center justify-center gap-2 py-2.5 rounded-full font-semibold text-sm transition-colors mb-4",
              liked ? "bg-red-50 text-red-500 border border-red-200" : "bg-amber-500 text-white"].join(" ")}>
            <Heart size={16} fill={liked ? "currentColor" : "none"} />
            {liked ? "いいね済み" : "いいね！"}
          </button>
        )}

        <div className="flex flex-wrap gap-1.5">
          {profile.size && <span className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full">{SIZE_LABEL[profile.size]}</span>}
          {profile.location && <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-full">📍{profile.location}</span>}
        </div>

        {(profile.personality ?? []).length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {(profile.personality ?? []).map(p => <span key={p} className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">{p}</span>)}
          </div>
        )}

        {profile.walk_time && profile.walk_time.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {profile.walk_time.map(t => (
              <span key={t} className="text-xs px-2 py-0.5 rounded-full border"
                style={{ background: "#f0f4ff", color: "#1e3a5c", borderColor: "#c7d7f0" }}>{t}</span>
            ))}
          </div>
        )}

        {profile.bio && <p className="text-sm text-gray-700 mt-3 leading-relaxed">{profile.bio}</p>}
      </div>

      <div className="border-t border-gray-100 py-2" />
      <div className="divide-y divide-gray-100">
        {posts.map(post => (
          <div key={post.id} className="px-4 py-3">
            <p className="text-sm text-gray-800" style={{ whiteSpace: "pre-wrap" }}>{post.content}</p>
            {post.image_url && <img src={post.image_url} alt="" className="mt-2 rounded-xl max-h-48 w-auto" />}
          </div>
        ))}
      </div>
    </div>
  );
}
