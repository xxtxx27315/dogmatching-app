"use client";

import { createClient } from "@/lib/supabase/client";

export default function SignOutButton() {
  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <button
      onClick={handleSignOut}
      className="w-full text-center text-sm text-gray-400 hover:text-red-400 transition py-2"
    >
      ログアウト
    </button>
  );
}
