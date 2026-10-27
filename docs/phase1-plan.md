# Phase 1 — 식당 탐색 UI 설계 및 구현 계획

> For agentic workers: Superpowers writing-plans/TDD/verification-before-completion을 적용한다. 조사·작은 데이터 계층 구현·독립 검토는 일반 Codex 서브에이전트에 Cavecrew 역할을 부여한다. 사용자 지시서가 이번 단계의 범위이며 별도 커밋·push·배포는 하지 않는다.

## 설계

목표는 승인된 초기 데이터 20곳을 실제로 탐색하는 반응형 UI다. 기존 App Router·React·Tailwind만 사용한다. 데이터와 기존 설정을 보존하고 DB/Auth/지도 SDK는 연결하지 않는다.

접근 방식은 서버 JSON 조회 + 작은 클라이언트 검색 UI를 선택한다. 모두 client page로 옮기면 서버 상세 데이터 조회와 경계가 흐려지고, 별도 API를 만들면 20개 로컬 데이터에 불필요한 서버 계층이 추가된다. 기존 승인된 서버/클라이언트 분리 원칙에 따라 API 없이 구현한다.

- 홈은 서비스 소개·검색창·원본 7개 종류 필터·20개 카드·결과 개수·빈 상태를 제공한다. 상태는 URL의 q/category에 반영하여 새로고침·브라우저 뒤로가기 시 보존한다. '전체 식당 탐색' 링크는 라벨대로 전체 목록으로 이동한다.
- 음식 종류는 `한식·국밥`을 포함한 원본 정확한 분류 그대로다. '전체'가 기본이며 이름 검색은 공백 정리·대소문자 무시를 적용한다. 이름과 종류는 AND 조건이다.
- 카드 전체가 실제 상세 링크다. 사진은 외부 이미지를 만들어내지 않고 CSS 기반 '사진 준비 중' 플레이스홀더로 통일한다. 미확인 가격/주소/메뉴는 안내 또는 숨김, 자체 리뷰는 '아직 리뷰 없음'.
- /restaurants/[id]는 같은 초기 데이터를 이용하는 단순 서버 페이지다. 20개 ID를 정적 생성하고 잘못된 ID는 404를 제공한다. 미확인 영업 상태·좌표는 '영업 상태 확인 중'·'위치 확인 중'이다.
- 상단 지도·로그인 및 가격·평점 필터는 disabled와 준비 중 문구를 사용한다. 가짜 기능을 추가하지 않는다.
- 화이트/#142B50/#3276DC/#F1F5F9, 충분한 여백·둥근 카드, 모바일 1열/중간 2열/데스크톱 3열, 키보드 포커스·라벨·결과 live 안내를 적용한다.

## 파일과 순서

1. `tests/restaurants.test.mjs`에 20개/포함·제외/검색/종류/AND/빈 결과/공백/불변성/null 표시/ID 조회 테스트를 먼저 작성하고 RED를 확인한다.
2. `src/lib/restaurants.ts`: JSON 타입, restaurants/getRestaurant/getCategories/filterRestaurants/formatPrice. 조사 결과에 따라 Cavecrew builder 역할의 범용 agent가 이 한 파일만 구현하고 GREEN을 확인한다.
3. `src/components/{site-header,restaurant-card,restaurant-explorer}.tsx`, `src/app/page.tsx`, `src/app/restaurants/[id]/page.tsx`, `src/app/not-found.tsx`: 홈·클라이언트 상태·상세·404 구성. 데이터는 수정하지 않는다.
4. `tests/http-smoke.mjs`로 SSR 카드 20개·상세20·URL 필터·404를 확인한다. UI 작성 전 SSR 0개 실패를 확인하고 작성 후 동일 검사로 GREEN을 확인한다. `tests/browser-smoke.mjs`는 로컬 Edge/Chrome headless/CDP로 hydration 후 검색/AND/초기화/빈 결과·disabled·상세 이동·URL 복원·375px/1280px overflow/grid를 확인한다. Chrome의 DevTools 타임아웃으로 Edge를 사용한다. 외부 브라우저 패키지는 설치하지 않는다.
5. `package.json`: test/test:browser 명령만 추가. 스타일·레이아웃은 필요한 범위만 조정한다. `docs/development-log.md`에 실제 과정·근거·오류/대응·검증 결과 기록.
6. Node 테스트, lint/typecheck/build, production 브라우저 검사·독립 reviewer 검토 후 종료한다. Phase 2는 시작하지 않는다.

## 검증과 완료 기준

- Node 내장 테스트 RED→GREEN. 가격 null은 0원으로 바뀌지 않고 필터링이 원본을 수정하지 않는다.
- production 브라우저에서 20개 카드·두 필수 상호·정육면체 제외·복합 검색·초기화·빈 상태·상세/404 확인.
- 375px 1열과 1280px 3열 및 가로 overflow 없음. 실제 수행한 viewport만 보고한다.
- `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build` exit 0. 실패는 해결 과정과 함께 기록한다.
- 기존 data JSON·.env·의존성 버전·lockfile 보존. 실제 외부 키·로그인·지도·리뷰 기능은 미구현으로 명시한다.

## 문서 근거 (2026-10-27)

Context7 resolve/query 실제 호출: /vercel/next.js (App Router async params/generateStaticParams/notFound/native history), /reactjs/react.dev (controlled input/filter/list keys), /tailwindlabs/tailwindcss.com (responsive variants). Context7에 설치 버전 16.4.3과 정확히 일치하는 인덱스는 없어 기본 공식 repo 인덱스를 사용하고 설치된 Next 16.4.3 `dist/docs`의 dynamic-routes.md·server-and-client-components.md·not-found.md로 교차 확인했다. React 19.3.1/Tailwind 4.3.3에 고정된 문서 버전은 없으므로 범용 현재 공식 문서를 참조했다. Tailwind 검색에 섞인 v1/v2 설정 예제는 적용하지 않는다.
