# Phase 3 이메일 인증 구현 계획

**Goal:** Supabase 이메일·비밀번호 인증, 공식 SSR 쿠키 세션, 본인 프로필·마이페이지를 구현하고 Phase 1·2 탐색을 유지한다.

**Architecture:** @supabase/ssr 요청별 서버 클라이언트와 Next.js 16 proxy에서 토큰 갱신. 권한 판단은 auth.getUser()의 검증된 사용자와 기존 profiles RLS. 폼 변경은 same-origin Server Actions. 공개 catalog 조회는 기존 무세션 경로를 유지한다.

**Spec:** 이번 Phase 3 사용자 지시 및 docs/spec.md. Google/NAVER OAuth 계획은 취소한다. SQL 변경·원격 설정 변경·서비스 역할 키·리뷰/즐겨찾기/지도·commit/push/배포는 범위 밖이다.

## 설계 결정

- /signup: 이메일, 최소8자 비밀번호/확인, 닉네임2~20자. signUp metadata.display_name 전달. 세션이 없으면 이메일 확인 안내만 표시하며 중복 가입의 Supabase 은닉 응답을 성공 로그인으로 오인하지 않는다.
- /login: signInWithPassword. /mypage 기본 복귀. 복귀 경로는 단일 슬래시 내부 경로만 허용하고 인증 경로 루프·백슬래시·제어문자·인코딩 우회 차단.
- 이메일 확인은 공식 token_hash verifyOtp 경로 /auth/confirm. 링크 미리보기로 토큰이 소모되지 않도록 GET에서는 확인 화면만, POST Server Action에서 검증한다. Dashboard 확인 메일 템플릿 설정을 문서화한다.
- 프로필 생성은 항상 첫 검증 세션 이후. 기존 사용자도 같은 흐름. 본인 id만 ignoreDuplicates upsert 후 select; 기존 닉네임 덮어쓰기 금지. 실패하면 세션은 유지하고 마이페이지 복구 안내·재시도 제공. DB trigger/SQL 변경 없음.
- /mypage는 getUser 검증 후만 조회·수정. 로그아웃 POST, 실패 시 성공 위장 금지. 인증 오류 원문/키/암호/토큰 로그 금지. auth 응답은 private no-store.

## 실행 단위

- [x] 테스트: tests/auth.test.mjs에 입력·redirect·safe error·signup no-session·profile failure/복구·로그인/로그아웃 mock 테스트 RED 작성. 기존 테스트와 함께 실행.
- [x] SSR: src/lib/supabase/auth-server.ts, src/lib/auth/session.ts, src/proxy.ts. @supabase/ssr 호환 버전 설치. 쿠키 setAll 및 응답 cache headers 전달.
- [x] 인증: src/lib/auth/validation.ts, operations.ts; src/app/auth/actions.ts, confirm/page.tsx, login/page.tsx, signup/page.tsx, 공통 폼.
- [x] 프로필: src/lib/auth/profile.ts; mypage/page.tsx, 프로필/로그아웃 액션; SiteHeader 인증 상태 반영.
- [x] 검증: npm test/lint/typecheck/build/db; 3000 실제 DB 탐색 HTTP/브라우저 회귀, 비로그인 보호/가짜 세션 거부/CSRF/폼·모바일 검사. 실제 사용자 통합 검사는 별도 구분.
- [x] docs/spec.md, implementation-plan.md, supabase-setup.md, development-log.md 및 완료보고서 갱신. Cavecrew 독립 검토 후 수정·재검증.

## 완료 기준과 검증 경계

이메일 인증 설정은 완화하지 않는다. 실제 계정 생성·메일 수신·로그인·로그아웃을 수행하지 못한 경우 해당 항목은 미검증이며 모의 테스트와 분리한다. 공개 DB 조회 성공만으로 Auth 통합 완료를 주장하지 않는다. 원격 SQL은 실행하지 않는다.
