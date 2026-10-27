import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { RestaurantPlaceholder } from "@/components/restaurant-card";
import { formatPrice, getRestaurant, restaurants } from "@/lib/restaurants";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return restaurants.map(restaurant => ({ id: restaurant.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const restaurant = getRestaurant((await params).id);
  return { title: restaurant ? `${restaurant.name} | 연세잇츠` : "식당을 찾을 수 없어요 | 연세잇츠" };
}

export default async function RestaurantDetail({ params }: Props) {
  const restaurant = getRestaurant((await params).id);
  if (!restaurant) notFound();
  const information = [
    ["음식 종류", restaurant.category],
    ["대표 메뉴", restaurant.representativeMenu ?? "정보 확인 중"],
    ["대표 가격", formatPrice(restaurant.representativePrice)],
    ["주소", restaurant.address ?? "정보 확인 중"],
    ["영업시간", restaurant.openingHours ?? "정보 확인 중"],
    ["영업 상태", restaurant.operatingStatus ?? "영업 상태 확인 중"],
    ["위치", restaurant.latitude !== null && restaurant.longitude !== null ? "지도 보기 준비 중" : "위치 확인 중"],
  ];
  return (
    <main id="main-content" className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 sm:py-16">
      <Link href="/#restaurants" className="inline-flex min-h-11 items-center rounded-lg text-sm font-medium text-link-blue focus-visible:outline-2 focus-visible:outline-brand-blue">← 전체 식당 탐색</Link>
      <div className="mt-6 grid overflow-hidden rounded-3xl border border-slate-200 bg-white md:grid-cols-2">
        <RestaurantPlaceholder className="min-h-64 md:min-h-full" />
        <div className="p-6 sm:p-10">
          <span className="text-sm font-semibold text-link-blue">{restaurant.category}</span>
          <h1 className="mt-3 break-keep text-3xl font-bold leading-tight text-navy sm:text-4xl">{restaurant.name}</h1>
          <p className="mt-4 text-sm text-slate-500">아직 리뷰 없음</p>
          <dl className="mt-8 divide-y divide-slate-100">
            {information.map(([label, value]) => <div key={label} className="grid grid-cols-[5rem_1fr] gap-4 py-4 text-sm leading-6"><dt className="text-slate-500">{label}</dt><dd className="min-w-0 break-words text-navy">{value}</dd></div>)}
          </dl>
        </div>
      </div>
      <div className="mt-6 rounded-2xl bg-surface p-6 text-sm leading-7 text-slate-600">상세 정보는 확인 후 순차적으로 업데이트합니다. 지도와 로그인, 리뷰 작성 기능은 준비 중입니다.</div>
    </main>
  );
}
