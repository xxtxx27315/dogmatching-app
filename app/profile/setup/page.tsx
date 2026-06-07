"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { Camera } from "lucide-react";

const BREEDS = ["柴犬","トイプードル","チワワ","ダックスフント","ゴールデンレトリバー","ラブラドール","フレンチブルドッグ","プードル","ポメラニアン","マルチーズ","シーズー","ビーグル","ボーダーコリー","コーギー","秋田犬","北海道犬","雑種・ミックス","その他"];
const PERSONALITY_OPTIONS = ["元気いっぱい","おっとり","甘えん坊","遊び好き","人見知り","社交的","おとなしい","やんちゃ","賢い","食いしん坊","運動好き","お散歩大好き"];
const WALK_TIMES = ["🌅 早朝（5〜7時）","☀️ 朝（7〜9時）","🌤️ 昼（11〜13時）","🌇 夕方（16〜18時）","🌆 夕方〜夜（18〜20時）","🌙 夜（20時以降）"];
const PREFECTURES = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"];

export default function ProfileSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState<Profile | null>(null);

  // フォーム状態
  const [dogName, setDogName] = useState("");
  const [breed, setBreed] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [size, setSize] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [personality, setPersonality] = useState<string[]>([]);
  const [walkTime, setWalkTime] = useState<string[]>([]);

  // アバター
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // 既存プロフィールを取得してプリセット
  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      if (p) {
        setExisting(p as Profile);
        setDogName(p.dog_name ?? "");
        setBreed(p.breed ?? "");
        setAgeYears(p.age_years != null ? String(p.age_years) : "");
        setSize(p.size ?? "");
        setGender((p.gender as "male" | "female") ?? "");
        setLocation(p.location ?? "");
        setBio(p.bio ?? "");
        setPersonality(p.personality ?? []);
        setWalkTime(p.walk_time ?? []);
        setAvatarPreview(p.avatar_url ?? null);
      }
      setInitialLoading(false);
    }
    load();
  }, [router]);

  function toggle(arr: string[], setArr: (v: string[]) => void, tag: string) {
    setArr(arr.includes(tag) ? arr.filter(t => t !== tag) : [...arr, tag]);
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dogName.trim()) { setError("犬の名前を入力してください"); return; }
    setLoading(true); setError("");

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    // アバターアップロード
    let avatarUrl = existing?.avatar_url ?? null;
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${user.id}/avatar_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
      if (uploadErr) { setError("画像のアップロードに失敗しました"); setLoading(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      avatarUrl = publicUrl;
    }

    const payload = {
      id: user.id,
      username: existing?.username ?? ("dog_" + Math.random().toString(36).slice(2, 10)),
      dog_name: dogName.trim(),
      breed: breed || null,
      age_years: ageYears ? Number(ageYears) : null,
      size: (size as "small" | "medium" | "large") || null,
      gender: (gender as "male" | "female") || null,
      walk_time: walkTime,
      personality,
      bio: bio.trim() || null,
      location: location || null,
      avatar_url: avatarUrl,
    };

    const { error: upsertErr } = await supabase.from("profiles").upsert(payload);
    if (upsertErr) { setError(upsertErr.message); setLoading(false); return; }
    router.push("/profile");
  }

  if (initialLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f0f4f8,#e8e0d0,#f5f0e8)" }}>
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isEdit = !!existing;

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "linear-gradient(135deg,#f0f4f8 0%,#e8e0d0 50%,#f5f0e8 100%)" }}>
      <div className="max-w-md mx-auto bg-white rounded-3xl p-6" style={{ boxShadow: "0 8px 40px rgba(30,58,92,0.10)" }}>
        <div className="text-center mb-6">
          <h1 className="text-xl font-black" style={{ color: "#1e3a5c" }}>
            {isEdit ? "プロフィールを編集" : "愛犬プロフィールを作ろう"}
          </h1>
          <p className="text-xs mt-1" style={{ color: "#94a3b8" }}>
            {isEdit ? "情報を更新してください" : "あなたの犬として友達を探そう！"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* アバター画像 */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-200 bg-amber-50 flex items-center justify-center cursor-pointer"
                onClick={() => fileRef.current?.click()}>
                {avatarPreview
                  ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  : <span className="text-4xl">🐕</span>}
              </div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md touch-manipulation"
                style={{ background: "#1e3a5c" }}>
                <Camera size={15} color="white" />
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>タップして写真を変更</p>
          </div>

          {/* 犬の名前 */}
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: "#1e3a5c" }}>犬の名前 *</label>
            <input value={dogName} onChange={e => setDogName(e.target.value)} required
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              style={{ borderColor: "#e8e4dd" }} placeholder="ポチ" />
          </div>

          {/* 性別 */}
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: "#1e3a5c" }}>性別</label>
            <div className="flex gap-3">
              {[{ value: "male", label: "おとこの子 ♂", color: "#1d4ed8", bg: "#eff6ff" },
                { value: "female", label: "おんなの子 ♀", color: "#be185d", bg: "#fdf2f8" }].map(g => (
                <button key={g.value} type="button"
                  onClick={() => setGender(gender === g.value ? "" : g.value as "male" | "female")}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all touch-manipulation"
                  style={{
                    borderColor: gender === g.value ? g.color : "#e8e4dd",
                    background: gender === g.value ? g.bg : "white",
                    color: gender === g.value ? g.color : "#6b7280",
                  }}>{g.label}
                </button>
              ))}
            </div>
          </div>

          {/* 犬種 */}
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: "#1e3a5c" }}>犬種</label>
            <select value={breed} onChange={e => setBreed(e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
              style={{ borderColor: "#e8e4dd" }}>
              <option value="">選択してください</option>
              {BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {/* 年齢・サイズ */}
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-sm font-bold mb-1" style={{ color: "#1e3a5c" }}>年齢</label>
              <input value={ageYears} onChange={e => setAgeYears(e.target.value)} type="number" min="0" max="20"
                className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
                style={{ borderColor: "#e8e4dd" }} placeholder="3" />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-bold mb-1" style={{ color: "#1e3a5c" }}>サイズ</label>
              <select value={size} onChange={e => setSize(e.target.value)}
                className="w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
                style={{ borderColor: "#e8e4dd" }}>
                <option value="">未設定</option>
                <option value="small">小型犬</option>
                <option value="medium">中型犬</option>
                <option value="large">大型犬</option>
              </select>
            </div>
          </div>

          {/* お散歩時間帯 */}
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: "#1e3a5c" }}>お散歩の時間帯</label>
            <div className="flex flex-wrap gap-2">
              {WALK_TIMES.map(t => (
                <button key={t} type="button" onClick={() => toggle(walkTime, setWalkTime, t)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation border"
                  style={{
                    background: walkTime.includes(t) ? "#1e3a5c" : "white",
                    color: walkTime.includes(t) ? "white" : "#64748b",
                    borderColor: walkTime.includes(t) ? "#1e3a5c" : "#e8e4dd",
                  }}>{t}
                </button>
              ))}
            </div>
          </div>

          {/* 性格 */}
          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: "#1e3a5c" }}>性格</label>
            <div className="flex flex-wrap gap-2">
              {PERSONALITY_OPTIONS.map(tag => (
                <button key={tag} type="button" onClick={() => toggle(personality, setPersonality, tag)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation border"
                  style={{
                    background: personality.includes(tag) ? "#f59e0b" : "white",
                    color: personality.includes(tag) ? "white" : "#64748b",
                    borderColor: personality.includes(tag) ? "#f59e0b" : "#e8e4dd",
                  }}>{tag}
                </button>
              ))}
            </div>
          </div>

          {/* エリア */}
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: "#1e3a5c" }}>エリア</label>
            <select value={location} onChange={e => setLocation(e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
              style={{ borderColor: "#e8e4dd" }}>
              <option value="">未設定</option>
              {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

          {/* 自己紹介 */}
          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: "#1e3a5c" }}>自己紹介</label>
            <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3}
              className="w-full border rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-300"
              style={{ borderColor: "#e8e4dd" }}
              placeholder="散歩が大好き！公園でお友達を作りたいです🐾" />
          </div>

          {error && <p className="text-red-500 text-sm bg-red-50 rounded-xl px-4 py-2">{error}</p>}

          <div className="flex gap-3 pt-2">
            {isEdit && (
              <button type="button" onClick={() => router.push("/profile")}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold border-2 touch-manipulation"
                style={{ borderColor: "#e8e4dd", color: "#64748b" }}>
                キャンセル
              </button>
            )}
            <button type="submit" disabled={loading}
              className="flex-1 text-white font-bold py-3 rounded-2xl disabled:opacity-50 premium-button touch-manipulation">
              {loading ? "保存中..." : isEdit ? "保存する" : "友達を探す 🐾"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
