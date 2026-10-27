# GitHub·Vercel 운영 배포 절차

작성일: 2026-10-28. 대상 저장소는 https://github.com/bongbangheon-source/yonsei-eats 이다. 실제 배포 도메인은 생성 후 기록한다. Supabase 스키마·데이터·RLS는 이 단계에서 변경하지 않는다.

## 준비된 설정

| 항목 | 값 |
|---|---|
| Framework Preset | Next.js |
| Root Directory | 저장소 루트 |
| Production Branch | main |
| Node.js | 24.x (`.nvmrc`·package.json) |
| Install | npm ci(자동 감지 가능) |
| Build | npm run build |
| Output Directory | Next.js 기본값, 임의 public/out 지정 금지 |

Vercel 연결 및 GitHub import/실배포/운영 설정 변경은 사용자 승인 후 수행한다. 이미 연결된 GitHub 계정의 읽기 도구로 대상 저장소와 권한을 확인했지만, commit/push 승인을 대체하지 않는다. 외부유료설정·강제push·이력재작성은 수행하지 않는다.

## 환경 변수 — Dashboard에서 입력

| 이름 | 필수/용도 |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | 필수, 현재 Supabase 프로젝트 URL |
| NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY | 필수, publishable 또는 기존 anon 키 |
| NEXT_PUBLIC_NAVER_MAPS_KEY_ID | 필수, 현재 Maps 공개 Key ID |
| RESTAURANT_DATA_SOURCE | 선택. 생략 시 supabase, 명시한다면 supabase |

실제 값은 채팅·문서·Git에 적지 않고 Vercel Dashboard에서 입력한다. Production 대상으로 설정하고 Preview는 필요할 때 별도 결정한다. `NEXT_PUBLIC_SITE_URL`은 현재 실행 코드에서 사용하지 않아 필수 배포 변수가 아니다. 이메일 링크의 기준은 Supabase Dashboard Site URL이다.

service_role, sb_secret 계열, OAuth Client Secret, NAVER Client Secret은 이 앱의 공개 환경 변수에 넣지 않는다. NEXT_PUBLIC 값은 브라우저에 포함되므로 비밀 값을 암호화 저장했다고 안전한 공개변수가 되는 것은 아니다. 값 변경 후 새 빌드/재배포가 필요하다.

## Git 업로드

1. 현재 변경·이력·환경값 및 stage 검사 결과와 커밋 메시지를 사용자에게 제시한다.
2. 승인 후 기존 main의 후손 커밋을 만들고 origin을 대상 저장소로 연결한다.
3. 원격 refs를 다시 확인하고 예상치 않은 원격 커밋이 있으면 중단한다. 강제push하지 않는다.
4. 승인된 커밋을 push하고 GitHub 브랜치 SHA가 로컬과 일치하는지 확인한다.

기존 이력의 작성자 이메일·과거PDF 로컬경로에 대해 사용자가 이력보존/공개를 허용했다. 해당 원문 값을 새 문서에 복사하지 않는다. 새 제출자료의 메타데이터는 별도로 확인한다.

## Vercel import 및 운영 도메인

1. 승인된 계정에서 New Project → GitHub `bongbangheon-source/yonsei-eats`를 선택한다. 저장소 접근 권한을 사용자가 확인한다.
2. 위 Next.js·Node24·main·환경 변수 설정을 검토하고 실제 배포 승인 후 Deploy한다.
3. Ready 상태와 실제 Production domain을 확인한다. 후보 도메인을 최종 URL로 미리 기록하지 않는다. Preview 보호 페이지를 실제 서비스 성공으로 오인하지 않는다.
4. Supabase Authentication → URL Configuration에서 **Site URL을 확정 HTTPS 도메인**으로 변경하고 Redirect URLs에 `https://확정도메인/auth/confirm`을 허용한다. 기존 로컬 테스트 URL 유지 여부도 사용자 결정 사항이다. 변경 전 승인을 받는다.
5. Confirm signup 템플릿의 `{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=email`을 유지하고 Confirm email을 끄지 않는다. 실제 가입 메일이 배포 주소로 돌아오는지 사용자 계정으로 검사한다. SMTP 발송 제한을 인증 비활성화로 우회하지 않는다.
6. NAVER Cloud Maps Web 서비스 URL에 실제 Production 도메인을 추가하고 지도 인증·타일·2개 마커를 확인한다. 키나 Vercel 환경 변수가 바뀌면 재배포한다.

## 실제 운영 검증

`BASE_URL`에 실제 확정 URL을 지정해 test:http, test:auth:http, 브라우저 검사를 수행한다. 실제 환경이 설정되지 않았다면 local-recovery를 성공으로 인정하지 않는다.

```powershell
$env:BASE_URL='실제 HTTPS 운영 URL'
$env:EXPECTED_DATA_SOURCE='supabase'
npm.cmd run test:http
npm.cmd run test:auth:http
$env:AUTH_SMOKE='1'
$env:COMMUNITY_SMOKE='1'
$env:MAP_SMOKE='1'
$env:REQUIRE_REAL_MAP='1'
npm.cmd run test:browser
```

이 명령은 실제 정상 가입/메일 수신/로그인/리뷰·즐겨찾기 쓰기를 대신하지 않는다. 사용자 직접 검사와 에이전트 자동 검사를 `docs/submission/production-tests.md`에서 구분한다. 기존 실제 사용자 데이터를 지우는 테스트는 하지 않는다.

## 공식 근거

Context7 `/websites/vercel`: GitHub project import/환경 변수, [Node 버전 고정](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), [환경 변수](https://vercel.com/docs/environment-variables). `/supabase/supabase`: [인증 Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls)와 SiteURL/메일 템플릿. NAVER 운영 주소 조건은 [maps-setup.md](./maps-setup.md)를 따른다.
