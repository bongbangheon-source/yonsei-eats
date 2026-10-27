import { filterRestaurants, getCategories, type Restaurant } from "../restaurants.ts";

export type MapState = { q: string; category: string; selected: string | null; view: "map" | "list" };
export function readMapState(params: URLSearchParams, restaurants: readonly Restaurant[]): MapState {
  const q = (params.get("q") ?? "").slice(0, 200);
  const requested = params.get("category") ?? "";
  const category = getCategories(restaurants).includes(requested) ? requested : "";
  const selected = params.get("selected");
  return { q, category, selected: filterRestaurants(restaurants, q, category).some(row => row.id === selected) ? selected : null, view: params.get("view") === "list" ? "list" : "map" };
}
export function mapUrl(path: "/" | "/map", state: Partial<MapState>): string {
  const params = new URLSearchParams();
  if (state.q) params.set("q", state.q);
  if (state.category) params.set("category", state.category);
  if (path === "/map") {
    if (state.selected) params.set("selected", state.selected);
    if (state.view === "list") params.set("view", state.view);
  }
  return `${path}${params.size ? `?${params}` : ""}`;
}
