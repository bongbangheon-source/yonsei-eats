import { randomUUID } from "node:crypto";
import Link from "next/link";
import type { ReviewPage } from "@/lib/community/queries";
import { PAGE_SIZE } from "@/lib/community/queries";
import { DeleteReviewForm, ReviewForm } from "./community-forms";

export function ReviewSection({ data, userId, restaurantId, mypage = false }: { data: ReviewPage; userId: string | null; restaurantId?: string; mypage?: boolean }) {
  const path = mypage ? "/mypage" : `/restaurants/${restaurantId}`;
  return <section aria-labelledby={mypage ? "my-reviews" : "restaurant-reviews"} className="mt-10 min-w-0">
    <h2 id={mypage ? "my-reviews" : "restaurant-reviews"} className="mb-5 text-2xl font-bold text-navy">{mypage ? "내가 작성한 리뷰" : "방문자 리뷰"}</h2>
    {data.notice && <p role="status" className="mb-5 rounded-xl bg-surface p-4 text-sm leading-7">{data.notice}</p>}
    {!mypage && (!userId ? <p className="mb-6 rounded-2xl bg-surface p-5 text-sm leading-7"><Link href={`/login?next=${encodeURIComponent(path)}`} className="font-semibold text-link-blue underline">로그인</Link> 후 리뷰를 작성할 수 있습니다.</p> : data.writeReady && restaurantId ? <div className="mb-8"><h3 className="mb-4 font-semibold">리뷰 작성</h3><ReviewForm key={restaurantId} restaurantId={restaurantId} tags={data.tags} requestId={randomUUID()} /></div> : <p className="mb-6 rounded-xl bg-surface p-4 text-sm leading-7">리뷰 작성에 필요한 DB 설정 또는 데이터를 확인 중입니다. 잠시 후 새로고침해 주세요.</p>)}
    {data.error ? <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">{data.error}</p> : <>
      <p className="mb-4 text-sm text-slate-500">총 리뷰 {data.total}개 · 최신 작성순</p>
      {!data.reviews.length && <p className="rounded-2xl bg-surface p-6 text-sm text-slate-600">{data.total ? "이 페이지에는 리뷰가 없습니다. 이전 페이지로 이동해 주세요." : mypage ? "아직 작성한 리뷰가 없습니다." : "아직 리뷰가 없습니다."}</p>}
      <div className="space-y-5">{data.reviews.map(review => <article key={review.id} data-review={review.id} className="min-w-0 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        {mypage && <Link href={`/restaurants/${review.restaurantId}`} className="mb-3 inline-block font-semibold text-link-blue underline underline-offset-4">{review.restaurantName}</Link>}
        <div className="flex flex-wrap items-center justify-between gap-3"><span className="break-words text-sm font-semibold">{review.author}{review.userId === userId && " · 내 리뷰"}</span><span aria-label={`별점 ${review.rating}점`} className="text-link-blue">{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span></div>
        <time dateTime={review.createdAt} className="mt-2 block text-xs text-slate-500">{new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeZone: "Asia/Seoul" }).format(new Date(review.createdAt))}</time>
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700 [overflow-wrap:anywhere]">{review.body}</p>
        {!!review.tags.length && <ul aria-label="리뷰 태그" className="mt-4 flex flex-wrap gap-2">{review.tags.map(tag => <li key={tag.id} className="rounded-full bg-surface px-3 py-1 text-xs text-slate-600">{tag.name}</li>)}</ul>}
        {review.userId === userId && <div className="mt-4 border-t border-slate-100 pt-3"><div className="flex flex-wrap items-start gap-3"><details className="min-w-0 flex-1"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-link-blue">리뷰 수정</summary>{data.writeReady ? <ReviewForm key={`${review.id}:${review.updatedAt}`} restaurantId={review.restaurantId} tags={data.tags} requestId={review.id} review={review} /> : <p className="py-3 text-sm text-slate-500">DB 설정 확인 후 수정할 수 있습니다.</p>}</details><DeleteReviewForm id={review.id} restaurantId={review.restaurantId} /></div></div>}
      </article>)}</div>
      <nav aria-label="리뷰 페이지" className="mt-6 flex flex-wrap justify-between gap-4 text-sm text-link-blue">{data.page > 1 && <Link href={`${path}?page=${data.page - 1}`} className="min-h-11 py-3 underline">← 이전 리뷰</Link>}{data.page * PAGE_SIZE < data.total && <Link href={`${path}?page=${data.page + 1}`} className="ml-auto min-h-11 py-3 underline">다음 리뷰 →</Link>}</nav>
    </>}
  </section>;
}
