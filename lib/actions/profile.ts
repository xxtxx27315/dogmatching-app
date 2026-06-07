"use server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Profile } from "@/types/database";

export async function getMyProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  return (data as Profile) ?? null;
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "未認証です" };
  const file = formData.get("avatar") as File;
  if (!file || file.size === 0) return { error: "ファイルを選択してください" };
  const ext = file.name.split(".").pop();
  const path = `${user.id}/avatar.${ext}`;
  const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
  if (uploadError) return { error: uploadError.message };
  const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
  await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
  revalidatePath("/profile");
  return { success: true, url: publicUrl };
}
