// Pure data access; request-bound SSR clients are constructed only on the server.
import type { SupabaseClient } from "@supabase/supabase-js";
import { communityError, isReviewId } from "./validation.ts";

export type Tag = { id: number; name: string };
export type Review = { id: string; restaurantId: string; restaurantName: string; userId: string; rating: number; body: string; createdAt: string; updatedAt: string; author: string; tags: Tag[] };
export type ReviewPage = { reviews: Review[]; total: number; page: number; error: string | null; tags: Tag[]; writeReady: boolean; notice: string | null };
type Client = Pick<SupabaseClient, "from">;
export const PAGE_SIZE = 20;
export const reviewPageNumber = (value: unknown) => typeof value === "string" && /^\d+$/.test(value) ? Math.min(100000, Math.max(1, Number(value))) : 1;

function tag(value: unknown): Tag {
  const row = value as Record<string, unknown>;
  if (!row || !Number.isSafeInteger(Number(row.id)) || Number(row.id) < 1 || typeof row.name !== "string") throw new Error("Invalid tag");
  return { id: Number(row.id), name: row.name };
}

export async function getReviewPage(client: Client | null, filter: { restaurantId?: string; userId?: string; page: number }): Promise<ReviewPage> {
  const empty: ReviewPage = { reviews: [], total: 0, page: filter.page, error: null, tags: [], writeReady: false, notice: null };
  if (!client) return { ...empty, error: "리뷰 서비스 설정을 확인해 주세요." };
  try {
    let query = client.from("reviews").select("id,restaurant_id,user_id,rating,body,created_at,updated_at,restaurants(name),review_tag_links(tag_id,review_tags(id,name))", { count: "exact" });
    if (filter.restaurantId) query = query.eq("restaurant_id", filter.restaurantId);
    if (filter.userId) query = query.eq("user_id", filter.userId);
    const [result, definitions] = await Promise.all([
      query.order("created_at", { ascending: false }).order("id", { ascending: false }).range((filter.page - 1) * PAGE_SIZE, filter.page * PAGE_SIZE - 1),
      client.from("review_tags").select("id,name").order("id"),
    ]);
    if (result.error || !result.data || result.count === null) return { ...empty, error: "리뷰를 불러오지 못했습니다. 잠시 후 다시 확인해 주세요." };
    const ids = result.data.map(row => String(row.id));
    let authorsQuery = client.from("review_author_names").select("review_id,display_name");
    authorsQuery = ids.length ? authorsQuery.in("review_id", ids) : authorsQuery.limit(0);
    const authorsResult = await authorsQuery;
    const authors = new Map((authorsResult.data ?? []).map(row => [String(row.review_id), typeof row.display_name === "string" && row.display_name.trim() ? row.display_name : "익명 사용자"]));
    const tags = definitions.error ? [] : (definitions.data ?? []).map(tag);
    const reviews = result.data.map(row => {
      if (!isReviewId(row.id) || typeof row.body !== "string" || typeof row.user_id !== "string" || !Number.isInteger(row.rating) || row.rating < 1 || row.rating > 5 || !Number.isFinite(Date.parse(row.created_at))) throw new Error("Invalid review");
      const restaurant = Array.isArray(row.restaurants) ? row.restaurants[0] : row.restaurants;
      return { id: row.id, restaurantId: row.restaurant_id, restaurantName: restaurant?.name ?? "식당 정보 확인 중", userId: row.user_id, rating: row.rating, body: row.body, createdAt: row.created_at, updatedAt: row.updated_at, author: authors.get(row.id) ?? "익명 사용자", tags: (row.review_tag_links ?? []).flatMap(link => {
        const value = Array.isArray(link.review_tags) ? link.review_tags[0] : link.review_tags;
        return value ? [tag(value)] : [];
      }) };
    });
    return { ...empty, reviews, total: result.count, tags, writeReady: !authorsResult.error && !definitions.error, notice: authorsResult.error ? communityError(authorsResult.error) : definitions.error ? "태그를 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요." : null };
  } catch { return { ...empty, error: "리뷰를 불러오지 못했습니다. 연결과 데이터 형식을 확인해 주세요." }; }
}

export type FavoriteRestaurant = { id: string; name: string; category: string };
export async function getMyFavorites(client: Client | null, userId: string | null): Promise<{ restaurants: FavoriteRestaurant[]; error: string | null }> {
  if (!userId) return { restaurants: [], error: null };
  if (!client) return { restaurants: [], error: "즐겨찾기 상태를 확인하지 못했습니다." };
  try {
    const { data, error } = await client.from("favorites").select("restaurant_id,restaurants(id,name,category)").eq("user_id", userId).order("created_at", { ascending: false }).order("restaurant_id");
    if (error || !data) return { restaurants: [], error: "즐겨찾기를 불러오지 못했습니다. 새로고침해 주세요." };
    return { restaurants: data.flatMap(row => {
      const restaurant = Array.isArray(row.restaurants) ? row.restaurants[0] : row.restaurants;
      return restaurant ? [{ id: restaurant.id, name: restaurant.name, category: restaurant.category }] : [];
    }), error: null };
  } catch { return { restaurants: [], error: "즐겨찾기를 불러오지 못했습니다. 연결 상태를 확인해 주세요." }; }
}
