"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function DeleteAccountButton() {
  const [step, setStep] = useState<"idle" | "confirm" | "loading">("idle");

  async function handleDelete() {
    setStep("loading");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ is_active: false }).eq("id", user.id);
    }
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (step === "confirm") {
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-5 space-y-3">
        <p className="text-red-700 font-semibold text-sm">本当に退会しますか？</p>
        <p className="text-red-500 text-xs">投稿・プロフィールがすべて削除されます。この操作は取り消せません。</p>
        <div className="flex gap-2">
          <button
            onClick={() => setStep("idle")}
            className="flex-1 border border-gray-200 text-gray-600 text-sm font-semibold py-2.5 rounded-xl touch-manipulation"
          >
            キャンセル
          </button>
          <button
            onClick={handleDelete}
            className="flex-1 bg-red-500 text-white text-sm font-bold py-2.5 rounded-xl active:opacity-80 touch-manipulation"
          >
            退会する
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setStep("confirm")}
      disabled={step === "loading"}
      className="w-full flex items-center justify-center gap-2 text-red-400 text-sm py-3 rounded-2xl border border-red-100 hover:bg-red-50 active:bg-red-50 touch-manipulation select-none"
    >
      <Trash2 size={15} />
      退会する
    </button>
  );
}
