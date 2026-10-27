# 연세잇츠 Phase 3 작업완료보고서

작성일: 2026-10-28 (Asia/Seoul)

**상태: 구현 및 가능한 자동 검사 완료, 실제 이메일 계정 통합 검증은 사용자 확인 대기.** 실제 정상 회원가입·이메일 수신·인증·로그인·로그아웃이 완료됐다고 주장하지 않는다.

## 구현 기능

- `/signup`: 이메일·비밀번호 최소8자·확인 일치·닉네임2~20자 검증. Supabase signUp 및 metadata.display_name. 세션 없는 응답은 인증 메일 안내만 표시. 중복 이메일 은닉 동작을 고려한 안전한 안내.
- `/login`: signInWithPassword, 실패 원문 비노출, 검증된 내부 next 경로 복귀. 현재 탐색 쿼리를 헤더 로그인 링크로 전달. 로그인 사용자는 로그인/가입 페이지에서 이동.
- `/auth/confirm`: Dashboard 메일 템플릿용 token_hash 확인 화면. GET에서 인증을 소비하지 않고 POST verifyOtp. 만료·재사용·잘못된 링크 안내. 개발 요청 로그에서 해당 URL 제외.
- 요청별 @supabase/ssr0.12.7 클라이언트, Next16 proxy 세션 갱신과 쿠키 전달. SameSite=Lax, HttpOnly, production Secure 및 private no-store.
- getUser로 검증한 사용자 ID만 사용. localStorage/임의 쿠키의 사용자 객체를 권한 근거로 사용하지 않음.
- 첫 검증 세션 이후 기존 profiles/RLS로 본인 프로필 생성·조회. 중복 무시 삽입으로 수정된 닉네임 보존. 누락·실패 시 마이페이지 복구 버튼.
- `/mypage`: 비로그인 제한, 닉네임·이메일·가입일·인증 상태, 닉네임 수정, 현재 브라우저 세션 로그아웃. 아바타/닉네임 null 허용.
- 헤더 로그인/마이페이지·로그아웃 상태. 기존 식당20곳 탐색·검색·필터·URL·상세 보존.

Google/NAVER OAuth는 취소했다. SQL·seed·식당 JSON 변경, 리뷰 작성·즐겨찾기·지도·배포는 수행하지 않았다.

## 생성·수정 파일

| 구분 | 파일 |
|---|---|
| 신규 인증 로직 | `src/lib/auth/validation.ts`, `operations.ts`, `profile.ts`, `session.ts` |
| 신규 SSR | `src/lib/supabase/auth-client.ts`, `auth-server.ts`, `src/proxy.ts` |
| 신규 액션/화면 | `src/app/auth/actions.ts`, `src/app/auth/confirm/page.tsx`, `src/app/login/page.tsx`, `src/app/signup/page.tsx`, `src/app/mypage/page.tsx` |
| 신규 UI | `src/components/auth-forms.tsx`, `auth-shell.tsx`, `login-link.tsx` |
| 기존 UI 수정 | `src/components/site-header.tsx` |
| 신규 테스트 | `tests/auth.test.mjs`, `tests/auth-http.mjs` |
| 기존 테스트 수정 | `tests/browser-smoke.mjs`(선택 AUTH_SMOKE) |
| 설정/의존성 | `package.json`, `package-lock.json`, `next.config.ts`, `.env.example` |
| 신규 문서 | `docs/phase3-plan.md`, `docs/auth-setup.md`, 본 보고서 |
| 기존 문서 갱신 | `README.md`, `docs/spec.md`, `docs/implementation-plan.md`, `docs/supabase-setup.md`, `docs/development-log.md` |

기존 미커밋 Phase 2 파일을 보존했다. `.env.local`과 원격 보안 설정은 수정하지 않았다. 설치된 JS2.118.0과 SSR0.12.7의 peer JS^2.114.0 호환을 npm metadata 및 실제 설치로 확인했다.

## 실제 실행한 검사

| 명령/검사 | 결과·범위 |
|---|---|
| `npm.cmd test` | 37/37 통과. 기존27 + 신규 인증10 |
| `npm.cmd run lint` | 종료코드0 |
| `npm.cmd run typecheck` | next typegen + tsc --noEmit 종료코드0 |
| `npm.cmd run build` | 종료코드0. 홈/상세/인증 화면 동적 서버 렌더링, Proxy 포함 |
| `npm.cmd run db` | db:check 별칭 추가 후 실제 Supabase catalog20곳 ID·이름·응답 형식 통과 |
| `test:http` | 3000번 홈/상세20곳 source=supabase 강제 확인, URL AND 필터, 없는ID404 통과 |
| `test:auth:http` | 로그인/가입 HTTP200, no-store, 비로그인 마이페이지307, 외부next대체, 잘못된인증링크, 실제Supabase의 위조세션거부 통과 |
| `AUTH_SMOKE=1 test:browser` | Edge: 기존 탐색·URL reload·상세-back·20상세·375/1280 레이아웃 통과. 가입 확인암호불일치의 서버검증, 외부Origin POST차단, next검증, 로그인/가입375/1280 가로넘침없음 통과 |
| 실제 공개 Auth settings GET | Email 활성화, 이메일 확인 요구, 가입 허용 확인. 비밀 값 출력 없음 |
| 독립 코드 리뷰 | Cavecrew reviewer 역할의 일반 Codex agent, 발견된 공백쿼리복귀 수정 확인 후 새 보안 문제 없음 |

