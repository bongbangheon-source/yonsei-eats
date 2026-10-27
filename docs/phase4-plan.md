# Phase 4 리뷰·즐겨찾기 구현 계획

사용자 Phase 4 지시 및 기존 spec을 기준으로 한다. OAuth·지도·배포·Phase 5는 구현하지 않는다. 실제 SQL 적용은 별도 승인 후 사용자 수행이며 코드/테스트/검토를 먼저 완료한다.

## 설계 및 파일

1. `supabase/migrations/202610280002_reviews_favorites.sql`: RLS 그대로 사용하는 SECURITY INVOKER save_review RPC로 리뷰+실제 태그를 원자 저장. 클라이언트 요청 UUID를 review.id로 사용해 같은 요청 재전송은 중복 생성하지 않는다. 같은 사용자도 새로운 UUID로 여러 리뷰 작성 가능. INSERT(id) 열 권한만 보완. 기존 identity/timestamp trigger와 최신 집계 view는 유지.
2. 같은 migration에 최소 공개 `review_author_names(review_id,display_name)` owner view. 공개 리뷰 작성자만 projection하며 profiles 본인 RLS는 유지한다. 닉네임 공개 범위와 권한 의도를 주석·보고서에 명시한다. 이메일·avatar·전체profile 접근은 열지 않는다.
3. `src/lib/community/{validation,operations,queries}.ts`, `src/app/community/actions.ts`: 실제 getUser ID만 사용. 입력·same-origin·소유권/RLS·실패 안전문구. favorite는 toggle가 아닌 명시적 desired on/off로 멱등 저장, 중복 PK/ignoreDuplicates. 실패 시 성공처럼 변경하지 않고 실제 상태를 다시 읽는다.
4. `src/components/community-forms.tsx`, `review-section.tsx`: 별 입력·태그·본인 편집/삭제확인·즐겨찾기. pending/동기 ref 잠금으로 빠른 중복 제출 방지. 별도 수정폼이며 XSS는 React 텍스트로만 표시. 리스트는 created_at/id 내림차순,20개 페이지 탐색으로 모든 리뷰에 접근. 리뷰없는 안내와 실패안내 구분.
5. 홈/탐색/카드/상세/마이페이지 연결. 카드 내 링크와 즐겨찾기 form은 중첩하지 않음. catalog/ratings의 DB집계만 표시. 본인리뷰/즐겨찾기페이지는 인증보호 및 본인필터/RLS. 키·비밀·가짜데이터 없음.
6. tests/community.test.mjs 및 phase4-database.test.mjs: 실패→구현→성공, 입력/권한/중복/원자성/집계/복원/태그/즐겨찾기/공개닉네임노출범위. 실제 Supabase 읽기와 쓰기/로그인 통합은 구분.
7. npm test/lint/typecheck/build/db, 실제 익명 UI/반응형/탐색 회귀, Cavecrew 조사·독립리뷰. docs/spec·implementation-plan·development-log·완료보고서 갱신. 실제 SQL 적용/계정 쓰기 검사는 승인 및 테스트 세션 확보 전 미검증.

## 현재 외부 상태

진행 후 갱신: 사용자가 신규 SQL 검토·직접 적용 완료, 실제 리뷰/즐겨찾기/마이페이지 정상 확인을 회신했다. 에이전트는 적용 후 실제 공개뷰/테이블·catalog20·익명RPC실행거부를 확인했다. 인증계정 CRUD는 사용자 수행으로 기록하며 에이전트가 직접 수행했다고 주장하지 않는다. 원격 두계정 RLS 부정검사·실제 태그선택은 미검증이다.

읽기 전용 HEAD(2026-10-28): reviews/review_tags/review_tag_links0건, catalog/ratings20건. anon profiles/favorites 접근401. 원격 내부 RLS 정의는 직접 SQL도구가 없어 저장소 migration과 실제 접근응답을 구분한다. 태그seed 생성하지 않는다. 신규 migration 전에는 리뷰 쓰기 준비 안내를 표시하며 가짜 성공/가짜리뷰로 대체하지 않는다.
