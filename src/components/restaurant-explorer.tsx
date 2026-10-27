"use client";

import { useEffect, useRef, useState } from "react";
import { filterRestaurants, getCategories, type Restaurant } from "@/lib/restaurants";
import { RestaurantCard } from "./restaurant-card";
import { ViewLink } from "./view-link";

type Props = { restaurants: readonly Restaurant[]; initialQuery: string; initialCategory: string; loggedIn?: boolean; favoriteIds?: string[]; favoritesUnavailable?: boolean };

export function RestaurantExplorer({ restaurants, initialQuery, initialCategory, loggedIn = false, favoriteIds = [], favoritesUnavailable = false }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const root = useRef<HTMLElement>(null);
  const categories = getCategories(restaurants);
  const results = filterRestaurants(restaurants, query, category);

  useEffect(() => {
    if (root.current) root.current.dataset.explorerReady = "true";
    const restore = () => {
      const params = new URLSearchParams(window.location.search);
      setQuery(params.get("q") ?? "");
      const next = params.get("category") ?? "";
      setCategory(getCategories(restaurants).includes(next) ? next : "");
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [restaurants]);

  function updateFilters(nextQuery: string, nextCategory: string) {
    setQuery(nextQuery);
    setCategory(nextCategory);
    const url = new URL(window.location.href);
    if (nextQuery) url.searchParams.set("q", nextQuery); else url.searchParams.delete("q");
    if (nextCategory) url.searchParams.set("category", nextCategory); else url.searchParams.delete("category");
    window.history.replaceState(null, "", url);
  }

  return (
    <section id="restaurants" ref={root} data-explorer-ready="false" aria-labelledby="explore-heading" className="scroll-mt-6 pb-20">
      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        <h2 id="explore-heading" className="text-xl font-bold text-navy">어떤 식당을 찾으세요?</h2>
        <form role="search" className="mt-5" onSubmit={event => event.preventDefault()}>
          <label htmlFor="restaurant-search" className="mb-2 block text-sm font-medium text-slate-600">식당명 검색</label>
          <div className="relative">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-slate-400"><circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
            <input id="restaurant-search" name="q" type="search" value={query} onChange={event => updateFilters(event.target.value, category)} placeholder="가고 싶은 식당 이름을 검색해 보세요" className="w-full rounded-2xl border border-slate-300 bg-surface/60 py-3.5 pl-12 pr-4 text-base text-navy outline-none placeholder:text-slate-500 focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20" />
          </div>
        </form>
        <fieldset className="mt-6">
          <legend className="mb-3 text-sm font-medium text-slate-600">음식 종류</legend>
          <div className="flex flex-wrap gap-2">
            {["", ...categories].map(item => (
              <button key={item} type="button" data-category={item} aria-pressed={category === item} onClick={() => updateFilters(query, item)} className={`min-h-11 rounded-full border px-4 py-2 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${category === item ? "border-navy bg-navy text-white" : "border-slate-200 bg-white text-slate-600 hover:border-brand-blue hover:text-link-blue"}`}>{item || "전체"}</button>
            ))}
          </div>
        </fieldset>
        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
          <ViewLink target="/map" />
          <button type="button" disabled data-preparing className="cursor-not-allowed rounded-xl bg-surface px-3 py-2 text-xs text-slate-500">가격 필터 · 데이터 준비 중</button>
          <button type="button" disabled data-preparing className="cursor-not-allowed rounded-xl bg-surface px-3 py-2 text-xs text-slate-500">평점 필터 · 데이터 준비 중</button>
          <button type="button" data-reset-filters onClick={() => updateFilters("", "")} className="ml-auto min-h-11 rounded-xl px-3 py-2 text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-4 hover:text-link-blue focus-visible:outline-2 focus-visible:outline-brand-blue">필터 초기화</button>
        </div>
      </div>
      <div className="mb-6 mt-10 flex flex-wrap items-center justify-between gap-3">
        <p role="status" aria-live="polite" className="text-lg font-semibold text-navy">식당 <span className="text-link-blue">{results.length}</span>곳 <span className="text-sm font-normal text-slate-500">/ 전체 {restaurants.length}곳</span></p>
        <p className="text-xs leading-6 text-slate-500">가격·영업 정보는 확인 후 순차 안내합니다</p>
      </div>
      {results.length ? (
        <div data-restaurant-grid className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map(restaurant => <RestaurantCard key={restaurant.id} restaurant={restaurant} loggedIn={loggedIn} favorite={favoritesUnavailable ? null : favoriteIds.includes(restaurant.id)} next={`/?${new URLSearchParams({ q: query, category })}`} />)}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-slate-300 bg-surface px-6 py-16 text-center">
          <h3 className="text-xl font-bold text-navy">검색 결과가 없어요</h3>
          <p className="mt-3 text-sm leading-7 text-slate-600">식당 이름이나 음식 종류를 바꿔 보세요.<br />필터 초기화로 전체 식당을 다시 볼 수 있어요.</p>
        </div>
      )}
    </section>
  );
}