SSR 테스트는 실제 SDK를 호출하되 fetch 응답을 fixture로 주입해 쿠키 재사용·새 클라이언트 getUser 요청·refresh·logout을 확인한다. 실제 원격 정상 계정 세션 검증이 아니다. 사용자 A/B profiles 격리 검사는 기존 PGlite PostgreSQL 역할 fixture로 수행한 것이며 원격 JWT/RLS 검사와 다르다.

스크린샷은 `.next/phase3-checks/login-375.png`, `login-1280.png`, `signup-375.png`, `signup-1280.png`에 생성했다(Git 제외 생성물). 모바일 가입 화면도 직접 열어 확인했다.

## 미검증 항목 및 사용자 설정

사용자는 실제 계정 검사를 직접 수행하기로 선택했다. 다음은 결과를 받기 전까지 미검증이다.

- 실제 신규 계정 생성·메일 수신/인증, 정상 로그인·로그아웃 및 새로고침/브라우저 재접속 세션 유지.
- 실제 사용자 프로필 생성·닉네임 변경·누락 복구, 다른 실제 JWT 계정의 프로필 접근 차단.
- 이미 로그인한 사용자의 로그인/가입 페이지 이동 및 로그인 전후 검색 URL 복귀의 실제 계정 통합.
- 실제 잘못된 암호·확인 대기 계정·중복 이메일·만료 링크·메일 rate limit UI의 원격 응답. 해당 분기는 자동 mock/입력 테스트로 확인한 범위와 구분한다.

Dashboard에서 Site URL·Redirect URLs·Confirm signup 메일 템플릿을 [auth-setup.md](./auth-setup.md)에 따라 확인한다. Email/Confirm email은 유지한다. 기본 발송기의 팀원 주소 제한·현재 시간당2통·동일 사용자 기본60초 제한을 고려한다. 일반 사용자 메일 발송은 사용자 SMTP 설정이 필요할 수 있으며 유료 설정은 자동 실행하지 않는다. 비밀번호/토큰을 채팅·Git에 공유하지 않는다.

## 오류 및 해결

1. TDD 초기에는 auth 모듈이 없어서 테스트가 실패했다. 입력·작업·프로필 구현 후 통과했다. SSR 공통 팩토리도 실패 테스트 후 구현했다.
2. safeNext가 인코딩된 검색어 공백까지 거부했다. 공백 포함 검색 URL 회귀 실패를 확인하고 경로/쿼리 검증을 나누어 정상 복귀와 우회 거부를 모두 통과시켰다.
3. 브라우저 CDP에서 DOM 객체 대기 결과를 직렬화하다 `Object reference chain is too long` 발생. 조건을 boolean으로 바꾸어 재실행 통과했다. 제품 인증 오류는 아니었다.
4. Node MODULE_TYPELESS_PACKAGE_JSON 경고와 npm 기존 unrs-resolver install-scripts 안내가 남았다. 설치·검사 종료는 성공했으며 무관한 전역 설정이나 스크립트 승인은 변경하지 않았다. 설치 시 audit는 취약점0건이었다.

## AI 도구 기록 및 종료 경계

- Superpowers writing-plans·TDD·systematic-debugging·verification-before-completion을 읽고 계획·실패/성공 테스트·원인별 수정·실제 검증을 적용했다.
- Context7 resolve: Supabase/Next.js. query: `/supabase/ssr` cookie API/refresh/getUser, `/supabase/supabase` 이메일 token_hash·verifyOtp/메일 템플릿, `/vercel/next.js` Server Actions/CSRF. 설치 SDK 타입과 Next16.4.3 로컬 문서 교차 확인. 공식 SMTP/rate-limit 웹 문서도 확인했다.
- Cavecrew는 네이티브 preset이 아닌 일반 서브에이전트에 investigator/reviewer 역할을 부여했다. investigator가 기존 프로필 SQL 권한·중복삽입 보존을 로컬 PGlite로 추가 확인했고 reviewer가 초기·수정 후 검토했다. 이 작업에서 builder preset은 사용하지 않았다.

실제 원격 계정 통합 완료로 표시하지 않는다. Git commit/push/Vercel 배포/Phase 4는 수행하지 않았으며 사용자 검토를 기다린다.
