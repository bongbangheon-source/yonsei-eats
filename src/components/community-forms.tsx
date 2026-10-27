"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, type FormEvent } from "react";
import { reviewAction, deleteReviewAction, favoriteAction } from "@/app/community/actions";
import type { CommunityState } from "@/lib/community/operations";
import type { Review, Tag } from "@/lib/community/queries";

const initial: CommunityState = { status: "idle", message: "" };
const button = "min-h-11 rounded-xl bg-navy px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue";

function Notice({ state }: { state: CommunityState }) {
  return state.message ? <p role={state.status === "error" ? "alert" : "status"} className={`mt-3 break-words text-sm leading-6 ${state.status === "error" ? "text-red-800" : "text-navy"}`}>{state.message}</p> : null;
}
function useSubmitGuard(pending: boolean, state: CommunityState) {
  const locked = useRef(false);
  useEffect(() => { if (!pending) locked.current = false; }, [pending, state]);
  return (event: FormEvent<HTMLFormElement>) => {
    if (locked.current) event.preventDefault();
    else locked.current = true;
  };
}

export function FavoriteButton({ restaurantId, loggedIn, favorite, next }: { restaurantId: string; loggedIn: boolean; favorite: boolean | null; next: string }) {
  const [state, action, pending] = useActionState(favoriteAction, initial);
  const guard = useSubmitGuard(pending, state);
  if (!loggedIn) return <Link href={`/login?next=${encodeURIComponent(next)}`} aria-label="로그인 후 즐겨찾기" className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-navy">♡ 즐겨찾기 · 로그인</Link>;
  return <form action={action} onSubmit={guard} data-favorite-form className="min-w-0">
    <input type="hidden" name="restaurantId" value={restaurantId} /><input type="hidden" name="desired" value={favorite ? "off" : "on"} />
    <button type="submit" className="min-h-11 rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-navy disabled:opacity-50" disabled={pending || favorite === null} aria-pressed={favorite ?? false}>{pending ? "저장 중…" : favorite === null ? "즐겨찾기 상태 확인 중" : favorite ? "♥ 즐겨찾기 해제" : "♡ 즐겨찾기 추가"}</button>
    <Notice state={state} />
    {favorite === null && <Link href={next} className="ml-2 text-xs text-link-blue underline">다시 확인</Link>}
  </form>;
}

export function ReviewForm({ restaurantId, tags, requestId, review }: { restaurantId: string; tags: Tag[]; requestId: string; review?: Review }) {
  const [id, setId] = useState(requestId);
  const [state, action, pending] = useActionState(reviewAction, initial);
  const guard = useSubmitGuard(pending, state);
  const [rating, setRating] = useState(review?.rating ?? 0);
  const completed = !review && state.status === "success" && state.savedId === id;
  if (completed) return <div className="rounded-2xl bg-surface p-5"><Notice state={state} /><button type="button" className={`${button} mt-4`} onClick={() => { setId(crypto.randomUUID()); setRating(0); }}>새 리뷰 작성</button></div>;
  return <form key={id} action={action} onSubmit={guard} data-review-form className="space-y-5 rounded-2xl border border-slate-200 p-5 sm:p-6">
    <input type="hidden" name="id" value={id} /><input type="hidden" name="restaurantId" value={restaurantId} /><input type="hidden" name="creating" value={String(!review)} />
    <fieldset disabled={pending}>
      <legend className="mb-2 text-sm font-semibold">별점 <span className="font-normal text-slate-500">{rating ? `${rating}점` : "1~5점 선택"}</span></legend>
      <div className="flex flex-wrap gap-1">{[1, 2, 3, 4, 5].map(value => <label key={value} className="relative flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg text-3xl focus-within:outline-2 focus-within:outline-brand-blue">
        <input type="radio" className="sr-only" name="rating" value={value} checked={rating === value} onChange={() => setRating(value)} required aria-label={`${value}점`} /><span aria-hidden="true" className={rating >= value ? "text-link-blue" : "text-slate-300"}>{rating >= value ? "★" : "☆"}</span>
      </label>)}</div>
    </fieldset>
    <label className="block text-sm font-semibold">리뷰 내용<textarea name="body" rows={4} required maxLength={5000} disabled={pending} defaultValue={review?.body ?? ""} placeholder="식사 경험을 들려주세요 (1~5000자)" className="mt-2 w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-base font-normal leading-7 focus-visible:outline-2 focus-visible:outline-brand-blue" /></label>
    <fieldset disabled={pending}><legend className="mb-3 text-sm font-semibold">추천 태그 <span className="font-normal text-slate-500">선택 · 최대 10개</span></legend>{tags.length ? <div className="flex flex-wrap gap-3">{tags.map(tag => <label key={tag.id} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-surface px-3 text-sm"><input type="checkbox" name="tagIds" value={tag.id} defaultChecked={review?.tags.some(selected => selected.id === tag.id)} />{tag.name}</label>)}</div> : <p className="text-sm text-slate-500">등록된 태그가 없습니다. 태그 없이 리뷰를 작성할 수 있습니다.</p>}</fieldset>
    {(state.savedId === id || state.status === "error") && <Notice state={state} />}
    <button type="submit" disabled={pending} className={button}>{pending ? "저장 중…" : review ? "리뷰 수정 저장" : "리뷰 등록"}</button>
  </form>;
}

export function DeleteReviewForm({ id, restaurantId }: { id: string; restaurantId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [state, action, pending] = useActionState(deleteReviewAction, initial);
  const guard = useSubmitGuard(pending, state);
  return <div>{!confirming ? <button type="button" onClick={() => setConfirming(true)} className="min-h-11 px-3 text-sm text-red-800 underline">삭제</button> : <form action={action} onSubmit={guard} className="rounded-xl bg-red-50 p-4">
    <input type="hidden" name="id" value={id} /><input type="hidden" name="restaurantId" value={restaurantId} /><input type="hidden" name="confirmed" value="yes" />
    <p className="mb-3 text-sm leading-6 text-red-900">이 리뷰를 삭제할까요? 삭제 후 복구할 수 없습니다.</p>
    <div className="flex flex-wrap gap-3"><button type="submit" disabled={pending} className="min-h-11 rounded-xl bg-red-800 px-4 text-sm text-white disabled:opacity-50">{pending ? "삭제 중…" : "삭제 확인"}</button><button type="button" disabled={pending} onClick={() => setConfirming(false)} className="min-h-11 px-3 text-sm">취소</button></div><Notice state={state} />
  </form>}</div>;
}
