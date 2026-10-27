import type { RestaurantData } from "@/lib/restaurant-repository";

export function DataSourceNotice({ source, notice }: Pick<RestaurantData, "source" | "notice">) {
  return (
    <aside data-source={source} aria-label="데이터 연결 상태" className="mb-6 mt-6 rounded-2xl border border-slate-200 bg-surface px-5 py-4 text-sm leading-7 text-slate-600">
      <p className="font-semibold text-navy">데이터 출처: {source === "supabase" ? "Supabase" : source === "local-recovery" ? "로컬 원본 (연결 복구 모드)" : "로컬 원본 (개발 모드)"}</p>
      {notice && <p role="status">{notice}</p>}
    </aside>
  );
}
