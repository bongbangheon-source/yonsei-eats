# Phase 2 — Supabase 기반 설계 및 구현 계획

2026-10-28. 사용자 Phase 2 지시 범위만 실행한다. 원격 migration/seed는 **별도 승인 전 실행 금지**. 기존 UI·초기 JSON 보존, Auth/지도/리뷰 작성/즐겨찾기 UI 및 Phase 3 기능 미구현.

## 설계와 접근

기존 공개 목록만 서버에서 Supabase JS 공개 키로 읽는 방식을 선택한다. service role로 서버 조회하면 RLS를 우회하므로 사용하지 않는다. 아직 로그인 흐름이 없어 SSR Auth/cookie 패키지는 설치하지 않는다. 데이터 접근은 server-only 경계와 테스트 가능한 repository로 나누고, 실패 시 오류 원인 분류+로컬 복구 데이터 사용 안내를 함께 반환한다. 명시적 local 모드는 개발/복구에만 사용한다. 기본은 supabase이며 값 누락도 숨기지 않는다. DB 정상 응답이 빈 배열이면 seed 필요 안내를 표시하고 로컬 데이터로 조용히 바꾸지 않는다.

7개 테이블과 최소 권한/RLS를 생성한다. restaurants ID는 sinchon-01 등의 text PK다. profiles/reviews/favorites는 auth.users UUID 참조. reviews 동일 사용자·식당의 여러 행을 허용한다. 최신 기준은 서버 고정 created_at DESC, id DESC이고 수정으로 재정렬되지 않는다. 삭제 시 이전 리뷰가 복귀한다. 평균은 최신 행 집합에서 계산, 리뷰 없음은 NULL. review_count(전체 리뷰)와 reviewer_count(집계 참여자)를 구분한다. security_invoker view로 RLS를 보존한다.

프로필은 본인 조회·생성·수정·삭제. 식당/메뉴/태그는 공개 조회만, 일반 사용자 쓰기 금지. 리뷰 공개 조회·본인 쓰기. 태그 연결은 부모 리뷰 소유자만 쓰기. 즐겨찾기는 본인 조회·추가·삭제(복합 키 관계라 수정은 삭제/추가). DB 컬럼 권한과 trigger로 리뷰 ID/소유자/식당/작성일 변경을 금지한다. 본문 1~5000자, 표시명 1~80자(선택), 별점 1~5 정수로 제약한다. 미확인 상세값에는 가짜 기본값을 주지 않는다.

seed는 JSON에서 생성한 SQL, ON CONFLICT(id) DO NOTHING으로 재실행 시 중복과 기존 검증 정보 덮어쓰기를 막는다. 리뷰/메뉴/태그 가짜 seed는 없다. migration은 버전별 1회 적용이며 기존 이름 충돌 시 실패하여 임의 덮어쓰지 않는다.

## 실행 단계 및 파일

1. tests/database.test.mjs에 PostgreSQL SQL/RLS/20개 seed 재실행/사용자 A·B/최신 집계 회귀 테스트 RED 작성. 로컬 DB 도구가 없으면 PGlite를 개발 의존성으로 사용해 실제 PostgreSQL 엔진에서 auth.uid fixture와 anon/authenticated 역할을 재현한다. 실제 Supabase Auth/JWT/PostgREST 검증과는 구분한다.
2. Cavecrew builder 역할 일반 agent가 supabase/migrations/202610280001_initial_schema.sql 한 파일 작성. main은 scripts/generate-seed.mjs와 supabase/seed.sql 작성 및 테스트한다.
3. Supabase JS 및 server-only 설치. src/lib/supabase/server.ts, src/lib/restaurant-repository.ts와 tests/repository.test.mjs 작성. 키가 없을 때·에러 코드·네트워크 실패·빈 결과·정상 DB 매핑·단일 ID 조회 테스트 RED→GREEN.
4. 서버 홈/상세만 async DB loader로 교체, client 필터와 UI 유지. 연결 상태 안내 컴포넌트 추가. DB 조회를 build-time에 실행하지 않도록 상세는 요청 시 조회한다. 실제 평점 데이터가 있으면 수치/전체 리뷰 수/참여자 구분, 없으면 기존 리뷰 없음.
5. .env.example, README, spec/plan, docs/supabase-setup.md 및 development-log 갱신. DB 적용 SQL과 안전한 실행·검증 순서를 사용자 검토용으로 정리한다.
6. npm test/lint/typecheck/build 및 가능한 기존 HTTP·브라우저 회귀 검사. 독립 reviewer 검토. 원격 설정이 없으면 미검증을 명시하고 준비된 migration/seed 적용 승인과 URL/공개 키 설정을 요청한다.

## 검증 범위 및 승인 경계

PGlite는 모의 SQL 문자열 검사가 아니라 실제 PostgreSQL WASM 실행이나 호스팅 Supabase와 동일한 전체 환경은 아니다. Auth 사용자 생성·JWT·PostgREST·원격 RLS·프로젝트 schema 충돌은 원격 승인 후 재확인한다. 현재 실제 Supabase URL/공개 키가 없으므로 remote 적용이나 조회 성공을 주장하지 않는다. 비밀 키를 출력·클라이언트 전달하지 않는다. 파괴적 원격 변경, 유료 설정, commit/push/배포는 수행하지 않는다.

## 공식 문서 근거

Context7 resolve/query(2026-10-28): /supabase/supabase (publishable key/client), /websites/supabase (RLS auth.uid WITH CHECK·security_invoker views), /vercel/next.js (서버 데이터·no-store·notFound), /electric-sql/pglite (메모리 PostgreSQL exec/query). Next 설치 버전은 16.4.3이며 Context7의 기본 공식 repo 인덱스와 설치 문서를 교차 확인한다. SDK/테스트 엔진 실제 버전은 설치 후 lockfile/개발 기록으로 확정한다.

## 2026-10-28 연결 검증 보충

사용자 직접 migration/seed 적용 및 공개 환경 설정 후 이번 작업은 GET만 수행한다. 기존 서버 조회를 공유 catalog 함수로 묶고 SDK transport 회귀 테스트, db:check 및 데이터 출처를 강제하는 HTTP/브라우저 검증을 추가했다. 실제 승인된 20곳 공개 조회와 UI 회귀 검사를 통과했다. 초기 계획의 원격 미검증 기록은 당시 상황이며 현재는 공개 읽기 연결까지 검증되었다. Auth/JWT/원격 쓰기 정책 검증과 다음 Phase는 이번 범위에 포함하지 않는다.
