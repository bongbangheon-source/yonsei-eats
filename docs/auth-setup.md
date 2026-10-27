# Phase 3 Supabase 이메일 인증 설정 및 수동 검증

작성일: 2026-10-28. Google/NAVER OAuth는 사용자 지시로 취소했다. 이번 인증은 Supabase Auth 이메일·비밀번호와 공식 SSR SDK만 사용한다. SQL 변경이나 service_role은 필요 없다.

## 현재 읽기 전용 확인 결과

공개 `/auth/v1/settings` 조회에서 Email 제공자 활성화, 이메일 확인 요구, 회원가입 허용을 확인했다. Site URL·Redirect URLs·메일 템플릿·SMTP의 실제 Dashboard 값은 조회하거나 변경하지 않았으므로 아래 설정은 사용자가 확인해야 한다. `.env.local`은 Git 제외하며 값은 보고서·채팅에 공유하지 않는다.

## Dashboard 설정

1. **Authentication → Sign In / Providers → Email**(Dashboard 버전에 따라 Providers): Email 활성화, 신규 가입 허용, **Confirm email 활성화**. 운영에서도 유지한다. 최소 비밀번호 길이도 8 이상으로 설정한다. 앱은 자체적으로 가입 비밀번호8자·확인 일치·닉네임2~20자를 검사한다.
2. **Authentication → URL Configuration**: 현재 테스트의 Site URL은 `http://127.0.0.1:3000`. Redirect URLs에 `http://127.0.0.1:3000/auth/confirm` 등록. localhost도 사용한다면 `http://localhost:3000/auth/confirm`를 추가하되 테스트 시 한 호스트를 일관되게 사용한다(쿠키는 호스트별로 구분됨). 실제 운영 URL 확정 시 HTTPS 주소를 등록한다. 운영 wildcard는 최소화한다.
3. **Authentication → Email Templates → Confirm signup**: 아래 링크를 사용한다. 이 앱은 브라우저 hash 토큰 방식이 아닌 서버 `verifyOtp` 흐름을 사용하므로 기본 `ConfirmationURL` 링크를 그대로 두지 않는다.

```html
<h2>연세잇츠 이메일 인증</h2>
<p>아래 링크에서 이메일 인증을 완료해 주세요.</p>
<a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=email">이메일 인증</a>
```

GET 확인 페이지는 토큰을 소모하지 않는다. 사용자가 '이메일 인증 완료하기' 버튼을 누르면 same-origin POST에서 `verifyOtp({token_hash,type:'email'})`가 검증하고 SSR 세션 쿠키를 저장한다. 만료·재사용된 링크는 오류 안내한다. 토큰을 복사해 채팅·로그·보고서에 남기지 않는다.

4. **Authentication → Email / SMTP Settings, Rate Limits**: 공식 문서의 기본 발송기는 프로젝트 팀원으로 등록된 이메일 주소만 허용하며 현재 시간당2통 제한이다. 동일 사용자 확인 요청은 기본60초 간격이다. 제한은 바뀔 수 있으므로 Dashboard와 공식 문서를 다시 확인한다. 먼저 프로젝트 팀원 이메일로 테스트하고, 일반 사용자 발송은 사용자가 별도 SMTP를 구성한다. SMTP 비밀번호는 Supabase Dashboard에만 저장하며 유료 서비스 설정은 별도 승인한다. 인증 비활성화로 발송 제한을 우회하지 않는다.

앱은 기존 공개 환경 변수만 사용한다. `NEXT_PUBLIC_SITE_URL`을 실제 로컬 주소와 맞추는 것을 권장하지만 인증 메일의 링크 기준은 Dashboard의 Site URL이다. 앱 서버를 Codex에서 실행할 때는 **서버 프로세스 자체**에 외부 네트워크 접근이 허용되어야 한다. 독립 db:check 성공만으로 기존 서버의 권한을 확인한 것은 아니다.

## 인증과 프로필 생성 정책

