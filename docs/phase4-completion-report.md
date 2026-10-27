# 연세잇츠 Phase 4 작업완료보고서

작성일: 2026-10-28 (Asia/Seoul)

**상태: 구현·자동검사 완료. 신규 SQL은 사용자 직접 적용 및 공개 준비 검사 통과. 실제 리뷰·즐겨찾기·마이페이지 정상 확인은 사용자 수행 결과이며, 에이전트 직접 인증계정 쓰기 검사가 아니다.**

## 구현 기능

- 식당 상세의 별 아이콘1~5점·본문1~5000자·실제 DB 태그최대10개 리뷰 작성. 익명은 로그인 안내. 태그0건이면 태그 없이 작성하며 임의 태그 생성 없음.
- 모든 리뷰를 최신순(created_at DESC,id DESC)으로20건씩 페이지 탐색. 실제 닉네임·점수·작성일·본문·태그, 닉네임 누락 시 익명 사용자. 조회 실패와 리뷰 없음 구별. React 텍스트 렌더로 HTML 주입하지 않음.
- 본인 수정·삭제만 노출, 서버의 검증된 사용자와 DB RLS로 제한. 삭제 확인, 성공·응답 실패 시 목록/평점 재조회. 익명/타인에 대한 가짜 성공 없음.
- 리뷰+태그 원자 RPC, 잘못된 태그/후반 실패 시 전체 rollback. 요청UUID를 재시도에 유지해 중복 제출 방지. '새 리뷰 작성'은 새UUID로 같은 사용자의 반복 리뷰 허용.
- 평균은 기존 restaurant_ratings/catalog의 사용자별 최신1건 집계. 전체 리뷰수/참여자수 구별. 최신 삭제 시 이전 리뷰 복귀. 프런트 별도 평균·가짜평점 없음.
- 카드·상세의 실제 favorites. 링크 안에 버튼/form 중첩하지 않음. 명시적 추가/해제, 복합PK·ignoreDuplicates, pending/ref 잠금. 오류 후 실제 상태 재조회·페이지 재검증. 상태 조회 실패 시 추가/해제인 것처럼 표시하지 않음.
- 마이페이지 본인 리뷰·즐겨찾기, 식당 이동·빈 상태·오류 처리. Phase3 인증/프로필과 Phase1/2 검색·필터·URL·상세 보존.

## DB 변경·실제 적용

`supabase/migrations/202610280002_reviews_favorites.sql`만 추가했다. 기존 migration/seed/식당 JSON은 변경하지 않았다.

- authenticated의 reviews INSERT(id) 열 권한: UUID 재시도 식별. 기존 소유권 RLS 및 immutable identity/timestamp trigger 유지.
- `save_review`: SECURITY INVOKER, empty search_path, authenticated만 EXECUTE. auth.uid 기반소유권, 태그실재·입력검사, 트랜잭션 저장.
- `review_author_names`: 공개 리뷰가 있는 작성자의 review_id/display_name 두 열만 의도적으로 owner 권한으로 공개. profiles의 본인 RLS는 그대로이며 이메일·아바타·전체프로필 노출 없음. 공개리뷰정책 변경 시 view 재검토 필요.

검토서 전달 후 사용자가 '검토 후 신규 SQL 적용 완료'라고 회신했다. 에이전트는 원격 SQL을 실행하지 않았고, 이후 공개뷰/테이블 읽기와 익명 RPC 거부를 확인했다. 기존 데이터 삭제·초기화 없음. 추가 필수 SQL 설정은 없으나 실제 태그 정의0건이므로 태그 선택의 원격 검사는 아직 불가능하다. 태그 추가는 임의 수행하지 않았다.

## 변경 파일

| 구분 | 파일 |
|---|---|
| 신규 DB | `supabase/migrations/202610280002_reviews_favorites.sql` |
| 신규 데이터/검증 | `src/lib/community/validation.ts`, `operations.ts`, `queries.ts` |
| 신규 서버 액션 | `src/app/community/actions.ts` |
| 신규 UI | `src/components/community-forms.tsx`, `review-section.tsx` |
| 기존 화면 연결 | `src/app/page.tsx`, `src/app/restaurants/[id]/page.tsx`, `src/app/mypage/page.tsx`, `src/components/restaurant-card.tsx`, `restaurant-explorer.tsx` |
| 신규 검사 | `tests/community.test.mjs`, `community-queries.test.mjs`, `phase4-database.test.mjs`, `scripts/check-community.mjs` |
| 기존 검사/명령 | `tests/browser-smoke.mjs`, `package.json` |
| 문서 | `README.md`, `docs/spec.md`, `implementation-plan.md`, `development-log.md`, `phase4-plan.md`, `phase4-db-review.md`, 본 보고서 |

기존 미커밋 작업을 보존했다. `.env.local`, 초기 SQL/seed/식당 데이터, 기존 Phase3 인증 구현을 덮어쓰지 않았다.

## 실제 검증 결과

