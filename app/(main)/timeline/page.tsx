"use client";
import { useEffect, useState, useRef } from "react";
import { Heart, Send, Image as ImageIcon, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { PostWithProfile } from "@/types/database";
import Link from "next/link";

export default function TimelinePage() {
  const [posts, setPosts] = useState<PostWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [content, setContent] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      const { data } = await supabase.from("posts").select("*, profiles(*), post_likes(user_id)")
        .order("created_at", { ascending: false }).limit(50);
      setPosts((data as unknown as PostWithProfile[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  function handleImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    setImagePreview(URL.createObjectURL(f));
  }

  async function handlePost(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || !currentUserId || posting) return;
    setPosting(true);
    const supabase = createClient();
    let imageUrl: string | null = null;

    if (imageFile) {
      const path = `${currentUserId}/${Date.now()}.${imageFile.name.split(".").pop()}`;
      await supabase.storage.from("posts").upload(path, imageFile);
      const { data: { publicUrl } } = supabase.storage.from("posts").getPublicUrl(path);
      imageUrl = publicUrl;
    }

    const { data } = await supabase.from("posts")
      .insert({ user_id: currentUserId, content: content.trim(), image_url: imageUrl })
      .select("*, profiles(*), post_likes(user_id)").single();

    if (data) setPosts(prev => [data as unknown as PostWithProfile, ...prev]);
    setContent(""); setImageFile(null); setImagePreview(null);
    setPosting(false);
  }

  async function toggleLike(post: PostWithProfile) {
    if (!currentUserId) return;
    const supabase = createClient();
    const liked = post.post_likes.some(l => l.user_id === currentUserId);
    if (liked) {
      await supabase.from("post_likes").delete().eq("post_id", post.id).eq("user_id", currentUserId);
    } else {
      await supabase.from("post_likes").insert({ post_id: post.id, user_id: currentUserId });
    }
    setPosts(prev => prev.map(p => p.id === post.id ? {
      ...p, post_likes: liked ? p.post_likes.filter(l => l.user_id !== currentUserId) : [...p.post_likes, { user_id: currentUserId }]
    } : p));
  }

  return (
    <div className="bg-gray-50 min-h-full">
      {/* 投稿フォーム */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <form onSubmit={handlePost}>
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex-none flex items-center justify-center text-lg">🐕</div>
            <div className="flex-1">
              <textarea value={content} onChange={e => setContent(e.target.value)} rows={2}
                className="w-full text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none"
                placeholder="今日のわんこライフをつぶやこう🐾" maxLength={200} />
              {imagePreview && (
                <div className="relative w-24 h-24 mt-2 rounded-xl overflow-hidden">
                  <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }}
                    className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5"><X size={12} /></button>
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="text-gray-400 touch-manipulation">
                  <ImageIcon size={18} />
                </button>
                <button type="submit" disabled={posting || !content.trim()}
                  className="bg-amber-500 text-white text-sm font-semibold px-4 py-1.5 rounded-full disabled:opacity-40 touch-manipulation">
                  {posting ? "投稿中..." : "つぶやく"}
                </button>
              </div>
            </div>
          </div>
        </form>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center px-8">
          <div className="text-4xl mb-3">🐾</div>
          <p className="text-gray-500 text-sm">まだつぶやきがありません。最初の一言を！</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {posts.map(post => {
            const liked = post.post_likes.some(l => l.user_id === currentUserId);
            return (
              <div key={post.id} className="bg-white px-4 py-3">
                <div className="flex gap-3">
                  <Link href={`/users/${post.profiles.id}`} className="flex-none">
                    <div className="w-10 h-10 rounded-full bg-amber-100 overflow-hidden flex items-center justify-center">
                      {post.profiles.avatar_url ? <img src={post.profiles.avatar_url} alt="" className="w-full h-full object-cover" /> : <span className="text-xl">🐕</span>}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/users/${post.profiles.id}`}>
                        <span className="font-semibold text-sm text-gray-900">{post.profiles.dog_name}</span>
                      </Link>
                      {post.profiles.breed && <span className="text-xs text-gray-400">{post.profiles.breed}</span>}
                      <span className="text-xs text-gray-300 ml-auto">{new Date(post.created_at).toLocaleDateString("ja-JP")}</span>
                    </div>
                    <p className="text-sm text-gray-800 mt-1 leading-relaxed" style={{whiteSpace:"pre-wrap"}}>{post.content}</p>
                    {post.image_url && <img src={post.image_url} alt="" className="mt-2 rounded-xl max-h-64 w-auto object-cover" />}
                    <button onClick={() => toggleLike(post)} className="flex items-center gap-1 mt-2 touch-manipulation">
                      <Heart size={16} className={liked ? "fill-red-500 text-red-500" : "text-gray-400"} />
                      {post.post_likes.length > 0 && <span className="text-xs text-gray-400">{post.post_likes.length}</span>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
