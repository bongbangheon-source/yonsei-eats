import type { SupabaseClient } from "@supabase/supabase-js";
import { communityError, isRestaurantId, isReviewId, parseFavorite, parseReview } from "./validation.ts";

export type CommunityState = { status: "idle" | "success" | "error"; message: string; favorite?: boolean | null; savedId?: string };
type Client = Pick<SupabaseClient, "from" | "rpc">;
const failure = (message: string): CommunityState => ({ status: "error", message });
const guest = () => failure("로그인한 후 이용해 주세요.");

export async function saveReview(client: Client, userId: string | null, raw: Record<string, unknown>): Promise<CommunityState> {
  if (!userId) return guest();
  const parsed = parseReview(raw);
  if (!parsed.ok) return failure(parsed.message);
  const input = parsed.value;
  try {
    const { data, error } = await client.rpc("save_review", { p_id: input.id, p_restaurant_id: input.restaurantId, p_rating: input.rating, p_body: input.body, p_tag_ids: input.tagIds, p_creating: input.creating });
    if (error || data !== input.id) return failure(communityError(error));
    return { status: "success", message: input.creating ? "리뷰를 등록했습니다." : "리뷰를 수정했습니다.", savedId: input.id };
  } catch { return failure(communityError()); }
}

export async function deleteReview(client: Client, userId: string | null, id: string, restaurantId: string): Promise<CommunityState> {
  if (!userId) return guest();
  if (!isReviewId(id) || !isRestaurantId(restaurantId)) return failure("리뷰 요청 정보를 확인해 주세요.");
  try {
    const { data, error } = await client.from("reviews").delete().eq("id", id).eq("restaurant_id", restaurantId).eq("user_id", userId).select("id");
    if (error || !data?.length) return failure(communityError(error ?? { code: "P0002" }));
    return { status: "success", message: "리뷰를 삭제했습니다." };
  } catch { return failure(communityError()); }
}

export async function readFavorite(client: Pick<SupabaseClient, "from">, userId: string, restaurantId: string): Promise<boolean | null> {
  try {
    const { data, error } = await client.from("favorites").select("restaurant_id").eq("user_id", userId).eq("restaurant_id", restaurantId).maybeSingle();
    return error ? null : !!data;
  } catch { return null; }
}

export async function setFavorite(client: Client, userId: string | null, raw: Record<string, unknown>): Promise<CommunityState> {
  if (!userId) return guest();
  const parsed = parseFavorite(raw);
  if (!parsed.ok) return failure(parsed.message);
  const input = parsed.value;
  let error: { code?: string } | null = null;
  try {
    const result = input.desired
      ? await client.from("favorites").upsert({ user_id: userId, restaurant_id: input.restaurantId }, { onConflict: "user_id,restaurant_id", ignoreDuplicates: true })
      : await client.from("favorites").delete().eq("user_id", userId).eq("restaurant_id", input.restaurantId);
    error = result.error;
  } catch { error = {}; }
  const favorite = await readFavorite(client, userId, input.restaurantId);
  if (error || favorite === null || favorite !== input.desired) return { ...failure(communityError(error)), favorite };
  return { status: "success", message: favorite ? "즐겨찾기에 추가했습니다." : "즐겨찾기를 해제했습니다.", favorite };
}
