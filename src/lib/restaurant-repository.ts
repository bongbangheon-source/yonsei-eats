import type { Restaurant } from "./restaurants";
import { readSupabaseConfig, type PublicSupabaseConfig } from "./supabase/config.ts";

export type RestaurantData = { restaurants: readonly Restaurant[]; source: "supabase" | "local" | "local-recovery"; notice: string | null };
export type QueryResult = { data: unknown[] | null; error: { code?: string } | null };
export function resolveRestaurantDetail(data: RestaurantData, id: string): { state: "found"; restaurant: Restaurant } | { state: "missing" | "unavailable" } {
  const restaurant = data.restaurants.find(item => item.id === id);
  if (restaurant) return { state: "found", restaurant };
  return { state: data.source === "local-recovery" ? "unavailable" : "missing" };
}
type Options = { env: Record<string, string | undefined>; local: readonly Restaurant[]; query: (config: PublicSupabaseConfig) => Promise<QueryResult> };

function nullableText(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string") throw new Error("Invalid text");
  return value;
}
function numeric(value: unknown, min: number, max: number): number {
  if ((typeof value !== "number" && typeof value !== "string") || value === "") throw new Error("Invalid numeric value");
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max) throw new Error("Invalid numeric range");
  return number;
}

export function mapRestaurantRow(value: unknown): Restaurant {
  if (!value || typeof value !== "object") throw new Error("Invalid row");
  const row = value as Record<string, unknown>;
  for (const key of ["id", "name", "category"]) if (typeof row[key] !== "string" || !(row[key] as string).trim()) throw new Error("Missing identity");
  const averageRating = row.average_rating === null ? null : numeric(row.average_rating, 1, 5);
  const reviewerCount = numeric(row.reviewer_count, 0, Number.MAX_SAFE_INTEGER);
  const reviewCount = numeric(row.review_count, 0, Number.MAX_SAFE_INTEGER);
  if (!Number.isInteger(reviewerCount) || !Number.isInteger(reviewCount) || reviewCount < reviewerCount || ((averageRating === null) !== (reviewerCount === 0))) throw new Error("Invalid aggregate");
  const price = row.representative_price === null ? null : numeric(row.representative_price, 0, Number.MAX_SAFE_INTEGER);
  if (price !== null && !Number.isInteger(price)) throw new Error("Invalid price");
  return {
    id: row.id as string, name: row.name as string, category: row.category as string,
    address: nullableText(row.address), representativeMenu: nullableText(row.representative_menu), representativePrice: price,
    openingHours: nullableText(row.opening_hours), photoUrl: nullableText(row.photo_url), operatingStatus: nullableText(row.operating_status),
    latitude: row.latitude === null ? null : numeric(row.latitude, -90, 90),
    longitude: row.longitude === null ? null : numeric(row.longitude, -180, 180),
    averageRating, reviewerCount, reviewCount,
  };
}

function queryError(code?: string): string {
  if (["PGRST205", "PGRST204", "42P01", "42703"].includes(code ?? "")) return "Supabase 스키마가 준비되지 않았습니다. 승인 후 migration과 seed 적용 여부를 확인해 주세요.";
  if (code === "42501") return "Supabase 조회 권한 또는 RLS 설정을 확인해 주세요.";
  if (["PGRST301", "PGRST302", "PGRST303", "401"].includes(code ?? "")) return "Supabase 공개 키 또는 인증 설정을 확인해 주세요.";
  return "Supabase 데이터 연결 또는 조회에 실패했습니다. 네트워크와 프로젝트 설정을 확인해 주세요.";
}

export async function loadRestaurantData({ env, local, query }: Options): Promise<RestaurantData> {
  const recovery = (reason: string): RestaurantData => ({ restaurants: local, source: "local-recovery", notice: `${reason} 현재는 복구용 로컬 식당 데이터를 표시합니다.` });
  const mode = env.RESTAURANT_DATA_SOURCE ?? "supabase";
  if (mode === "local") return { restaurants: local, source: "local", notice: "개발·복구용 로컬 식당 데이터를 표시하고 있습니다. Supabase 조회 모드가 아닙니다." };
  if (mode !== "supabase") return recovery("식당 데이터 조회 모드 설정을 확인해 주세요.");
  const config = readSupabaseConfig(env);
  if (!config.ok) return recovery(config.message);
  let result: QueryResult;
  try { result = await query(config.config); } catch { return recovery(queryError()); }
  if (result.error) return recovery(queryError(result.error.code));
  if (!Array.isArray(result.data)) return recovery("Supabase 데이터 응답 형식을 확인해 주세요.");
  try {
    const restaurants = result.data.map(mapRestaurantRow);
    return { restaurants, source: "supabase", notice: restaurants.length ? null : "Supabase에서 조회 가능한 초기 데이터가 없습니다. 승인 후 seed와 조회 정책을 확인해 주세요." };
  } catch { return recovery("Supabase 데이터 형식과 스키마를 확인해 주세요."); }
}
