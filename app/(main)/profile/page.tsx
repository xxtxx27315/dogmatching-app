"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Post } from "@/types/database";
import Link from "next/link";
import { Pencil, Grid3X3, LogOut } from "lucide-react";

const SIZE_LABEL: Record<string, string> = { small: "小型犬", medium: "中型犬", large: "大型犬" };
const GENDER_LABEL: Record<string, string> = { male: "♂ おとこの子", female: "♀ おんなの子" };

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (!p) {
        const { data: created } = await supabase.from("profiles").insert({
          id: user.id, username: "dog_" + Math.random().toString(36).slice(2, 10),
          dog_name: user.user_metadata?.dog_name ?? "名無しわんこ",
        }).select().single();
        p = created;
      }
      setProfile(p as Profile);

      const { data: postData } = await supabase.from("posts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      setPosts(postData ?? []);
      setLoading(false);
    }
    load();
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!profile) return null;

  return (
    <div className="bg-white min-h-full">
      <div className="flex items-center justify-end px-4 py-3 border-b border-gray-100">
        <button onClick={handleSignOut} className="p-2 text-gray-400 touch-manipulation"><LogOut size={20} /></button>
      </div>

      <div className="px-4 py-5">
        <div className="flex items-start gap-4">
          <div className="w-20 h-20 rounded-full bg-amber-100 flex-none overflow-hidden flex items-center justify-center border-2 border-amber-200">
            {profile.avatar_url ? <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-3xl">🐕</span>}
          </div>
          <div className="flex-1 pt-1">
            <div className="flex gap-5 mb-3">
              <div className="text-center"><p className="font-bold text-gray-900">{posts.length}</p><p className="text-xs text-gray-500">投稿</p></div>
            </div>
            <Link href="/profile/edit" className="flex items-center justify-center gap-1.5 w-full border border-gray-300 rounded-lg py-1.5 text-sm font-semibold text-gray-700 active:bg-gray-50">
              <Pencil size={14} />プロフィールを編集
            </Link>
          </div>
        </div>

        <div className="mt-4">
          <p className="font-bold text-gray-900 text-lg">{profile.dog_name}</p>
          <div className="flex flex-wrap gap-1.5 mt-1">
            {profile.gender && <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{background:profile.gender==="male"?"#eff6ff":"#fdf2f8",color:profile.gender==="male"?"#1d4ed8":"#be185d"}}>{GENDER_LABEL[profile.gender]}</span>}
            {profile.breed && <span className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full">{profile.breed}</span>}
            {profile.age_years != null && <span className="bg-amber-50 text-amber-700 text-xs px-2 py-0.5 rounded-full">{profile.age_years}歳</span>}
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
              {profile.walk_time.map(t => <span key={t} className="text-xs px-2 py-0.5 rounded-full border" style={{background:"#f0f4ff",color:"#1e3a5c",borderColor:"#c7d7f0"}}>{t}</span>)}
            </div>
          )}
          {profile.bio ? <p className="text-sm text-gray-700 mt-2 leading-relaxed">{profile.bio}</p> : <Link href="/profile/edit" className="block text-sm text-gray-400 mt-2">+ 自己紹介を追加する</Link>}
        </div>
      </div>

      <div className="border-t border-gray-100 flex items-center justify-center py-2"><Grid3X3 size={18} className="text-gray-600" /></div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="text-4xl mb-3">📝</div>
          <p className="text-gray-500 text-sm">まだつぶやきがありません</p>
          <Link href="/timeline" className="mt-3 bg-amber-500 text-white px-5 py-2 rounded-full text-sm font-semibold">最初のつぶやきをする</Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {posts.map(post => (
            <div key={post.id} className="px-4 py-3">
              <p className="text-sm text-gray-800" style={{whiteSpace:"pre-wrap"}}>{post.content}</p>
              {post.image_url && <img src={post.image_url} alt="" className="mt-2 rounded-xl max-h-48 w-auto object-cover" />}
              <p className="text-xs text-gray-300 mt-1">{new Date(post.created_at).toLocaleDateString("ja-JP")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
