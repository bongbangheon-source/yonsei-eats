import Link from "next/link";
import { formatPrice, type Restaurant } from "@/lib/restaurants";
import { FavoriteButton } from "./community-forms";

export function RestaurantPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 bg-surface text-slate-600 ${className}`}>
      <svg aria-hidden="true" width="54" height="54" viewBox="0 0 54 54" fill="none" className="text-slate-400">
        <path d="M12 27h30c-1 12-7 18-15 18S13 39 12 27Z" stroke="currentColor" strokeWidth="2" />
        <path d="M9 27h36M20 48h14M20 8v10m7-13v13m7-10v10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="text-xs tracking-wide">사진 준비 중</span>
    </div>
  );
}

export function RestaurantCard({ restaurant, loggedIn = false, favorite = false, next }: { restaurant: Restaurant; loggedIn?: boolean; favorite?: boolean | null; next?: string }) {
  return (
    <article className="flex h-full min-w-0 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:border-brand-blue/40 hover:shadow-lg"><Link href={`/restaurants/${restaurant.id}`} prefetch={false} data-restaurant-card={restaurant.id} className="group flex min-w-0 flex-1 flex-col focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-blue">
      <RestaurantPlaceholder className="h-44" />
      <div className="flex flex-1 flex-col p-6">
        <span className="mb-3 w-fit rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-semibold text-link-blue">{restaurant.category}</span>
        <h3 className="break-keep text-xl font-bold leading-8 text-navy group-hover:text-link-blue">{restaurant.name}</h3>
        {restaurant.representativeMenu && <p className="mt-3 text-sm text-slate-600">{restaurant.representativeMenu}</p>}
        <p className="mt-3 text-sm text-slate-600"><span className="text-slate-500">대표 가격</span> · {formatPrice(restaurant.representativePrice)}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">{restaurant.address ?? "주소 정보 확인 중"}</p>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 text-sm">
          <span className="text-slate-500">{restaurant.averageRating != null && (restaurant.reviewCount ?? 0) > 0 ? `${restaurant.averageRating.toFixed(1)}점 · 리뷰 ${restaurant.reviewCount}개 · 참여 ${restaurant.reviewerCount}명` : "아직 리뷰 없음"}</span>
          <span aria-hidden="true" className="font-medium text-link-blue">자세히 보기 ↗</span>
        </div>
      </div>
    </Link><div className="px-6 pb-6"><FavoriteButton restaurantId={restaurant.id} loggedIn={loggedIn} favorite={favorite} next={next ?? `/restaurants/${restaurant.id}`} /></div></article>
  );
}
