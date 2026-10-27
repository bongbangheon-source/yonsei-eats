import { getRestaurantData } from "@/lib/supabase/server";
import { readMapState } from "@/lib/maps/state";
import { MapExplorer } from "@/components/map-explorer";
import { DataSourceNotice } from "@/components/data-source-notice";

export const metadata = { title: "지도에서 식당 찾기 | 연세잇츠", referrer: "strict-origin-when-cross-origin" as const };
export const dynamic = "force-dynamic";
export default async function MapPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const data = await getRestaurantData();
  const params = new URLSearchParams();
  Object.entries(await searchParams).forEach(([key, value]) => { if (typeof value === "string") params.set(key, value); });
  return <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-5 pt-10 sm:px-8 sm:pt-14"><p className="mb-3 text-xs font-semibold tracking-widest text-link-blue">YONSEI EATS · MAP</p><h1 className="break-keep text-3xl font-bold text-navy sm:text-4xl">지도에서 찾는 신촌의 한 끼</h1><p className="mb-7 mt-4 text-sm leading-7 text-slate-600">검증된 위치만 지도에 표시합니다. 위치 확인 중인 식당도 목록과 상세 페이지에서 살펴볼 수 있어요.</p><DataSourceNotice source={data.source} notice={data.notice} /><MapExplorer key={JSON.stringify(readMapState(params, data.restaurants))} restaurants={data.restaurants} initialState={readMapState(params, data.restaurants)} /></main>;
}
