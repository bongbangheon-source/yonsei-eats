import "server-only";
import { cache } from "react";
import { createAuthClient } from "../supabase/auth-server";

export const getAuthContext = cache(async () => {
  const client = await createAuthClient();
  if (!client) return { client, user: null, unavailable: true };
  try {
    const { data, error } = await client.auth.getUser();
    const unavailable = !!error && !["AuthSessionMissingError"].includes(error.name) && error.status !== 400 && error.status !== 401 && error.status !== 403;
    return { client, user: error ? null : data.user, unavailable };
  } catch { return { client, user: null, unavailable: true }; }
});
