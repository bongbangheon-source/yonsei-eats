# GitHub 업로드 승인 검토

대상: https://github.com/bongbangheon-source/yonsei-eats (public)

기존 main 커밋3개를 그대로 보존하며, 현재 미커밋 Phase2~5 구현 및 Phase6 배포 준비를 하나의 후속 커밋으로 묶는다. 원격은 마지막 읽기 검사에서 빈 저장소였다. push 직전에 다시 확인하고 예상치 않은 이력은 덮어쓰지 않는다.

제안 커밋 메시지:

```text
feat: complete Yonsei Eats MVP and deployment preparation
```

새 커밋은 GitHub 계정의 noreply 작성자 주소를 사용해 추가 개인 이메일 공개를 줄인다. 기존 작성자 메타데이터와 과거 PDF/ZIP 로컬경로는 사용자가 설명을 듣고 이력 보존/공개를 허용했다. 새 문서에는 실제 값이 없다.

검증: Node24.22.1에서 테스트69개/lint/typecheck/build/DB조회3회 성공. 실제 환경값·개인키·토큰 감사 결과는 release-audit.json을 참조한다. .env.local/.env/.vercel/node_modules/.next는 업로드 대상이 아니다.

**실제 commit·push 승인은 아직 대기 중이다.** 아래 목록은 승인 요청 전에 실제 stage 내용으로 채운다.

## 실제 stage 파일 목록

총 105개 파일. 실제 stage 바이트 감사 결과 노출 발견0건.

- `.env.example`
- `README.md`
- `data/restaurant-locations.json`
- `docs/auth-setup.md`
- `docs/deployment.md`
- `docs/development-log.md`
- `docs/implementation-plan.md`
- `docs/maps-setup.md`
- `docs/phase2-plan.md`
- `docs/phase2-sql-review.md`
- `docs/phase3-completion-report.md`
- `docs/phase3-plan.md`
- `docs/phase4-completion-report.md`
- `docs/phase4-db-review.md`
- `docs/phase4-plan.md`
- `docs/phase5-completion-report.md`
- `docs/phase5-db-review.md`
- `docs/phase5-location-audit.md`
- `docs/phase5-plan.md`
- `docs/phase6-plan.md`
- `docs/restaurant-data.md`
- `docs/spec.md`
- `docs/submission/final-report.md`
- `docs/submission/preflight-results.json`
- `docs/submission/production-tests.md`
- `docs/submission/release-audit.json`
- `docs/submission/screenshots/detail-mobile.png`
- `docs/submission/screenshots/home-desktop.png`
- `docs/submission/screenshots/home-mobile.png`
- `docs/submission/screenshots/login-mobile.png`
- `docs/submission/screenshots/manifest.json`
- `docs/submission/screenshots/map-desktop.png`
- `docs/submission/screenshots/map-mobile.png`
- `docs/submission/screenshots/signup-desktop.png`
- `docs/submission/upload-review.md`
- `docs/supabase-setup.md`
- `docs/supabase-web-debug.md`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `scripts/audit-release.mjs`
- `scripts/check-community.mjs`
- `scripts/check-locations.mjs`
- `scripts/check-supabase.mjs`
- `scripts/generate-seed.mjs`
- `scripts/preflight.mjs`
- `src/app/auth/actions.ts`
- `src/app/auth/confirm/page.tsx`
- `src/app/community/actions.ts`
- `src/app/login/page.tsx`
- `src/app/map/page.tsx`
- `src/app/mypage/page.tsx`
- `src/app/page.tsx`
- `src/app/restaurants/[id]/page.tsx`
- `src/app/signup/page.tsx`
- `src/components/auth-forms.tsx`
- `src/components/auth-shell.tsx`
- `src/components/community-forms.tsx`
- `src/components/data-source-notice.tsx`
- `src/components/login-link.tsx`
- `src/components/map-explorer.tsx`
- `src/components/naver-map.tsx`
- `src/components/restaurant-card.tsx`
- `src/components/restaurant-explorer.tsx`
- `src/components/review-section.tsx`
- `src/components/site-header.tsx`
- `src/components/view-link.tsx`
- `src/lib/auth/operations.ts`
- `src/lib/auth/profile.ts`
- `src/lib/auth/session.ts`
- `src/lib/auth/validation.ts`
- `src/lib/community/operations.ts`
- `src/lib/community/queries.ts`
- `src/lib/community/validation.ts`
- `src/lib/maps/controller.ts`
- `src/lib/maps/locations.ts`
- `src/lib/maps/naver-types.ts`
- `src/lib/maps/sdk.ts`
- `src/lib/maps/state.ts`
- `src/lib/restaurant-repository.ts`
- `src/lib/restaurants.ts`
- `src/lib/supabase/auth-client.ts`
- `src/lib/supabase/auth-server.ts`
- `src/lib/supabase/catalog.ts`
- `src/lib/supabase/config.ts`
- `src/lib/supabase/server.ts`
- `src/proxy.ts`
- `supabase/migrations/202610280001_initial_schema.sql`
- `supabase/migrations/202610280002_reviews_favorites.sql`
- `supabase/migrations/202610280003_verified_locations.sql`
- `supabase/seed.sql`
- `tests/auth-http.mjs`
- `tests/auth.test.mjs`
- `tests/browser-smoke.mjs`
- `tests/community-queries.test.mjs`
- `tests/community.test.mjs`
- `tests/database.test.mjs`
- `tests/helpers/database-audit.mjs`
- `tests/http-smoke.mjs`
- `tests/locations-database.test.mjs`
- `tests/maps-sdk.test.mjs`
- `tests/maps.test.mjs`
- `tests/phase4-database.test.mjs`
- `tests/repository.test.mjs`
- `tsconfig.json`
