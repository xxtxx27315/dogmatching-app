"use client";
import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(""); setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: fd.get("email") as string,
        password: fd.get("password") as string,
      });
      if (error) { setError("メールアドレスまたはパスワードが違います"); setLoading(false); }
      else window.location.href = "/discover";
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="text-xl font-semibold text-center text-gray-800 mb-6">ログイン</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
          <input name="email" type="email" required autoComplete="email"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-700/30"
            placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
          <input name="password" type="password" required autoComplete="current-password"
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-700/30"
            placeholder="••••••••" />
        </div>
        {error && <p className="text-red-500 text-sm bg-red-50 rounded-lg px-4 py-2">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full premium-button text-white font-bold py-3 rounded-2xl transition disabled:opacity-50">
          {loading ? "ログイン中..." : "ログイン"}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-6">
        アカウントをお持ちでない方は{" "}
        <Link href="/signup" className="text-amber-500 font-semibold hover:underline">新規登録</Link>
      </p>
    </>
  );
}
