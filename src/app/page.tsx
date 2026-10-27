import { RestaurantExplorer } from "@/components/restaurant-explorer";
import { getCategories } from "@/lib/restaurants";
import { getRestaurantData } from "@/lib/supabase/server";
import { DataSourceNotice } from "@/components/data-source-notice";
import { getAuthContext } from "@/lib/auth/session";
import { getMyFavorites } from "@/lib/community/queries";

type Props = { searchParams: Promise<{ q?: string | string[]; category?: string | string[] }> };

export default async function Home({ searchParams }: Props) {
  const params = await searchParams;
  const data = await getRestaurantData();
  const { client, user } = await getAuthContext();
  const favorites = await getMyFavorites(client, user?.id ?? null);
  const restaurants = data.restaurants;
  const query = typeof params.q === "string" ? params.q : "";
  const requestedCategory = typeof params.category === "string" ? params.category : "";
  const category = getCategories(restaurants).includes(requestedCategory) ? requestedCategory : "";
  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-5 sm:px-8">
      <section className="py-12 sm:py-20" aria-labelledby="intro-heading">
        <p className="mb-4 text-sm font-semibold tracking-wide text-link-blue">YONSEI EATS · 신촌의 한 끼</p>
        <h1 id="intro-heading" className="max-w-3xl break-keep text-4xl font-bold leading-tight tracking-tight text-navy sm:text-5xl">오늘 뭐 먹지?<br /><span className="text-brand-blue">연세잇츠</span>에서 찾아요.</h1>
        <p className="mt-6 max-w-xl break-keep text-base leading-8 text-slate-600">연세대학교 신촌캠퍼스 주변의 한 끼.<br className="hidden sm:block" /> 가고 싶은 식당을 검색하고, 끌리는 음식으로 골라 보세요.</p>
        <div className="mt-6 flex flex-wrap gap-2 text-xs text-slate-600"><span className="rounded-full bg-surface px-3 py-2">신촌캠퍼스 주변</span><span className="rounded-full bg-surface px-3 py-2">이름으로 빠르게 검색</span><span className="rounded-full bg-surface px-3 py-2">취향에 맞는 음식 종류</span></div>
      </section>
      <DataSourceNotice source={data.source} notice={data.notice} />
      {favorites.error && <p role="alert" className="mb-4 text-sm text-red-800">{favorites.error}</p>}
      <RestaurantExplorer key={JSON.stringify([query, category])} restaurants={restaurants} initialQuery={query} initialCategory={category} loggedIn={!!user} favoriteIds={favorites.restaurants.map(item => item.id)} favoritesUnavailable={!!favorites.error} />
    </main>
  );
}