- signUp에 `user_metadata.display_name`을 전달한다. 세션이 없으면 가입 접수·메일 확인 안내만 표시한다. Supabase가 중복 이메일을 은닉하는 경우 기존 계정 존재를 단정하지 않는다.
- 프로필은 첫 검증 세션 시점(로그인 또는 이메일 확인 성공, 이메일 확인을 요구하지 않는 설정에서는 가입 세션 성공)에 생성한다. 사용자 ID는 항상 `getUser()`에서 얻는다.
- 본인 권한/RLS로 `ON CONFLICT(id) DO NOTHING`에 해당하는 중복 무시 upsert 후 재조회한다. 기존 프로필·수정한 닉네임을 metadata로 덮어쓰지 않는다. 프로필이 없는 기존 사용자나 실패 상황은 마이페이지 '프로필 다시 만들기'로 복구한다.
- 닉네임 저장은 POST에서 getUser로 검증한 본인 ID만 사용한다. 로그아웃도 POST이며 현재 SSR 세션의 공식 signOut을 호출한다. 서버에서 권한 판단에 단순 cookie/localStorage의 사용자 객체나 getSession만 사용하지 않는다.
- 공식 SSR 쿠키는 HttpOnly·SameSite=Lax, production에서 Secure. 브라우저 SDK/localStorage 기반 인증을 추가하지 않았다. proxy가 갱신 쿠키를 요청/응답에 전달하며 인증 응답은 private no-store다. 로그아웃 범위는 현재 브라우저 세션(local)이다.

## 사용자가 직접 실행할 통합 체크리스트

사용자는 실제 계정 테스트를 직접 진행하기로 선택했다. 아래 항목은 아직 에이전트가 수행한 통합 검사로 기록하지 않는다. 테스트 후 결과만 공유하고 암호·토큰은 보내지 않는다.

- [ ] `/signup`: 수신 가능한 이메일, 8자 이상 암호/동일한 확인, 닉네임으로 가입. 가입 완료 안내가 나오더라도 인증 전 헤더가 로그인 상태가 아닌지 확인.
- [ ] 받은 메일 링크에서 확인 버튼 클릭 → `/mypage`. 올바른 이메일·닉네임·가입일·인증 완료 표시.
- [ ] `/login`, `/signup`을 다시 열면 마이페이지로 이동.
- [ ] 닉네임 변경 → 새로고침해도 변경값 유지. 로그아웃/로그인 후에도 metadata의 최초 이름으로 덮어쓰이지 않음.
- [ ] 다른 화면 이동·새로고침·브라우저 종료 후 재접속 시 유효한 세션 유지(시크릿 모드 종료/쿠키 삭제는 제외).
- [ ] 로그아웃 후 헤더 변경·마이페이지 로그인 안내. 잘못된 암호 입력 시 안전한 오류.
- [ ] 인증 메일 미확인 계정 로그인 시 확인 안내. 만료·이미 사용한 링크는 오류 처리.
- [ ] 검색·필터가 적용된 홈에서 헤더 로그인 → 로그인 후 안전한 원래 검색 URL로 복귀.
- [ ] 별도 계정 B로 profiles A 조회·수정 거부 확인. 앱 폼은 ID를 입력받지 않으며 RLS가 최종 제한한다. 이 항목은 현재 로컬 SQL A/B 역할 검사만 통과했고 **원격 JWT 검사는 미검증**이다.
- [ ] 기존 인증 사용자에 프로필이 없다면 로그인/마이페이지 재시도로 생성. 실패 시 안내와 재시도 제공.

## 자동 검사와 경계

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run db
$env:BASE_URL='http://127.0.0.1:3000'
$env:EXPECTED_DATA_SOURCE='supabase'
npm.cmd run test:http
npm.cmd run test:auth:http
$env:AUTH_SMOKE='1'
npm.cmd run test:browser
```

자동 검사는 입력·오류·redirect·프로필 소유자/복구, 실제 SSR SDK의 cookie/refresh/getUser/logout **mock transport**, 로컬 PostgreSQL RLS, 실제 공개 catalog, 비로그인 보호·위조 cookie 거부, 실제 브라우저 폼/CSRF/반응형을 포함한다. 실제 정상 회원가입·메일 수신·정상 로그인·프로필 변경·로그아웃 통합 검증을 대신하지 않는다.

## 공식 근거와 버전

- Context7 `/supabase/ssr`: createServerClient getAll/setAll, 쿠키 변경 시 응답 cache headers(0.10 이후 두 번째 인수), getUser 검증. 설치 SSR0.12.7·Supabase JS2.118.0의 실제 타입/API를 교차 확인했다.
- Context7 `/supabase/supabase`: [이메일 비밀번호 인증](https://supabase.com/docs/guides/auth/passwords), token_hash·verifyOtp·메일 템플릿.
- Context7 `/vercel/next.js`: Next16 proxy, async cookies, Server Actions Origin/Host CSRF 검사. 설치16.4.3의 proxy/cookies/server-actions/logging 문서도 확인했다. 기본 인덱스는 특정 패치 버전에 고정된 문서가 아니다.
- [SMTP 제한](https://supabase.com/docs/guides/auth/auth-smtp), [인증 요청 제한](https://supabase.com/docs/guides/auth/rate-limits): 2026-10-28 공식 웹 원문 확인. 프로젝트 설정은 별도로 확인한다.
