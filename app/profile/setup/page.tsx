"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile } from "@/types/database";
import { Camera, X, Plus } from "lucide-react";

const BREEDS = ["柴犬","トイプードル","チワワ","ダックスフント","ゴールデンレトリバー","ラブラドール","フレンチブルドッグ","プードル","ポメラニアン","マルチーズ","シーズー","ビーグル","ボーダーコリー","コーギー","秋田犬","北海道犬","雑種・ミックス","その他"];
const PERSONALITY_OPTIONS = ["元気いっぱい","おっとり","甘えん坊","遊び好き","人見知り","社交的","おとなしい","やんちゃ","賢い","食いしん坊","運動好き","お散歩大好き"];
const WALK_TIMES = ["🌅 早朝（5〜7時）","☀️ 朝（7〜9時）","🌤️ 昼（11〜13時）","🌇 夕方（16〜18時）","🌆 夕方〜夜（18〜20時）","🌙 夜（20時以降）"];
const PREFECTURES = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"];

const CROP_SIZE = 300;

function CropModal({ src, onConfirm, onCancel, circular = false }: {
  src: string; onConfirm: (blob: Blob) => void; onCancel: () => void; circular?: boolean;
}) {
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const lastRef = useRef({ x: 0, y: 0 });
  const pinchDistRef = useRef<number | null>(null);

  const scale = baseScale * zoom;

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const s = Math.max(CROP_SIZE / img.naturalWidth, CROP_SIZE / img.naturalHeight);
      setBaseScale(s);
      setZoom(1);
      setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });
      setPos({ x: (CROP_SIZE - img.naturalWidth * s) / 2, y: (CROP_SIZE - img.naturalHeight * s) / 2 });
    };
    img.src = src;
  }, [src]);

  function applyZoom(newZoom: number, currentPos: { x: number; y: number }) {
    const clamped = Math.min(4, Math.max(0.5, newZoom));
    const oldScale = baseScale * zoom;
    const newScale = baseScale * clamped;
    const cx = CROP_SIZE / 2;
    const cy = CROP_SIZE / 2;
    const imgCx = (cx - currentPos.x) / oldScale;
    const imgCy = (cy - currentPos.y) / oldScale;
    setPos({ x: cx - imgCx * newScale, y: cy - imgCy * newScale });
    setZoom(clamped);
  }

  function getPoint(e: React.MouseEvent | React.TouchEvent) {
    if ("touches" in e && e.touches.length > 0) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    return { x: (e as React.MouseEvent).clientX, y: (e as React.MouseEvent).clientY };
  }
  function pinchDist(e: React.TouchEvent) {
    if (e.touches.length < 2) return null;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function onDown(e: React.MouseEvent | React.TouchEvent) {
    if ("touches" in e && (e as React.TouchEvent).touches.length === 2) {
      pinchDistRef.current = pinchDist(e as React.TouchEvent);
      return;
    }
    setDragging(true);
    lastRef.current = getPoint(e);
  }
  function onMove(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    if ("touches" in e && (e as React.TouchEvent).touches.length === 2) {
      const dist = pinchDist(e as React.TouchEvent);
      if (dist && pinchDistRef.current) {
        const ratio = dist / pinchDistRef.current;
        setPos(p => {
          const newZoom = Math.min(4, Math.max(0.5, zoom * ratio));
          const oldScale = baseScale * zoom;
          const newScale = baseScale * newZoom;
          const cx = CROP_SIZE / 2;
          const cy = CROP_SIZE / 2;
          const ix = (cx - p.x) / oldScale;
          const iy = (cy - p.y) / oldScale;
          setZoom(newZoom);
          return { x: cx - ix * newScale, y: cy - iy * newScale };
        });
        pinchDistRef.current = dist;
      }
      return;
    }
    if (!dragging) return;
    const p = getPoint(e);
    const dx = p.x - lastRef.current.x;
    const dy = p.y - lastRef.current.y;
    lastRef.current = p;
    setPos(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  }
  function onUp() { setDragging(false); pinchDistRef.current = null; }

  function handleConfirm() {
    const canvas = document.createElement("canvas");
    canvas.width = CROP_SIZE;
    canvas.height = CROP_SIZE;
    const ctx = canvas.getContext("2d");
    if (!ctx || !imgNatural.w) return;
    const img = new Image();
    img.onload = () => {
      if (circular) {
        ctx.beginPath();
        ctx.arc(CROP_SIZE / 2, CROP_SIZE / 2, CROP_SIZE / 2, 0, Math.PI * 2);
        ctx.clip();
      }
      ctx.drawImage(img, pos.x, pos.y, imgNatural.w * scale, imgNatural.h * scale);
      canvas.toBlob(blob => { if (blob) onConfirm(blob); }, "image/jpeg", 0.92);
    };
    img.src = src;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
      <div className="bg-white rounded-2xl p-4 w-full max-w-xs">
        <p className="text-center text-sm font-bold mb-3" style={{ color: "#1e3a5c" }}>写真をトリミング</p>
        <div
          className="relative overflow-hidden mx-auto select-none"
          style={{ width: CROP_SIZE, height: CROP_SIZE, background: "#e5e7eb", cursor: dragging ? "grabbing" : "grab", touchAction: "none", borderRadius: circular ? "50%" : "12px" }}
          onMouseDown={onDown} onMouseMove={onMove} onMouseUp={onUp} onMouseLeave={onUp}
          onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onUp}
        >
          {imgNatural.w > 0 && (
            <img src={src} alt="" draggable={false}
              style={{ position: "absolute", left: pos.x, top: pos.y, width: imgNatural.w * scale, height: imgNatural.h * scale, userSelect: "none", pointerEvents: "none" }}
            />
          )}
          {/* グリッド */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
            <div style={{ position: "absolute", left: "33.3%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.35)" }} />
            <div style={{ position: "absolute", left: "66.6%", top: 0, bottom: 0, width: 1, background: "rgba(255,255,255,0.35)" }} />
            <div style={{ position: "absolute", top: "33.3%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.35)" }} />
            <div style={{ position: "absolute", top: "66.6%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.35)" }} />
          </div>
        </div>

        {/* ズームスライダー */}
        <div className="mt-3 px-1">
          <input type="range" min="50" max="400" value={Math.round(zoom * 100)}
            onChange={e => applyZoom(Number(e.target.value) / 100, pos)}
            className="w-full" style={{ accentColor: "#f59e0b" }}
          />
          <div className="flex justify-between text-xs mt-0.5" style={{ color: "#94a3b8" }}>
            <span>縮小</span><span>拡大</span>
          </div>
        </div>
        <p className="text-xs text-center mt-1 mb-3" style={{ color: "#94a3b8" }}>ドラッグで位置・スライダーで拡大縮小</p>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border text-sm font-semibold text-gray-600" style={{ borderColor: "#e8e4dd" }}>キャンセル</button>
          <button onClick={handleConfirm} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: "#1e3a5c" }}>確定</button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");
  const [existing, setExisting] = useState<Profile | null>(null);

  const [dogName, setDogName] = useState("");
  const [breed, setBreed] = useState("");
  const [ageYears, setAgeYears] = useState("");
  const [size, setSize] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [personality, setPersonality] = useState<string[]>([]);
  const [walkTime, setWalkTime] = useState<string[]>([]);

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [existingPhotoUrls, setExistingPhotoUrls] = useState<string[]>([]);
  const [newPhotoItems, setNewPhotoItems] = useState<{ blob: Blob; preview: string }[]>([]);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [avatarCropSrc, setAvatarCropSrc] = useState<string | null>(null);
  const multiPhotoRef = useRef<HTMLInputElement>(null);

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
        setExistingPhotoUrls((p as Profile & { photo_urls?: string[] }).photo_urls ?? []);
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
    setAvatarCropSrc(URL.createObjectURL(f));
    e.target.value = "";
  }

  function handleAvatarCropConfirm(blob: Blob) {
    setAvatarFile(new File([blob], "avatar.jpg", { type: "image/jpeg" }));
    setAvatarPreview(URL.createObjectURL(blob));
    setAvatarCropSrc(null);
  }

  function handleMultiPhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setCropSrc(URL.createObjectURL(f));
    e.target.value = "";
  }

  function handleCropConfirm(blob: Blob) {
    const preview = URL.createObjectURL(blob);
    setNewPhotoItems(prev => [...prev, { blob, preview }]);
    setCropSrc(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!dogName.trim()) { setError("犬の名前を入力してください"); return; }
    setLoading(true); setError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    let avatarUrl = existing?.avatar_url ?? null;
    if (avatarFile) {
      const ext = avatarFile.name.split(".").pop();
      const path = `${user.id}/avatar_${Date.now()}.${ext}`;
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, avatarFile, { upsert: true });
      if (uploadErr) { setError("画像のアップロードに失敗しました"); setLoading(false); return; }
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      avatarUrl = publicUrl;
    }

    let photoUrls = [...existingPhotoUrls];
    for (const { blob } of newPhotoItems) {
      const path = `${user.id}/photos/photo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}.jpg`;
      const { error: uploadErr } = await supabase.storage.from("avatars").upload(path, blob, { contentType: "image/jpeg", upsert: true });
      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
        photoUrls.push(publicUrl);
      }
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
      photo_urls: photoUrls,
    };

    const { error: upsertErr } = await supabase.from("profiles").upsert(payload);
    if (upsertErr) { setError(upsertErr.message); setLoading(false); return; }
    router.push("/profile");
  }

  const totalPhotos = existingPhotoUrls.length + newPhotoItems.length;

  if (initialLoading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg,#f0f4f8,#e8e0d0,#f5f0e8)" }}>
      <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isEdit = !!existing;

  return (
    <div className="min-h-screen px-4 py-8" style={{ background: "linear-gradient(135deg,#f0f4f8 0%,#e8e0d0 50%,#f5f0e8 100%)" }}>
      {avatarCropSrc && <CropModal src={avatarCropSrc} circular={true} onConfirm={handleAvatarCropConfirm} onCancel={() => setAvatarCropSrc(null)} />}
      {cropSrc && <CropModal src={cropSrc} onConfirm={handleCropConfirm} onCancel={() => setCropSrc(null)} />}

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

          <div className="flex flex-col items-center">
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-amber-200 bg-amber-50 flex items-center justify-center cursor-pointer"
                onClick={() => fileRef.current?.click()}>
                {avatarPreview ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" /> : <span className="text-4xl">🐕</span>}
              </div>
              <button type="button" onClick={() => fileRef.current?.click()}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center shadow-md touch-manipulation"
                style={{ background: "#1e3a5c" }}>
                <Camera size={15} color="white" />
              </button>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <p className="text-xs mt-2" style={{ color: "#94a3b8" }}>タップしてアイコン写真を変更</p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: "#1e3a5c" }}>
              写真ギャラリー<span className="font-normal text-gray-400 ml-1.5">（最大6枚）</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {existingPhotoUrls.map((url, i) => (
                <div key={"ex" + i} className="relative aspect-square rounded-xl overflow-hidden bg-amber-50">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setExistingPhotoUrls(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/55 flex items-center justify-center touch-manipulation">
                    <X size={12} color="white" />
                  </button>
                </div>
              ))}
              {newPhotoItems.map((item, i) => (
                <div key={"new" + i} className="relative aspect-square rounded-xl overflow-hidden bg-amber-50">
                  <img src={item.preview} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setNewPhotoItems(prev => prev.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/55 flex items-center justify-center touch-manipulation">
                    <X size={12} color="white" />
                  </button>
                </div>
              ))}
              {totalPhotos < 6 && (
                <button type="button" onClick={() => multiPhotoRef.current?.click()}
                  className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 touch-manipulation"
                  style={{ borderColor: "#fcd34d", color: "#f59e0b" }}>
                  <Plus size={20} />
                  <span className="text-xs font-medium">追加</span>
                </button>
              )}
            </div>
            <input ref={multiPhotoRef} type="file" accept="image/*" className="hidden" onChange={handleMultiPhotoSelect} />
            <p className="text-xs mt-1.5" style={{ color: "#94a3b8" }}>追加した写真はトリミングできます</p>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: "#1e3a5c" }}>犬の名前 *</label>
            <input value={dogName} onChange={e => setDogName(e.target.value)} required
              className="w-full border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
              style={{ borderColor: "#e8e4dd" }} placeholder="ポチ" />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: "#1e3a5c" }}>性別</label>
            <div className="flex gap-3">
              {[{ value: "male", label: "おとこの子 ♂", color: "#1d4ed8", bg: "#eff6ff" },
                { value: "female", label: "おんなの子 ♀", color: "#be185d", bg: "#fdf2f8" }].map(g => (
                <button key={g.value} type="button"
                  onClick={() => setGender(gender === g.value ? "" : g.value as "male" | "female")}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all touch-manipulation"
                  style={{ borderColor: gender === g.value ? g.color : "#e8e4dd", background: gender === g.value ? g.bg : "white", color: gender === g.value ? g.color : "#6b7280" }}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: "#1e3a5c" }}>犬種</label>
            <select value={breed} onChange={e => setBreed(e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
              style={{ borderColor: "#e8e4dd" }}>
              <option value="">選択してください</option>
              {BREEDS.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

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

          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: "#1e3a5c" }}>お散歩の時間帯</label>
            <div className="flex flex-wrap gap-2">
              {WALK_TIMES.map(t => (
                <button key={t} type="button" onClick={() => toggle(walkTime, setWalkTime, t)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation border"
                  style={{ background: walkTime.includes(t) ? "#1e3a5c" : "white", color: walkTime.includes(t) ? "white" : "#64748b", borderColor: walkTime.includes(t) ? "#1e3a5c" : "#e8e4dd" }}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-2" style={{ color: "#1e3a5c" }}>性格</label>
            <div className="flex flex-wrap gap-2">
              {PERSONALITY_OPTIONS.map(tag => (
                <button key={tag} type="button" onClick={() => toggle(personality, setPersonality, tag)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-colors touch-manipulation border"
                  style={{ background: personality.includes(tag) ? "#f59e0b" : "white", color: personality.includes(tag) ? "white" : "#64748b", borderColor: personality.includes(tag) ? "#f59e0b" : "#e8e4dd" }}>
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold mb-1" style={{ color: "#1e3a5c" }}>エリア</label>
            <select value={location} onChange={e => setLocation(e.target.value)}
              className="w-full border rounded-xl px-4 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-300"
              style={{ borderColor: "#e8e4dd" }}>
              <option value="">未設定</option>
              {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

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
