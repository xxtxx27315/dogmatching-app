"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Heart, MessageCircle, MapPin, User } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState, useEffect } from "react";
import DogLogo from "@/components/DogLogo";

const NAV_ITEMS = [
  { href: "/discover", icon: Search, label: "探す" },
  { href: "/matches", icon: Heart, label: "マッチ" },
  { href: "/timeline", icon: MessageCircle, label: "つぶやき" },
  { href: "/spots", icon: MapPin, label: "スポット" },
  { href: "/profile", icon: User, label: "マイページ" },
];

// 画像のブラウン系カラーパレット
const COLORS = {
  primary: "#4a3728",   // ダークブラウン
  accent: "#c8956c",    // キャラメル
  bg: "#faf7f4",        // クリーム
  border: "#e0d5c8",    // ライトブラウン
  muted: "#a89080",     // ミュートブラウン
  activeBg: "#f5ede4",  // アクティブ背景
};

export default function MainNav({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  useEffect(() => { setPendingHref(null); }, [pathname]);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="fixed inset-0 flex flex-col max-w-lg mx-auto" style={{ background: COLORS.bg }}>
      {/* ヘッダー */}
      <header className="flex-none bg-white z-10" style={{ borderBottom: `1px solid ${COLORS.border}` }}>
        <div className="px-4 h-14 flex items-center justify-between">
          {/* アイコン + ロゴ画像 */}
          <div className="flex items-center gap-2">
            <DogLogo size={38} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logo-main.png"
              alt="ドッグLIFE"
              style={{ height: 32, width: "auto", objectFit: "contain" }}
            />
          </div>
          <button
            onClick={handleSignOut}
            className="text-xs px-3 py-1.5 rounded-full font-medium touch-manipulation"
            style={{ color: COLORS.muted, background: "#f0ebe4" }}
          >
            ログアウト
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overscroll-none">{children}</main>

      {/* ボトムナビ */}
      <nav className="flex-none bg-white" style={{ borderTop: `1px solid ${COLORS.border}` }}>
        <div className="flex">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive = pathname === href || pathname.startsWith(href + "/");
            const active = isActive || pendingHref === href;
            return (
              <Link
                key={href}
                href={href}
                onTouchStart={() => { if (!isActive) setPendingHref(href); }}
                onClick={() => { if (!isActive) setPendingHref(href); }}
                className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative select-none touch-manipulation min-h-[54px] transition-colors"
                style={{ color: active ? COLORS.primary : "#b0a090" }}
              >
                {active && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-full"
                    style={{ background: COLORS.accent }}
                  />
                )}
                <div
                  className={`p-1 rounded-xl transition-all ${active ? "" : ""}`}
                  style={{ background: active ? COLORS.activeBg : "transparent" }}
                >
                  <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span className={`text-[9px] ${active ? "font-bold" : "font-medium"}`}>{label}</span>
              </Link>
            );
          })}
        </div>
        <div className="h-safe-area-inset-bottom" />
      </nav>
    </div>
  );
}
