export const isRestaurantId = (value: unknown): value is string => typeof value === "string" && /^sinchon-(0[1-9]|1[0-9]|20)$/.test(value);
export const isReviewId = (value: unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
export type ReviewInput = { id: string; restaurantId: string; rating: number; body: string; tagIds: number[]; creating: boolean };
type Parsed<T> = { ok: true; value: T } | { ok: false; message: string };

export function parseReview(raw: Record<string, unknown>): Parsed<ReviewInput> {
  if (!isReviewId(raw.id) || !isRestaurantId(raw.restaurantId) || typeof raw.creating !== "boolean") return { ok: false, message: "리뷰 요청 정보를 확인해 주세요." };
  const rating = typeof raw.rating === "string" || typeof raw.rating === "number" ? Number(raw.rating) : NaN;
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) return { ok: false, message: "별점은 1~5점 중 선택해 주세요." };
  if (typeof raw.body !== "string" || !raw.body.trim() || Array.from(raw.body.trim()).length > 5000) return { ok: false, message: "리뷰 내용은 공백을 제외하고 1~5000자로 입력해 주세요." };
  if (!Array.isArray(raw.tagIds) || raw.tagIds.length > 10) return { ok: false, message: "태그는 최대 10개 선택할 수 있습니다." };
  const ids = raw.tagIds.map(value => typeof value === "string" && /^\d+$/.test(value) ? Number(value) : typeof value === "number" ? value : NaN);
  if (ids.some(value => !Number.isSafeInteger(value) || value < 1) || new Set(ids).size !== ids.length) return { ok: false, message: "선택한 태그를 확인해 주세요." };
  return { ok: true, value: { id: raw.id, restaurantId: raw.restaurantId, rating, body: raw.body.trim(), tagIds: ids, creating: raw.creating } };
}

export function parseFavorite(raw: Record<string, unknown>): Parsed<{ restaurantId: string; desired: boolean }> {
  if (!isRestaurantId(raw.restaurantId) || (raw.desired !== "on" && raw.desired !== "off")) return { ok: false, message: "즐겨찾기 요청 정보를 확인해 주세요." };
  return { ok: true, value: { restaurantId: raw.restaurantId, desired: raw.desired === "on" } };
}

export function communityError(error?: { code?: string; message?: string } | null): string {
  if (["PGRST202", "PGRST205", "42883", "42P01", "42703"].includes(error?.code ?? "")) return "DB 기능 설정이 필요합니다. Phase 4 마이그레이션 적용 여부를 확인해 주세요.";
  if (["42501", "P0002"].includes(error?.code ?? "")) return "변경할 권한이 없거나 리뷰가 더 이상 존재하지 않습니다. 새로고침해 주세요.";
  if (["23503", "23514", "22023"].includes(error?.code ?? "")) return "리뷰 내용·별점·태그 또는 식당 정보를 확인해 주세요.";
  return "요청을 처리하지 못했습니다. 연결 상태를 확인한 뒤 다시 시도해 주세요.";
}
