import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RestaurantPlaceholder } from "@/components/restaurant-card";
import { formatPrice } from "@/lib/restaurants";
import { getRestaurantData } from "@/lib/supabase/server";
import { DataSourceNotice } from "@/components/data-source-notice";
import { resolveRestaurantDetail } from "@/lib/restaurant-repository";
import { getAuthContext } from "@/lib/auth/session";
import { getReviewPage, getMyFavorites, reviewPageNumber } from "@/lib/community/queries";
import { FavoriteButton } from "@/components/community-forms";
import { ReviewSection } from "@/components/review-section";
import { isVerifiedLocation } from "@/lib/maps/locations";

type Props = { params: Promise<{ id: string }>; searchParams: Promise<{ page?: string }> };

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const id = (await params).id;
  const detail = resolveRestaurantDetail(await getRestaurantData(), id);
  return { title: detail.state === "found" ? `${detail.restaurant.name} | 연세잇츠` : detail.state === "unavailable" ? "식당 정보 확인 중 | 연세잇츠" : "식당을 찾을 수 없어요 | 연세잇츠" };
}

export default async function RestaurantDetail({ params, searchParams }: Props) {
  const id = (await params).id;
  const data = await getRestaurantData();
  const detail = resolveRestaurantDetail(data, id);
  if (detail.state === "missing") notFound();
  if (detail.state === "unavailable") return (
    <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-5 py-12">
      <h1 className="text-2xl font-bold text-navy">식당 정보를 확인할 수 없어요</h1>
      <DataSourceNotice source={data.source} notice={data.notice} />
      <p className="text-sm leading-7 text-slate-600">DB 연결을 확인할 수 없어 이 식당이 없는 것인지 판단할 수 없습니다. 연결 설정을 확인한 뒤 새로고침해 주세요.</p>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center rounded-lg text-link-blue">복구용 식당 목록 보기</Link>
    </main>
  );
  if (detail.state !== "found") notFound();
  const restaurant = detail.restaurant;
  const { client, user } = await getAuthContext();
  const [reviews, favorites] = await Promise.all([getReviewPage(client, { restaurantId: id, page: reviewPageNumber((await searchParams).page) }), getMyFavorites(client, user?.id ?? null)]);
  const information = [
    ["음식 종류", restaurant.category],
    ["대표 메뉴", restaurant.representativeMenu ?? "정보 확인 중"],
    ["대표 가격", formatPrice(restaurant.representativePrice)],
    ["주소", restaurant.address ?? "정보 확인 중"],
    ["영업시간", restaurant.openingHours ?? "정보 확인 중"],
    ["영업 상태", restaurant.operatingStatus ?? "영업 상태 확인 중"],
    ["위치", isVerifiedLocation(restaurant) ? "지도에서 위치 보기" : "위치 확인 중"],
  ];
  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-16">
      <Link href="/#restaurants" className="inline-flex min-h-11 items-center rounded-lg text-sm font-medium text-link-blue focus-visible:outline-2 focus-visible:outline-brand-blue">← 전체 식당 탐색</Link>
      <DataSourceNotice source={data.source} notice={data.notice} />
      <div className="mt-6 grid overflow-hidden rounded-3xl border border-slate-200 bg-white md:grid-cols-2">
        <RestaurantPlaceholder className="min-h-64 md:min-h-full" />
        <div className="p-6 sm:p-10">
          <span className="text-sm font-semibold text-link-blue">{restaurant.category}</span>
          <h1 className="mt-3 break-keep text-3xl font-bold leading-tight text-navy sm:text-4xl">{restaurant.name}</h1>
          <p className="mt-4 text-sm text-slate-500">{restaurant.averageRating != null && (restaurant.reviewCount ?? 0) > 0 ? `평점 ${restaurant.averageRating.toFixed(1)} · 리뷰 ${restaurant.reviewCount}개 · ${restaurant.reviewerCount}명 최신 리뷰 기준` : "아직 리뷰 없음"}</p>
          <div className="mt-5"><FavoriteButton restaurantId={id} loggedIn={!!user} favorite={favorites.error ? null : favorites.restaurants.some(item => item.id === id)} next={`/restaurants/${id}`} /></div>
          {favorites.error && <p role="alert" className="mt-3 text-sm text-red-800">{favorites.error}</p>}
          <dl className="mt-8 divide-y divide-slate-100">
            {information.map(([label, value]) => <div key={label} className="grid grid-cols-[5rem_1fr] gap-4 py-4 text-sm leading-6"><dt className="text-slate-500">{label}</dt><dd className="min-w-0 break-words text-navy">{label === "위치" && isVerifiedLocation(restaurant) ? <Link href={`/map?selected=${restaurant.id}`} data-detail-map-link className="text-link-blue underline underline-offset-4">{value}</Link> : value}</dd></div>)}
          </dl>
        </div>
      </div>
      <div className="mt-6 rounded-2xl bg-surface p-6 text-sm leading-7 text-slate-600">상세 정보는 확인 후 순차적으로 업데이트합니다. 확인된 위치는 지도에서 볼 수 있으며 현재 영업 여부를 의미하지 않습니다.</div>
      <ReviewSection data={reviews} userId={user?.id ?? null} restaurantId={id} />
    </main>
  );
}
