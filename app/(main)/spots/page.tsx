"use client";
import { useEffect, useState, useRef } from "react";
import { Plus, MapPin, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Spot } from "@/types/database";

const CATEGORIES = [
  { value: "", label: "すべて", icon: "🗺️" },
  { value: "restaurant", label: "レストラン", icon: "🍽️" },
  { value: "cafe", label: "カフェ", icon: "☕" },
  { value: "park", label: "公園", icon: "🌳" },
  { value: "shop", label: "ショップ", icon: "🛍️" },
  { value: "hotel", label: "ホテル", icon: "🏨" },
  { value: "other", label: "その他", icon: "📍" },
];

const PREFECTURES = ["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"];

export default function SpotsPage() {
  const [spots, setSpots] = useState<Spot[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [posting, setPosting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function fetchSpots(cat: string) {
    setLoading(true);
    const supabase = createClient();
    let q = supabase.from("spots").select("*").order("created_at", { ascending: false }).limit(40);
    if (cat) q = q.eq("category", cat as Spot["category"]);
    const { data } = await q;
    setSpots(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    async function init() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id ?? null);
    }
    init();
    fetchSpots("");
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!currentUserId || posting) return;
    setPosting(true);
    const fd = new FormData(e.currentTarget);
    const supabase = createClient();

    let imageUrl: string | null = null;
    if (imageFile) {
      const path = `spots/${currentUserId}/${Date.now()}.${imageFile.name.split(".").pop()}`;
      await supabase.storage.from("spots").upload(path, imageFile);
      const { data: { publicUrl } } = supabase.storage.from("spots").getPublicUrl(path);
      imageUrl = publicUrl;
    }

    const { data } = await supabase.from("spots").insert({
      posted_by: currentUserId,
      name: fd.get("name") as string,
      category: fd.get("category") as Spot["category"],
      prefecture: (fd.get("prefecture") as string) || null,
      address: (fd.get("address") as string) || null,
      note: (fd.get("note") as string) || null,
      image_url: imageUrl,
    }).select().single();

    if (data) setSpots(prev => [data as Spot, ...prev]);
    setShowForm(false); setPosting(false);
    setImageFile(null); setImagePreview(null);
    (e.target as HTMLFormElement).reset();
  }

  const catIcon = (cat: string) => CATEGORIES.find(c => c.value === cat)?.icon ?? "📍";
  const catLabel = (cat: string) => CATEGORIES.find(c => c.value === cat)?.label ?? cat;

  return (
    <div className="bg-gray-50 min-h-full">
      {/* フィルター */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto scrollbar-none bg-white border-b border-gray-100">
        {CATEGORIES.map(c => (
          <button key={c.value} onClick={() => { setFilter(c.value); fetchSpots(c.value); }}
            className={["flex-none px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
              filter === c.value ? "bg-amber-500 text-white" : "bg-gray-100 text-gray-600"].join(" ")}>
            {c.icon} {c.label}
          </button>
        ))}
      </div>

      {/* 登録ボタン */}
      <div className="px-4 py-3">
        <button onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-2 bg-amber-500 text-white font-semibold py-3 rounded-2xl shadow-sm touch-manipulation">
          <Plus size={18} />犬OKなスポットを登録する
        </button>
      </div>

      {/* 登録フォーム */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full max-w-lg mx-auto rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">スポットを登録</h2>
              <button onClick={() => setShowForm(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">店名・場所名 *</label>
                <input name="name" required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm" placeholder="ドッグカフェ〇〇" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">カテゴリ *</label>
                <select name="category" required className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-sm">
                  {CATEGORIES.filter(c => c.value).map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}
                </select>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">都道府県</label>
                  <select name="prefecture" className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 bg-white text-sm">
                    <option value="">未設定</option>
                    {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
                <input name="address" className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm" placeholder="〇〇市〇〇町1-2-3" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">メモ・ひとこと</label>
                <textarea name="note" rows={2} className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none text-sm" placeholder="テラス席OKで広々してます🐾" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">写真</label>
                {imagePreview ? (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden">
                    <img src={imagePreview} alt="" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => { setImageFile(null); setImagePreview(null); }} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1"><X size={14} /></button>
                  </div>
                ) : (
                  <button type="button" onClick={() => fileRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm flex items-center justify-center gap-2">
                    <MapPin size={16} />写真を追加
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) { setImageFile(f); setImagePreview(URL.createObjectURL(f)); } }} />
              </div>
              <button type="submit" disabled={posting}
                className="w-full bg-amber-500 text-white font-bold py-3 rounded-full disabled:opacity-50">
                {posting ? "登録中..." : "登録する"}
              </button>
            </form>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /></div>
      ) : spots.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center px-8">
          <div className="text-4xl mb-3">🗺️</div>
          <p className="text-gray-500 text-sm">まだスポットが登録されていません</p>
        </div>
      ) : (
        <div className="px-4 py-2 space-y-3">
          {spots.map(spot => (
            <div key={spot.id} className="bg-white rounded-2xl overflow-hidden shadow-sm">
              {spot.image_url && <img src={spot.image_url} alt="" className="w-full h-40 object-cover" />}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-gray-900">{spot.name}</h3>
                  <span className="flex-none bg-amber-50 text-amber-600 text-xs font-semibold px-2 py-1 rounded-full">{catIcon(spot.category)} {catLabel(spot.category)}</span>
                </div>
                {(spot.prefecture || spot.address) && (
                  <div className="flex items-center gap-1 mt-1">
                    <MapPin size={12} className="text-gray-400 flex-none" />
                    <p className="text-xs text-gray-500">{[spot.prefecture, spot.address].filter(Boolean).join(" ")}</p>
                  </div>
                )}
                {spot.note && <p className="text-sm text-gray-600 mt-2">{spot.note}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
