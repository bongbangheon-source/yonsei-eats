# Yonsei Eats Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Code investigation and independent reviews use generic Codex agents with Cavecrew output contracts where useful; native presets are not available.

**Goal:** Phase 0에서는 실행 가능한 최소 Next.js 기반과 검토 가능한 문서를 준비한다. 이후 별도 승인된 단계에서 MVP를 구축한다.

**Architecture:** App Router 서버 컴포넌트를 기본으로 하고 상호작용·지도만 클라이언트 경계에 둔다. Supabase Auth 세션과 RLS를 권한의 근거로 사용한다. 검색 조건은 URL에 보존하고 평점 집계는 DB에서 수행한다.

**Tech Stack:** Next.js 16.4.3, TypeScript, React 19, Tailwind CSS 4, ESLint. 이후 Supabase PostgreSQL/Auth, NAVER Maps v3, Vercel, GitHub.

**Spec:** [spec.md](./spec.md). 사용자 최소 초기화 선택 및 Phase 0 설계 승인: 2026-10-27.

## 공통 제약

- Phase 0 이후 자동 진입 금지. 아래 Phase 1~7은 승인 전 실행하지 않는 로드맵이다.
- 초기 등록은 사용자 승인 v2 기반 `data/restaurants.json`의 20곳 전체이다. 정육면체 제외·오천집 신촌점 포함. 상세 검증은 개발 완료 후 진행하며 v3/v4의 검증/3곳 제한은 등록 조건에서 제외한다.
- 미확인 주소·좌표·메뉴·가격·영업시간·사진·현재 영업 상태는 null이다. 외부 평점·가상 상세값을 생성하지 않는다. 검증 상태로 기본 카드·상세 전체를 숨기지 않는다.
- 사용자별 최신 리뷰 한 건만 평균에 반영하며 리뷰 없음은 NULL이다.
- 일반 사용자는 식당 데이터를 수정할 수 없다. 모든 public 테이블에 RLS를 적용한다.
- 비밀 값은 환경 파일/서비스 설정에만 보관하고 공개 변수에 service role을 넣지 않는다.
- 일반적인 단계 내부 구현·테스트·오류 수정은 자율 수행한다. 중요한 설계·파괴적 DB 변경·실제 배포·유료 설정·중대한 인증 변경은 승인 후 진행한다.
- 각 단계 시작 시 관련 Superpowers 스킬을 읽고 외부 API는 Context7으로 재확인한다. 완료 전 verification-before-completion을 적용한다.
- 기능은 TDD RED/GREEN으로 검증하고 단계마다 명령·실패·해결·변경 파일을 development-log.md에 남긴다.

## Review Focus

1. 미확인 가격/좌표·자체 리뷰 없음: 가격 필터와 지도에서 가짜 값으로 처리하지 않는다(Phase 2~4).
2. 동일 사용자의 반복 리뷰·수정·삭제: 다른 사용자와 섞이지 않고 정해진 최신 집계 의미를 유지한다(Phase 2·6).
3. 익명·A·B 사용자 권한: UI 우회 요청도 다른 사용자 데이터에 쓰기/즐겨찾기 읽기를 허용하지 않는다(Phase 2·6).
4. OAuth 동의 거절·이메일 부재·callback 재사용·만료 세션: 가짜 성공이나 계정 자동 병합이 없다(Phase 5).
5. 모바일·지도 SDK 오류·목록 전환: 필터가 유지되고 목록 사용을 계속할 수 있다(Phase 3·4·7).

## Phase 0: 초기 기반 (이번 실행 범위)

**파일:** package.json, package-lock.json, next.config.ts(Tailwind Turbopack 로더 포함), tsconfig.json, eslint.config.mjs, next-env.d.ts, .gitignore, .env.example, .nvmrc, AGENTS.md, README.md, src/app/{layout.tsx,page.tsx,globals.css}, src/{components,lib,types}/.gitkeep, supabase/migrations/.gitkeep, docs/{spec,implementation-plan,development-log}.md. create-next-app 16.4.3의 실제 템플릿에 따라 PostCSS 파일 대신 공식 Turbopack 로더 구성을 사용한다.

**입출력:** 외부 API/환경 키 입력 없음. 기본 한국어 페이지와 lint/build 가능한 앱을 제공한다.

