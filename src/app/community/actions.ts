"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { createAuthClient } from "@/lib/supabase/auth-server";
import { saveReview, deleteReview, setFavorite, type CommunityState } from "@/lib/community/operations";

const text = (form: FormData, key: string) => typeof form.get(key) === "string" ? form.get(key) as string : "";
async function context() {
  const values = await headers();
  const origin = values.get("origin");
  try { if (!origin || new URL(origin).host !== (values.get("x-forwarded-host") ?? values.get("host"))) return null; } catch { return null; }
  const client = await createAuthClient(true);
  if (!client) return null;
  try {
    const { data, error } = await client.auth.getUser();
    return error || !data.user ? null : { client, userId: data.user.id };
  } catch { return null; }
}
function refresh(restaurantId: string) {
  revalidatePath("/");
  revalidatePath(`/restaurants/${restaurantId}`);
  revalidatePath("/mypage");
}
const denied = (): CommunityState => ({ status: "error", message: "로그인 상태와 요청 출처를 확인한 뒤 다시 시도해 주세요." });

export async function reviewAction(_: CommunityState, form: FormData): Promise<CommunityState> {
  const auth = await context();
  if (!auth) return denied();
  const restaurantId = text(form, "restaurantId");
  const result = await saveReview(auth.client, auth.userId, { id: text(form, "id"), restaurantId, rating: text(form, "rating"), body: text(form, "body"), tagIds: form.getAll("tagIds"), creating: text(form, "creating") === "true" });
  if (/^sinchon-(0[1-9]|1[0-9]|20)$/.test(restaurantId)) refresh(restaurantId);
  return result;
}

export async function deleteReviewAction(_: CommunityState, form: FormData): Promise<CommunityState> {
  const auth = await context();
  if (!auth) return denied();
  if (text(form, "confirmed") !== "yes") return { status: "error", message: "리뷰 삭제를 확인해 주세요." };
  const restaurantId = text(form, "restaurantId");
  const result = await deleteReview(auth.client, auth.userId, text(form, "id"), restaurantId);
  if (/^sinchon-(0[1-9]|1[0-9]|20)$/.test(restaurantId)) refresh(restaurantId);
  return result;
}

export async function favoriteAction(_: CommunityState, form: FormData): Promise<CommunityState> {
  const auth = await context();
  if (!auth) return denied();
  const restaurantId = text(form, "restaurantId");
  const result = await setFavorite(auth.client, auth.userId, { restaurantId, desired: text(form, "desired") });
  // Even errors re-read/re-render so a network error cannot leave an optimistic lie.
  if (/^sinchon-(0[1-9]|1[0-9]|20)$/.test(restaurantId)) refresh(restaurantId);
  return result;
}