| 검사 | 결과 |
|---|---|
| `npm.cmd test` | **57/57 통과**. 기존37+신규20(operations7/queries3/DB10) |
| `npm.cmd run lint` | 종료코드0 |
| `npm.cmd run typecheck` | next typegen + tsc --noEmit 종료코드0 |
| `npm.cmd run build` | 종료코드0. 홈/상세/인증/마이페이지 동적서버·proxy |
| `npm.cmd run db` | 실제 Supabase catalog20곳 ID·이름·NULL/평점 응답형식 통과 |
| `npm.cmd run db:community` | 실제 공개reviews/tags/links/catalog/author view 조회 및 익명 save_review EXECUTE 거부42501 통과. 존재하지 않는 새UUID에 creating=false를 사용하므로 리뷰 생성 없음 |
| Edge 브라우저 | 3000번 source=supabase 강제검사. 홈20카드·검색/카테고리/AND/초기화/빈결과/URL reload/상세-back/상세20곳·정상404 통과 |
| COMMUNITY_SMOKE=1 | 실제 익명리뷰영역·쓰기form 미노출·로그인안내·375/1280px 상세 가로넘침없음 통과. 홈도375px1열/1280px3열 |
| SQL 적용 후 화면 | 실제 Supabase 출처, 리뷰영역 및 실제0건 빈상태, migration 준비안내 해제 확인 |
| 사용자 수행 검사 | 사용자 회신: **리뷰·즐겨찾기·마이페이지 모두 정상**. 요청한 작성/수정/삭제·추가/해제·새로고침 유지·내목록 확인 범위. 에이전트 직접 실행으로 계산하지 않음 |

로컬 PostgreSQL(PGlite18.6)에서는 익명·A·B, 잘못된별점/공백/길이/실제태그FK, 타인리뷰/태그/즐겨찾기변경차단, 반복리뷰·최신평균·최신삭제복귀, 중복제출, 후반태그삽입실패전체rollback,즐겨찾기지속/중복/해제,공개닉네임2열과profiles비공개유지를 실행했다. 테스트용 리뷰·태그는 격리된 로컬 DB에서만 생성했다.

스크린샷: `.next/phase4-checks/detail-375.png`, `detail-1280.png`(Git제외 생성물). 모바일 스크린샷을 실제 열어 확인했다.

## 미검증 항목

- 에이전트가 실제 인증계정으로 직접 리뷰/즐겨찾기 CRUD한 검사는 미수행이다. 사용자의 직접 정상확인과 구분한다.
- 원격 사용자A/B 두 JWT로 타인 리뷰·태그·비공개 즐겨찾기 접근을 시도하는 부정검사는 미수행이다. 로컬 역할 검사만 통과했다.
- 실제 태그0건이므로 태그 선택·교체 원격통합은 미검증이다. 로컬 원자성/FK/태그권한 검사는 통과했다.
- 실제2명이 여러리뷰를 쓴 뒤 원격평점집계·동시탭 충돌·후반실패를 주입하는 검사는 미수행이다. 로컬SQL/단위검사 범위와 구분한다.
- 로그인 상태의 모바일 작성·편집·삭제는 사용자확인 범위에서 구체 기기별 증거를 받지 않았다. 에이전트 브라우저 반응형 검사는 익명 화면이다.

## 오류 및 해결

1. 신규 모듈/SQL 부재 실패 후 구현해 TDD 초기 통과. native Node가 확장자 없는 query→validation import를 못 찾은 오류는 `.ts` 명시로 수정했다.
2. 직접RPC에서 탭/개행만 있는 본문이 btrim을 통과했다. 독립리뷰가 로컬재현했고 POSIX비공백 검사와 회귀 RED→GREEN으로 해결했다.
3. 리뷰 저장/삭제가 DB에는 반영되고 응답만 실패할 때 목록이 낡을 수 있어, 유효한식당ID는 오류일 때도 재검증하도록 보완했다.
4. 식당별 새 작성폼과 수정폼에 명시적 key를 추가해 requestUUID/상태 경계를 명확히 했다. 현재Next라우터에서 재현 확정된 결함으로 주장하지 않는다.
5. 기존 browser 검사가 모든식당리뷰없음을 가정해 실제리뷰등록 후 실패할 수 있어, 실제평점/리뷰수 또는 리뷰없음 상태 모두 허용하도록 개선했다.
6. 기존 Node MODULE_TYPELESS_PACKAGE_JSON/Windows LF↔CRLF 안내는 남았으나 검사 실패는 없다. 무관한 전역설정 변경은 하지 않았다.

## AI 도구 실제 사용

- Superpowers TDD·systematic-debugging·verification-before-completion과 writing-plans를 읽고 계획/실패테스트/원인수정/실제완료검사를 적용했다.
- Context7 resolve Supabase/Next.js; query `/supabase/supabase` functions/invoker/definer/RLS 및 select/joins/upsert/pagination, `/vercel/next.js` Server Actions/pending/revalidate/인증 재확인. 설치Next16.4.3 로컬server-actions 문서 확인. SDK는기존JS2.118.0/SSR0.12.7 재사용.
- Cavecrew는 일반 Codex agent에 investigator·작은SQL builder·reviewer 역할 지침을 부여했다. 네이티브preset은 사용하지 않았다. SQL2파일 구현·테스트,독립 SQL/코드리뷰, 후속수정을 실제 수행했다. 에이전트별 PostgreSQL/Next Context7 조회도 수행했다.

Git commit/push/Vercel배포/Phase5는 수행하지 않았으며 사용자 검토를 기다린다.
