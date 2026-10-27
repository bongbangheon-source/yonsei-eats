import type { SupabaseClient, User } from "@supabase/supabase-js";
import { validateNickname } from "./validation.ts";

export type Profile = { id: string; display_name: string | null; avatar_url: string | null; created_at: string };
type Result = { ok: true; profile: Profile } | { ok: false; message: string };
const failed = (): Result => ({ ok: false, message: "프로필을 불러오거나 저장하지 못했습니다. 잠시 후 프로필 다시 만들기를 시도해 주세요." });
const fields = "id,display_name,avatar_url,created_at";

export async function readProfile(client: Pick<SupabaseClient, "from">, userId: string): Promise<Result> {
  try {
    const { data, error } = await client.from("profiles").select(fields).eq("id", userId).maybeSingle();
    return error || !data ? failed() : { ok: true, profile: data as Profile };
  } catch { return failed(); }
}

// Caller supplies auth.getUser()'s verified identity; metadata is display data only.
export async function ensureProfile(client: Pick<SupabaseClient, "from">, user: Pick<User, "id" | "user_metadata">): Promise<Result> {
  const raw = user.user_metadata?.display_name;
  const nickname = typeof raw === "string" && !validateNickname(raw) ? raw.trim() : null;
  try {
    const { error } = await client.from("profiles").upsert({ id: user.id, display_name: nickname }, { onConflict: "id", ignoreDuplicates: true });
    if (error) return failed();
    return readProfile(client, user.id);
  } catch { return failed(); }
}

export async function updateNickname(client: Pick<SupabaseClient, "from">, userId: string, nickname: string): Promise<Result> {
  const invalid = validateNickname(nickname);
  if (invalid) return { ok: false, message: invalid };
  try {
    const { data, error } = await client.from("profiles").update({ display_name: nickname.trim() }).eq("id", userId).select(fields).single();
    return error || !data ? failed() : { ok: true, profile: data as Profile };
  } catch { return failed(); }
}
