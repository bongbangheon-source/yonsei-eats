export type PublicSupabaseConfig = { url: string; key: string };
export type ConfigurationResult = { ok: true; config: PublicSupabaseConfig } | { ok: false; message: string };

export function readSupabaseConfig(env: Record<string, string | undefined>): ConfigurationResult {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !key) return { ok: false, message: "Supabase 설정이 필요합니다. URL과 공개 키를 .env.local에 입력해 주세요." };
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && !(parsed.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname))) throw new Error("url");
    if (parsed.username || parsed.password || parsed.search || parsed.hash || (parsed.pathname !== "/" && parsed.pathname !== "")) throw new Error("url");
  } catch { return { ok: false, message: "Supabase URL 설정 형식을 확인해 주세요." }; }
  let isPublic = key.startsWith("sb_publishable_");
  if (!isPublic && key.split(".").length === 3) {
    try { isPublic = JSON.parse(Buffer.from(key.split(".")[1], "base64url").toString()).role === "anon"; } catch { isPublic = false; }
  }
  if (!isPublic) return { ok: false, message: "Supabase 공개 키 설정을 확인해 주세요. secret/service_role 키는 사용할 수 없습니다." };
  return { ok: true, config: { url, key } };
}
