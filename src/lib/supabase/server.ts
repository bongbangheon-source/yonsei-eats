import "server-only";
import { queryRestaurantCatalog } from "./catalog";
import { loadRestaurantData } from "../restaurant-repository";
import { restaurants } from "../restaurants";

export function getRestaurantData() {
  return loadRestaurantData({
    env: process.env,
    local: restaurants,
    query: queryRestaurantCatalog,
  });
}
