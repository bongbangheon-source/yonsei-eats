import registry from "../../../data/restaurant-locations.json" with { type: "json" };
import { filterRestaurants, type Restaurant } from "../restaurants.ts";

export type LocationEvidence = { id: string; name: string; status: string; address: string | null; latitude: number | null; longitude: number | null; sourceUrl: string | null; checkedAt: string | null; reason?: string };
export const locationEvidence: readonly LocationEvidence[] = registry.locations;
export type LocatedRestaurant = Restaurant & { latitude: number; longitude: number; address: string };

export function isVerifiedLocation(restaurant: Restaurant, evidence: readonly LocationEvidence[] = locationEvidence): restaurant is LocatedRestaurant {
  const entry = evidence.find(item => item.id === restaurant.id);
  if (!entry || entry.status !== "verified" || entry.name !== restaurant.name || !entry.address || !entry.sourceUrl || !entry.checkedAt || !/^\d{4}-\d{2}-\d{2}$/.test(entry.checkedAt) || !Number.isFinite(Date.parse(entry.checkedAt))) return false;
  try { if (new URL(entry.sourceUrl).protocol !== "https:") return false; } catch { return false; }
  return typeof entry.latitude === "number" && Number.isFinite(entry.latitude) && entry.latitude >= -90 && entry.latitude <= 90 && typeof entry.longitude === "number" && Number.isFinite(entry.longitude) && entry.longitude >= -180 && entry.longitude <= 180 && restaurant.address === entry.address && restaurant.latitude === entry.latitude && restaurant.longitude === entry.longitude;
}

export function splitMapResults(restaurants: readonly Restaurant[], query: string, category: string, evidence: readonly LocationEvidence[] = locationEvidence) {
  const results = filterRestaurants(restaurants, query, category);
  return { results, markers: results.filter((row): row is LocatedRestaurant => isVerifiedLocation(row, evidence)), unlocated: results.filter(row => !isVerifiedLocation(row, evidence)) };
}

export function locationReason(restaurant: Restaurant): string {
  const entry = locationEvidence.find(item => item.id === restaurant.id);
  if (entry?.status === "verified" && !isVerifiedLocation(restaurant)) return "검증 자료와 DB 위치 정보가 아직 일치하지 않습니다.";
  return entry?.reason ?? "확인된 위치 자료가 없습니다.";
}
