"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getCategories, type Restaurant } from "@/lib/restaurants";
import { isVerifiedLocation, locationReason, splitMapResults } from "@/lib/maps/locations";
import { mapUrl, readMapState, type MapState } from "@/lib/maps/state";
import { NaverMap } from "./naver-map";

export function MapExplorer({ restaurants, initialState }: { restaurants: readonly Restaurant[]; initialState: MapState }) {
  const [state, setState] = useState(initialState);
  const root = useRef<HTMLDivElement>(null);
  const { results, markers, unlocated } = useMemo(() => splitMapResults(restaurants, state.q, state.category), [restaurants, state.q, state.category]);
  const selected = results.find(row => row.id === state.selected);
  useEffect(() => {
    if (root.current) root.current.dataset.mapInteractive = "true";
    const restore = () => setState(readMapState(new URL(window.location.href).searchParams, restaurants));
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [restaurants]);
  const update = useCallback((patch: Partial<MapState>) => {
    const next = readMapState(new URL(mapUrl("/map", { ...state, ...patch }), window.location.origin).searchParams, restaurants);
    setState(next);
    window.history.replaceState(null, "", mapUrl("/map", next));
  }, [restaurants, state]);
  const select = useCallback((id: string) => update({ selected: id, view: "map" }), [update]);
  return <div ref={root} data-map-explorer data-map-interactive="false" className="pb-12">
    <div className="mb-7 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <form onSubmit={event => event.preventDefault()} role="search"><label htmlFor="map-search" className="block text-sm font-semibold">식당명 검색</label><input id="map-search" type="search" value={state.q} maxLength={200} onChange={event => update({ q: event.target.value })} placeholder="식당 이름을 검색해 보세요" className="mt-2 min-h-12 w-full rounded-xl border border-slate-300 px-4 text-base focus-visible:outline-2 focus-visible:outline-brand-blue" /></form>
      <fieldset className="mt-5"><legend className="mb-3 text-sm font-semibold">음식 종류</legend><div className="flex flex-wrap gap-2">{["", ...getCategories(restaurants)].map(category => <button type="button" key={category} data-map-category={category} aria-pressed={state.category === category} onClick={() => update({ category })} className={`min-h-11 rounded-full border px-4 py-2 text-sm ${state.category === category ? "border-navy bg-navy text-white" : "border-slate-200 text-slate-600"}`}>{category || "전체"}</button>)}</div></fieldset>
      <div className="mt-5 flex flex-wrap items-center justify-between gap-3"><button type="button" data-map-reset onClick={() => update({ q: "", category: "", selected: null })} className="min-h-11 text-sm text-slate-600 underline">필터 초기화</button><Link data-map-list-link href={mapUrl("/", state)} className="min-h-11 rounded-xl bg-surface px-4 py-3 text-sm font-semibold text-navy">카드 목록 보기 →</Link></div>
    </div>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-4"><p role="status" data-map-result-count className="text-sm text-slate-600">검색 {results.length}곳 · 지도 표시 {markers.length}곳 · 위치 확인 중 {unlocated.length}곳</p><div className="flex rounded-xl bg-surface p-1 lg:hidden" aria-label="지도와 목록 전환">{(["map", "list"] as const).map(view => <button key={view} type="button" data-map-view={view} aria-pressed={state.view === view} onClick={() => update({ view })} className={`min-h-11 rounded-lg px-5 text-sm font-semibold ${state.view === view ? "bg-white text-navy shadow-sm" : "text-slate-600"}`}>{view === "map" ? "지도" : "목록"}</button>)}</div></div>
    {selected && !isVerifiedLocation(selected) && <p role="status" className="mb-4 rounded-xl bg-surface p-4 text-sm leading-7">{selected.name}: 위치 확인 중입니다. {locationReason(selected)} 마커를 표시하지 않습니다.</p>}
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(18rem,1fr)]">
      <div className={`${state.view === "list" ? "hidden" : "block"} min-w-0 lg:block`}><NaverMap restaurants={markers} selected={state.selected} onSelect={select} visible={state.view === "map"} />{!markers.length && <p className="mt-4 rounded-xl bg-surface p-4 text-sm leading-7 text-slate-600">검색 결과에 위치 검증이 완료된 식당이 없습니다. 미확인 좌표로 마커를 만들지 않습니다.</p>}</div>
      <section aria-label="지도 식당 목록" className={`${state.view === "map" ? "hidden" : "block"} min-w-0 lg:block`}>
        {!results.length && <div className="rounded-2xl bg-surface px-5 py-12 text-center"><h2 className="font-bold">검색 결과가 없어요</h2><p className="mt-3 text-sm text-slate-600">검색어나 음식 종류를 바꾸거나 필터를 초기화해 주세요.</p></div>}
        <ul className="space-y-3 lg:max-h-[75vh] lg:overflow-y-auto lg:pr-2">{results.map(row => { const located = isVerifiedLocation(row); return <li key={row.id} data-map-row={row.id} data-location-verified={String(located)} aria-current={state.selected === row.id ? "true" : undefined} className={`rounded-2xl border p-5 ${state.selected === row.id ? "border-brand-blue bg-blue-50" : "border-slate-200 bg-white"}`}>
          <button type="button" data-map-select={row.id} onClick={() => select(row.id)} className="w-full text-left focus-visible:outline-2 focus-visible:outline-brand-blue"><span className="text-xs font-semibold text-link-blue">{row.category}</span><span className="mt-2 block break-keep text-lg font-bold text-navy">{row.name}</span><span className="mt-2 block text-sm text-slate-500">{row.averageRating != null && (row.reviewCount ?? 0) > 0 ? `${row.averageRating.toFixed(1)}점 · 리뷰 ${row.reviewCount}개` : "아직 리뷰 없음"}</span><span className="mt-3 block text-xs text-slate-600">{located ? "지도에서 위치 확인" : "위치 확인 중 · 마커 미표시"}</span></button>
          <Link href={`/restaurants/${row.id}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-link-blue underline underline-offset-4">상세 페이지 보기</Link>
        </li>; })}</ul>
        {!!unlocated.length && <p className="mt-4 text-xs leading-6 text-slate-500">미검증·위치 자료 불일치 식당은 목록에서만 확인할 수 있습니다.</p>}
      </section>
    </div>
  </div>;
}
