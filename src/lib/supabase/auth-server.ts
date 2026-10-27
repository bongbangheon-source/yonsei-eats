import "server-only";
import { createCookieAuthClient } from "./auth-client";
import { cookies } from "next/headers";
import { readSupabaseConfig } from "./config";

// A fresh client per request. Only actions can write cookies; proxy refreshes
// before Server Components render. Public restaurant reads stay independent.
export async function createAuthClient(writable = false) {
  const config = readSupabaseConfig(process.env);
  if (!config.ok) return null;
  const store = await cookies();
  return createCookieAuthClient(config.config, {
      getAll: () => store.getAll(),
      setAll(values) {
        if (!writable) return; // Refreshed by proxy; components cannot set cookies.
        values.forEach(({ name, value, options }) => store.set(name, value, options));
      },
  }, process.env.NODE_ENV === "production");
}
