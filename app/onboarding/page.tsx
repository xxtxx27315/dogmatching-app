"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

const SLIDES = [
  { icon: "🐕", title: "ドッグLIFEへようこそ", description: "愛犬になりきって、新しいわんこ友達を作ろう！あなたの犬の視点でつながるマッチングアプリです。", bg: "from-amber-400 to-orange-500" },
  { icon: "🐾", title: "愛犬で登録しよう", description: "あなたの犬の名前・犬種・性格を登録。自分の犬として他のわんこと友達になれます。", bg: "from-orange-400 to-amber-500" },
  { icon: "💬", title: "わんこ同士でチャット", description: "相互いいねでマッチング成立！犬同士として楽しくメッセージを交わしましょう。", bg: "from-amber-500 to-yellow-500" },
  { icon: "🗺️", title: "犬スポットを共有", description: "犬と一緒に行けるレストラン・カフェ・公園を登録・発見。お散歩計画に役立てよう！", bg: "from-yellow-400 to-amber-500" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [current, setCurrent] = useState(0);

  function next() {
    if (current < SLIDES.length - 1) setCurrent(c => c + 1);
    else { localStorage.setItem("onboarding_done", "1"); router.push("/signup"); }
  }
  function skip() { localStorage.setItem("onboarding_done", "1"); router.push("/login"); }

  const slide = SLIDES[current];
  const isLast = current === SLIDES.length - 1;

  return (
    <div className="fixed inset-0 flex flex-col max-w-lg mx-auto">
      <div className={`absolute inset-0 bg-gradient-to-br ${slide.bg} transition-all duration-500`} />
      <div className="relative z-10 flex justify-end px-6 pt-12">
        {!isLast && <button onClick={skip} className="text-white/70 text-sm font-medium px-4 py-2 rounded-full active:bg-white/10 touch-manipulation">スキップ</button>}
      </div>
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center">
        <div className="text-8xl mb-8 drop-shadow-lg">{slide.icon}</div>
        <h2 className="text-3xl font-black text-white mb-4 leading-tight">{slide.title}</h2>
        <p className="text-white/85 text-base leading-relaxed">{slide.description}</p>
      </div>
      <div className="relative z-10 flex justify-center gap-2 mb-8">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => setCurrent(i)}
            className={["rounded-full transition-all duration-300 touch-manipulation", i === current ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/40"].join(" ")} />
        ))}
      </div>
      <div className="relative z-10 px-6 pb-12 space-y-3">
        <button onClick={next}
          className="w-full bg-white font-black text-lg py-4 rounded-2xl shadow-xl active:scale-95 touch-manipulation transition-transform flex items-center justify-center gap-2">
          {isLast ? "はじめる" : "次へ"}<ChevronRight size={20} />
        </button>
        {isLast && <button onClick={skip} className="w-full text-white/80 font-semibold py-3 rounded-2xl active:bg-white/10 touch-manipulation">すでにアカウントをお持ちの方</button>}
      </div>
    </div>
  );
}
