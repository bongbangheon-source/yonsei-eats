import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth-shell";
import { LogoutForm, ProfileForm } from "@/components/auth-forms";
import { getAuthContext } from "@/lib/auth/session";
import { readProfile } from "@/lib/auth/profile";
import { getMyFavorites, getReviewPage, reviewPageNumber } from "@/lib/community/queries";
import { ReviewSection } from "@/components/review-section";
import { FavoriteButton } from "@/components/community-forms";

export const metadata = { title: "마이페이지 | 연세잇츠" };
export default async function MyPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const { client, user, unavailable } = await getAuthContext();
  if (unavailable) return <AuthShell title="인증 상태 확인 중" description="현재 인증 서비스에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요."><Link href="/mypage" className="text-link-blue underline">다시 확인하기</Link></AuthShell>;
  if (!user || !client) redirect("/login?next=%2Fmypage");
  const result = await readProfile(client, user.id);
  const profile = result.ok ? result.profile : null;
  const [reviews, favorites] = await Promise.all([getReviewPage(client, { userId: user.id, page: reviewPageNumber((await searchParams).page) }), getMyFavorites(client, user.id)]);
  const created = new Date(user.created_at);
  const joined = Number.isNaN(created.getTime()) ? "정보 확인 중" : new Intl.DateTimeFormat("ko-KR", { dateStyle: "long", timeZone: "Asia/Seoul" }).format(created);
  return <AuthShell title="마이페이지" description="내 계정과 프로필을 관리하세요.">
    <dl className="mb-7 space-y-4 break-words text-sm"><div><dt className="text-slate-500">닉네임</dt><dd className="mt-1 font-semibold">{profile?.display_name || "닉네임 미설정"}</dd></div><div><dt className="text-slate-500">이메일</dt><dd className="mt-1">{user.email || "정보 확인 중"}</dd></div><div><dt className="text-slate-500">가입일</dt><dd className="mt-1">{joined}</dd></div><div><dt className="text-slate-500">이메일 인증</dt><dd className="mt-1">{user.email_confirmed_at ? "인증 완료" : "인증 대기"}</dd></div></dl>
    <ProfileForm nickname={profile?.display_name ?? null} missing={!profile} />
    <div className="mt-7 border-t border-slate-200 pt-6"><LogoutForm /></div>
    <ReviewSection data={reviews} userId={user.id} mypage />
    <section className="mt-9" aria-labelledby="my-favorites"><h2 id="my-favorites" className="mb-5 text-2xl font-bold">즐겨찾기한 식당</h2>{favorites.error ? <p role="alert" className="text-sm text-red-800">{favorites.error}</p> : !favorites.restaurants.length ? <p className="rounded-xl bg-surface p-5 text-sm text-slate-600">아직 즐겨찾기한 식당이 없습니다.</p> : <ul className="space-y-4">{favorites.restaurants.map(item => <li key={item.id} className="rounded-xl border border-slate-200 p-4"><Link href={`/restaurants/${item.id}`} className="block font-semibold text-link-blue underline">{item.name}</Link><p className="mb-3 mt-1 text-xs text-slate-500">{item.category}</p><FavoriteButton restaurantId={item.id} loggedIn favorite next="/mypage" /></li>)}</ul>}</section>
  </AuthShell>;
}