- [x] 폴더·Git·런타임·도구 가용성 조사, 공식 문서/패키지 메타데이터 확인.
- [x] 최소 초기화 접근 방식 선택 및 독립 설계 검토 후 사용자 설계 승인.
- [x] create-next-app 16.4.3으로 TypeScript/App Router/Tailwind/ESLint/src-dir/@/* 프로젝트 생성.
- [x] 기본 화면을 서비스 소개와 데이터 준비 안내로 교체하고 비밀 없는 .env.example·README·구조 구성.
- [x] Git 초기화, ignore 규칙과 문서·lockfile 확인. 자동 커밋보다 검토 가능한 커밋 제안을 우선한다.
- [x] npm.cmd run lint, npm.cmd run build, npm.cmd ls --depth=0, Git diff/ignore 검증.
- [x] 독립 변경 검토와 필요한 수정 후 결과 기록. Phase 0 보고 후 대기.

**테스트/완료:** 두 필수 명령 exit 0, 외부 키 없이 production build 성공, 실제 설치 버전 기록, 가상 식당 데이터 없음. 초기화·정적 소개에는 불필요한 단위 테스트 프레임워크를 추가하지 않는다. 비즈니스 동작은 이번에 구현하지 않는다.

**사용자 설정:** 지금은 없음. 권장 Node 24 LTS와 실제 Node 26 환경 차이를 보고하고 배포 전 Node 24 재검증.

## Phase 1: 기본 UI

2026-10-27 정책 변경: 이번 작업은 데이터·문서만 정리했다. 아래 UI 및 이후 단계 기능은 이번에 구현하지 않는다.

**파일:** src/components/{site-header,restaurant-card,filter-bar,view-switch}.tsx, src/app/{page,layout}.tsx, src/app/globals.css, tests/ui/restaurant-card.test.tsx, tests/e2e/home.spec.ts.

**입출력:** `data/restaurants.json`의 승인된 20곳을 UI 모델 RestaurantSummary(id,name,category,price:number|null,rating:number|null,reviewerCount:number)로 매핑할 준비가 되어 있다. JSON의 representativePrice를 UI price로 변환하고 자체 리뷰 전 rating=null을 사용한다. 실제 로더·화면 연결은 Phase 1/3에서 구현한다.

- [ ] pending 상태·주소/가격/좌표 null인 식당도 기본 카드에 표시되는 테스트와 '정보 확인 중'·'아직 리뷰 없음'·키보드 포커스 테스트부터 작성.
- [ ] 지정 색상과 반응형 grid, 검색·필터 입력·보기 전환 구성. 승인된 20곳을 사용하며 v3/v4 제한이나 verified-only 조건을 넣지 않음. 데이터 파일 자체가 비었을 때만 빈 상태 사용.
- [ ] 375px/1280px, 키보드 이동, 대비·라벨·overflow 검증 후 lint/build.

**완료:** 모바일 1열·PC 다열, 기능 상태가 명확하고 비활성 동작을 성공처럼 표시하지 않음. 검토 가능한 UI 제공.

**사용자 설정:** 상세 시각 디자인 검토. 시각 비교가 유용한 시점에 mockup 사용 여부 제안.

## Phase 2: Supabase 스키마·RLS·초기 데이터

**파일:** supabase/config.toml, supabase/migrations/<timestamp>_initial_schema.sql, supabase/seed.sql, supabase/tests/{rls,ratings}.sql, src/types/database.ts, docs/restaurant-data.md.

**입출력:** 활성 JSON의 20곳 모두를 restaurants 초기 데이터로 변환하고 확인된 메뉴가 있을 때만 menus에 저장한다. 주소·좌표·가격·영업시간 등은 nullable로 설계하며 가짜 필수값을 요구하지 않는다. RestaurantSummary 조회 인터페이스를 제공한다. reviews의 rating은 1~5 정수, 사용자·식당·작성 시각은 수정 불가.

- [ ] 최신 기준(created_at/id), 대표 메뉴 가격·필터 구간, 추천 태그·길이 제한을 사용자와 확정.
- [ ] 로컬 DB에서 7개 논리 테이블·FK·CHECK·인덱스·RLS 실패 테스트 작성.
- [ ] schema/RLS/최소 공개 조회와 최신 리뷰 집계 구현. review_tag_links 소유권도 부모 리뷰로 확인.
- [ ] 익명/A/B, 소유자 위조, 즐겨찾기 격리, 식당 쓰기 거부, 반복 리뷰·동률·수정·삭제 복귀·NULL 집계 테스트.
- [ ] `data/restaurants.json`의 ID/이름 20곳을 보존한 seed를 작성. 상세 검증 상태는 등록 차단 조건이 아니며 미확인 값·확인일은 null 유지. 식당별 검증 기록은 docs/restaurant-data.md에서 개발 완료 후 별도 갱신.

**완료:** 로컬 migration 재현, RLS/집계 테스트 통과, 승인 20곳 seed·null 보존 확인. 상세 검증 완료는 초기 등록의 선행 조건이 아니다. 실제 DB 적용은 변경 성격에 따라 승인.

**사용자 설정:** Supabase 프로젝트/개발 환경. 식당 20곳 이름 승인은 완료됐으며 주소·좌표·메뉴·가격·출처의 상세 검증은 개발 완료 후 후속 작업이다. 비밀 값은 채팅·Git에 공유하지 않음.

## Phase 3: 목록·검색·필터·상세

**파일:** src/lib/restaurants/{queries,filters}.ts, src/lib/supabase/{client,server}.ts, src/types/restaurant.ts, src/app/page.tsx, src/app/restaurants/[id]/page.tsx, tests/{filters,restaurant-queries}.test.ts, tests/e2e/search.spec.ts.

**입출력:** parseRestaurantFilters(URLSearchParams): RestaurantFilters; listRestaurants(filters): Promise<RestaurantSummary[]>; getRestaurant(id): Promise<RestaurantDetail|null>. 필드 타입은 Phase 2 generated DB 타입과 일치시킨다.

- [ ] 이름/메뉴 검색·AND 복합 필터·공백·한글·가격 경계·NULL·잘못된 query 테스트를 RED로 작성. 검증 상태가 pending이어도 기본 목록/상세는 제공하고 가격 조건이 없으면 null 가격도 유지. 메뉴 null이어도 이름 검색 가능.
- [ ] 서버 검증 query와 URL 상태 보존 구현. 필터 값은 allowlist/유효 범위 검사.
- [ ] 20곳 ID 모두 상세 조회, 잘못된 ID 404, 미확인 정보 안내/숨김, 미확인 영업 상태를 '영업 중'으로 표시하지 않는 테스트. 로딩·오류·빈 결과, 새로고침·뒤로가기·목록 복귀 E2E.

**완료:** 승인 데이터의 목록·검색·필터·상세가 일관되고 자체 평점이 없는 식당을 명확히 구분.

**사용자 설정:** Supabase URL/publishable key, 승인 가격·종류 기준.

## Phase 4: NAVER Maps

**파일:** src/components/maps/{restaurant-map,map-loader}.tsx, src/lib/maps/naver.ts, src/app/page.tsx, tests/maps.test.ts, tests/e2e/map.spec.ts.

**입출력:** RestaurantMap({restaurants: RestaurantSummaryWithCoordinates[], selectedId?: string}); 지도와 목록은 동일 URL 필터 결과 소비.

- [ ] SDK 로딩 오류·키 부재·좌표 부재·보기 전환 상태 보존·길찾기 URL 인코딩 테스트 RED. 유효한 좌표 쌍 없는 식당은 마커/좌표 기반 길찾기 생성 금지, 목록/상세는 유지하고 '위치 확인 중' 안내.
- [ ] 공식 v3 API를 client에서 로딩하고 마커 cleanup/중복 script 방지 구현.
- [ ] 도메인 제한된 개발 키로 실제 지도와 PC/모바일 외부 길찾기 확인.

**완료:** 필터된 목록/마커 일치, 지도 실패에도 목록 사용 가능, 키/도메인 오류 명확히 표시.

**사용자 설정:** NAVER Cloud Maps 신청과 브라우저 Key ID, localhost·확정 배포 도메인 등록. 유료 설정은 승인 후.

## Phase 5: Google·네이버 OAuth

**파일:** src/app/auth/{callback/route.ts,actions.ts}, src/app/login/page.tsx, src/proxy.ts, src/lib/supabase/{client,server,proxy}.ts, docs/oauth-setup.md, tests/e2e/auth.spec.ts.

**입출력:** Supabase의 검증된 auth.users UUID를 이후 reviews/favorites 소유자로 사용. 로그인 공급자 token을 DB 권한으로 직접 사용하지 않는다.

- [ ] Context7으로 Google·SSR·custom OAuth 기능 및 설치 SDK를 재확인.
- [ ] 동의 거절·잘못된 state·callback 재사용·외부 redirect·만료/변조 cookie·이메일 부재 테스트 RED.
- [ ] Google 공식 제공자와 cookie 기반 SSR/Proxy 구성.
- [ ] 네이버 generic custom OAuth2의 중첩 profile 매핑·PKCE·token 파라미터·동의 범위를 검증. callback/세션 발급을 실제로 확인하기 전 지원 완료로 표시하지 않음.
- [ ] 불가능하면 중개/커스텀 대안 설계와 중대한 인증 변경 승인을 요청. MVP에서 네이버를 말없이 제외하지 않음.
- [ ] 인증된 실제 계정으로 로그인/새로고침/로그아웃 및 공급자별 계정 연결 정책 검증.

**완료:** 두 공급자 실제 로그인과 RLS 사용자 식별 일치, open redirect·CSRF·계정 병합 위험 통제.

**사용자 설정:** Google OAuth web app, 네이버 로그인 앱/심사·테스트 계정·동의 항목, Supabase provider·허용 URL·Dashboard callback. Secret은 서비스 설정에만 보관.

## Phase 6: 리뷰·평점·즐겨찾기·마이페이지

**파일:** src/app/restaurants/[id]/actions.ts, src/components/reviews/{review-form,review-list}.tsx, src/app/mypage/page.tsx, src/lib/{reviews,favorites}/queries.ts, tests/{reviews,favorites}.test.ts, tests/e2e/member.spec.ts.

**입출력:** createReview({restaurantId,text,rating,tagIds}), updateReview({id,text,rating,tagIds}), deleteReview(id), toggleFavorite(restaurantId). userId는 입력값이 아닌 검증 세션에서 결정.

- [ ] 텍스트/별점/태그 검증·타인 수정 거부·동일 식당 반복 리뷰·최신 삭제 집계·즐겨찾기 중복/격리 테스트 RED.
- [ ] 리뷰+태그 원자 저장와 서버 검증·DB 권한을 연결. 변경 후 상세/목록/마이페이지 캐시 갱신.
- [ ] 총 리뷰 수/평점 기여 사용자 수 구분, 내 리뷰·내 즐겨찾기와 수정·삭제 흐름 E2E.

**완료:** UI 우회에도 타인 데이터 보호, 최신 평균 정확성, 로그인 만료·중복 제출 오류 복구.

**사용자 설정:** 추천 태그 목록·텍스트 제한 확정, 공급자별 테스트 계정.

## Phase 7: 테스트·배포·과제 보고서

**파일:** tests/e2e/*.spec.ts, .github/workflows/ci.yml, docs/{deployment,report,development-log}.md, README.md.

- [ ] Node 24에서 npm ci, lint, typecheck, 단위/SQL/E2E, production build 재현.
- [ ] 비밀 값·RLS·OAuth 허용 URL·지도 도메인·모바일·오류 상태 점검.
- [ ] 사용자의 사전 승인 후 GitHub remote/push 및 Vercel 배포. preview/production 설정 분리.
- [ ] 배포본 두 공급자 로그인·지도·리뷰/즐겨찾기 smoke test, 오류·롤백 방법 기록.
- [ ] 실제 AI 호출·오류 해결·테스트 근거·한계를 과제 보고서에 정리.

**완료:** CI와 배포 smoke test 통과, 승인한 배포 URL, 사용자 검토 및 과제 재현 설명 제공.

**사용자 설정:** GitHub 저장소, Vercel 계정/프로젝트·도메인·환경 변수, 배포 승인. 유료 플랜은 별도 승인.

## 커밋 제안

검증된 단계별로 `chore: initialize yonsei eats foundation`, `feat: add restaurant browsing`, `feat: add authenticated reviews` 등 작은 Conventional Commit을 제안한다. Phase 0는 사용자 검토 전 push·배포하지 않는다.
