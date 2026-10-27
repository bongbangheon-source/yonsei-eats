import type { LocatedRestaurant } from "./locations.ts";
import type { NaverMaps, MarkerInstance } from "./naver-types.ts";

export function createMapController(element: HTMLElement, sdk: NaverMaps, onSelect: (id: string) => void, doc: Document = document) {
  const map = new sdk.Map(element, { zoom: 15, zoomControl: true });
  const markers = new Map<string, { marker: MarkerInstance; row: LocatedRestaurant }>();
  let listeners: object[] = [];
  let info: InstanceType<NaverMaps["InfoWindow"]> | null = null;
  function clear() {
    info?.close();
    info = null;
    listeners.forEach(listener => sdk.Event.removeListener(listener));
    listeners = [];
    markers.forEach(({ marker }) => marker.setMap(null));
    markers.clear();
  }
  return {
    render(rows: readonly LocatedRestaurant[]) {
      clear();
      rows.forEach(row => {
        const marker = new sdk.Marker({ map, position: new sdk.LatLng(row.latitude, row.longitude), title: row.name });
        markers.set(row.id, { marker, row });
        listeners.push(sdk.Event.addListener(marker, "click", () => onSelect(row.id)));
      });
      if (rows.length === 1) map.panTo(new sdk.LatLng(rows[0].latitude, rows[0].longitude));
      if (rows.length > 1) map.fitBounds(new sdk.LatLngBounds(new sdk.LatLng(Math.min(...rows.map(row => row.latitude)), Math.min(...rows.map(row => row.longitude))), new sdk.LatLng(Math.max(...rows.map(row => row.latitude)), Math.max(...rows.map(row => row.longitude)))));
    },
    select(id: string | null) {
      info?.close();
      const selected = id ? markers.get(id) : null;
      if (!selected) return;
      const { marker, row } = selected;
      const content = doc.createElement("div");
      content.style.padding = "14px";
      content.style.maxWidth = "240px";
      const title = doc.createElement("h3"); title.textContent = row.name;
      const category = doc.createElement("p"); category.textContent = row.category;
      const rating = doc.createElement("p"); rating.textContent = row.averageRating != null && (row.reviewCount ?? 0) > 0 ? `${row.averageRating.toFixed(1)}점 · 리뷰 ${row.reviewCount}개` : "아직 리뷰 없음";
      const link = doc.createElement("a"); link.href = `/restaurants/${encodeURIComponent(row.id)}`; link.textContent = "상세 페이지 보기"; link.style.textDecoration = "underline";
      content.append(title, category, rating, link);
      info = new sdk.InfoWindow({ content, maxWidth: 280 });
      info.open(map, marker);
      map.panTo(new sdk.LatLng(row.latitude, row.longitude));
    },
    resize() {
      const width = element.clientWidth, height = element.clientHeight;
      if (width > 0 && height > 0) map.setSize({ width, height });
    },
    destroy() { clear(); map.destroy(); },
  };
}
