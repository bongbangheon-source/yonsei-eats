import data from "../../data/restaurants.json" with { type: "json" };

export type Restaurant = Readonly<{
  id: string;
  name: string;
  category: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  representativeMenu: string | null;
  representativePrice: number | null;
  openingHours: string | null;
  photoUrl: string | null;
  operatingStatus: string | null;
}>;

export const restaurants: readonly Restaurant[] = data.restaurants;

export function getRestaurant(id: string): Restaurant | undefined {
  return restaurants.find((restaurant) => restaurant.id === id);
}

export function getCategories(items: readonly Restaurant[]): string[] {
  return [...new Set(items.map((restaurant) => restaurant.category))];
}

export function filterRestaurants(
  items: readonly Restaurant[],
  query: string,
  category: string,
): Restaurant[] {
  const normalizedQuery = query.trim().toLowerCase();
  return items.filter(
    (restaurant) =>
      restaurant.name.toLowerCase().includes(normalizedQuery) &&
      (!category || restaurant.category === category),
  );
}

export function formatPrice(price: number | null): string {
  return price === null ? "정보 확인 중" : `${price.toLocaleString("ko-KR")}원`;
}
