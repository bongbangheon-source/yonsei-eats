export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-6 py-6">
          <span className="text-2xl font-bold tracking-tight text-navy">연세잇츠</span>
          <span className="text-sm text-slate-500" lang="en">Yonsei Eats</span>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
        <p className="mb-4 text-sm font-semibold tracking-wide text-brand-blue">
          연세대학교 신촌캠퍼스 주변 맛집
        </p>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          오늘의 한 끼,
          <br />
          연세잇츠에서 찾아요.
        </h1>
        <p className="mt-6 max-w-xl text-base leading-8 text-slate-600 sm:text-lg">
          가격과 음식 종류, 직접 남긴 리뷰를 바탕으로
          나에게 맞는 식당을 찾을 수 있도록 준비하고 있어요.
        </p>
        <section aria-labelledby="preparation-heading" className="mt-12 rounded-3xl border border-slate-200 bg-surface p-6 sm:p-8">
          <h2 id="preparation-heading" className="text-xl font-semibold text-navy">
            식당 정보를 준비하고 있어요
          </h2>
          <p className="mt-3 max-w-2xl leading-7 text-slate-600">
            신촌의 식당을 꼼꼼히 확인하고 있습니다.
            검토를 마친 식당 정보가 준비되면 이곳에서 만나보세요.
          </p>
        </section>
      </main>
      <footer className="mx-auto max-w-6xl px-6 pb-8 text-sm text-slate-500">
        연세잇츠 · Yonsei Eats
      </footer>
    </div>
  );
}
