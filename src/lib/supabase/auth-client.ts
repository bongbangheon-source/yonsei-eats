import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import type { PublicSupabaseConfig } from "./config.ts";

export function createCookieAuthClient(config: PublicSupabaseConfig, cookies: CookieMethodsServer, secure: boolean, fetcher: typeof fetch = fetch) {
  return createServerClient(config.url, config.key, {
    cookieOptions: { sameSite: "lax", httpOnly: true, secure },
    global: { fetch: (input, init) => fetcher(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(10000) }) },
    cookies,
  });
}
