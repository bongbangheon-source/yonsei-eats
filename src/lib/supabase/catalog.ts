import { createClient } from "@supabase/supabase-js";
import type { PublicSupabaseConfig } from "./config.ts";

// Shared by the server-only entry point and the read-only connection check.
export async function queryRestaurantCatalog({ url, key }: PublicSupabaseConfig, fetcher: typeof fetch = fetch) {
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: async (input, init) => {
      const started = Date.now();
      try {
        return await fetcher(input, { ...init, cache: "no-store", signal: AbortSignal.timeout(8000) });
      } catch (error) {
        const failure = error as { name?: unknown; cause?: { code?: unknown } };
        // Only bounded identifiers; never URLs, headers, messages or raw errors.
        const identifier = (value: unknown) => typeof value === "string" && /^[A-Za-z_0-9]{1,64}$/.test(value) ? value : "unknown";
        console.error("[Supabase catalog transport] " + JSON.stringify({ name: identifier(failure?.name), code: identifier(failure?.cause?.code), elapsedMs: Date.now() - started }));
        throw error;
      }
    } },
  });
  return client.from("restaurant_catalog").select("id,name,category,address,latitude,longitude,representative_menu,representative_price,opening_hours,photo_url,operating_status,average_rating,reviewer_count,review_count").order("id");
}
