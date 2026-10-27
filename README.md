# 연세잇츠 · Yonsei Eats

연세대학교 신촌캠퍼스 주변 맛집을 찾는 웹앱입니다. 식당 20곳 탐색·검색·종류 필터·상세, 이메일 인증·프로필·리뷰·즐겨찾기와 **Phase 5 NAVER 지도**를 제공합니다. [지도 설정](docs/maps-setup.md)과 [위치 검증 기록](docs/phase5-location-audit.md)을 확인하세요. 현재 공식 위치 2곳만 마커로 표시하고 나머지 18곳은 목록에서 위치 확인 중으로 안내합니다. 가격/평점 필터는 준비 중이며 가짜 리뷰·별점·위치는 만들지 않습니다.

**Phase 2 연결:** 사용자가 적용한 Supabase 스키마·20곳 seed의 `restaurant_catalog`를 서버에서 공개 키로 조회합니다. 연결 키가 없거나 DB 조회가 실패하면 원인과 로컬 복구 모드 안내를 표시하고 기존 식당 탐색은 유지합니다. 복구 데이터를 DB 조회 성공으로 표시하지 않습니다. [설정·적용 검토서](docs/supabase-setup.md)를 확인하세요.

Phase 6 배포·제출 준비는 [배포 절차](docs/deployment.md), [과제 제출 자료](docs/submission/final-report.md), [운영 검사 기록](docs/submission/production-tests.md)을 참조하세요. 실제 배포 URL이 확정되기 전에는 운영 검사를 완료로 표시하지 않습니다. 배포 런타임은 Node24.x로 고정했습니다.

## 시작하기

권장 런타임은 Node.js 24 LTS입니다(.nvmrc). 실제 개발 환경과 검증 결과는 [개발 기록](docs/development-log.md)을 확인하세요.

처음 내려받았거나 의존성을 다시 설치할 때만, 실행 중인 개발 서버를 `Ctrl+C`로 종료한 뒤 설치합니다.

```powershell
npm.cmd ci
```

설치가 성공한 것을 확인한 뒤 개발 서버를 실행합니다. 이미 설치되어 있으면 평소에는 아래 명령만 실행하면 됩니다.

```powershell
npm.cmd run dev
```

Windows에서 `EPERM unlink ...next-swc...node`가 발생하면 설치를 중단하고 파일을 사용하는 프로젝트의 Node/개발 서버가 종료되었는지 확인하세요. `npm ci`는 기존 node_modules를 먼저 제거하므로, 중간에 실패하면 `next` 명령도 없어질 수 있습니다. 잠금이 풀린 뒤 `npm.cmd ci`를 다시 완료하고 실행하세요. 설치 실패 상태에서 다음 명령을 계속 실행하거나 다른 프로젝트의 Node 프로세스를 일괄 종료하지 마세요. OneDrive·보안 프로그램에 의한 일시 접근 제한 여부는 반복 발생할 때 추가 확인합니다.

http://localhost:3000 에 접속합니다. PowerShell 실행 정책으로 npm.ps1이 차단되면 npm.cmd를 사용하세요. macOS/Linux에서는 npm으로 실행할 수 있습니다. 실행 정책을 바꿀 필요는 없습니다.

`.env.example`을 참고해 `.env.local`의 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 설정하고 서버를 재시작하세요. `RESTAURANT_DATA_SOURCE=supabase`가 기본값입니다. `npm.cmd run db:check`는 실제 DB를 읽어 승인된 20곳의 ID·이름과 응답 형식을 검사합니다(쓰기 없음). 의도적인 로컬 개발은 `RESTAURANT_DATA_SOURCE=local`로 선택합니다. 실제 환경 파일은 커밋하지 않습니다. OAuth Client Secret과 Supabase service-role/secret key는 NEXT_PUBLIC_*에 넣지 마세요. 비밀 값은 채팅이나 Git에도 공유하지 마세요.

## 검증

독립 DB 점검은 성공하는데 웹이 복구 모드라면 [웹 조회 오류 조사 및 해결](docs/supabase-web-debug.md)을 확인하세요. 점검 명령과 이미 실행 중인 개발 서버의 네트워크 접근 권한은 다를 수 있습니다. 서버 로그는 비밀 값 없이 오류명·원인 코드·경과 시간을 기록합니다.

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd start
```

Next.js 16의 build는 lint를 대신하지 않으므로 각각 실행합니다. Node 테스트는 초기 데이터·탐색·로컬 PostgreSQL RLS·인증 로직·SSR SDK cookie fixture를 포함합니다. 실제 회원가입·메일 수신·정상 로그인·로그아웃 통합 검증과는 구분합니다. `npm.cmd run db`는 실제 공개 catalog를 읽는 `db:check` 별칭입니다.

HTTP/브라우저 검사를 재현하려면 별도 터미널에서 `npm.cmd start -- --hostname 127.0.0.1 --port 3101`을 실행하고 `npm.cmd run test:http`, `npm.cmd run test:browser`를 실행합니다. 다른 포트는 BASE_URL로 지정합니다. 브라우저 검사는 설치된 Edge/Chrome의 격리된 임시 프로필을 사용하며, 자동 탐지가 안 되면 BROWSER_PATH로 실행 파일을 지정합니다. Windows 기준 검사이며 실행 환경에 따라 브라우저 프로세스 권한이 필요할 수 있습니다. 개인 로그인 프로필은 사용하지 않습니다.

## 구조

```text
src/
  app/             # 홈, /restaurants/[id], 404, 레이아웃
  components/      # 헤더, 검색·필터, 식당 카드
  lib/             # 로컬 식당 데이터 조회·필터
  types/           # 이후 공유 타입과 DB 생성 타입
public/            # 정적 자산
supabase/
  migrations/      # 검토할 Phase 2 SQL; 원격 적용은 승인 후
  seed.sql         # JSON 20곳, 재실행 시 기존 행 보존
docs/
  spec.md
  implementation-plan.md
  development-log.md
  phase1-plan.md
data/              # 승인된 초기 식당 데이터 및 보존 원본
tests/             # Node 단위·HTTP·headless 브라우저 검사
```

Next.js·TypeScript·React·Tailwind CSS·ESLint, Supabase JS 2.118.0 및 SSR 0.12.7을 사용합니다. SQL 검증은 개발 의존성 PGlite(PostgreSQL WASM)로 실행합니다. 실제 버전은 package-lock.json으로 고정합니다. 지도는 공식 NAVER Maps JavaScript API v3를 직접 사용합니다. 템플릿 AGENTS.md와 사용자 Context7 지침을 함께 적용합니다.

## Phase 2 데이터 연결

`.env.example`의 공개 Supabase URL·publishable key를 Git 제외 `.env.local`에 설정하고 서버를 재시작합니다. secret/service_role 키는 사용하지 않습니다. 기본 `RESTAURANT_DATA_SOURCE=supabase`, 의도적인 개발/복구는 `local`입니다. 미설정/오류일 때는 로컬 복구 안내가 나타나며, 정상 DB에 데이터가 없으면 seed 안내가 나타납니다. 연결 장애로 DB 전용 ID를 확인할 수 없을 때는 존재하지 않는 식당이라고 단정하지 않고 확인 불가 화면을 제공합니다. 정상 DB/명시적 local 모드에서 없는 ID는 404입니다.

`npm.cmd run seed:generate`는 SQL 파일 생성만 수행하며 원격 DB에 쓰지 않습니다. `npm.cmd run seed:check`로 JSON과 SQL의 일치를 확인합니다. `npm.cmd test`에는 격리된 PGlite SQL/RLS 검사가 포함되며 실제 Supabase Auth/JWT/PostgREST 검증을 대신하지 않습니다.

## 문서와 다음 단계

- [프로젝트 명세](docs/spec.md): 요구사항·데이터 정책·인증 위험·공식 문서 근거
- [구현 계획](docs/implementation-plan.md): 단계별 파일·테스트·완료 기준·사용자 설정
- [AI 활용 및 개발 기록](docs/development-log.md): 실제 호출·실패·대응·검증 결과

식당 20곳의 초기 등록은 승인됐고 상세 검증은 계속 진행합니다. [식당 데이터 정책](docs/restaurant-data.md)에 따라 미확인 값은 null로 유지하고 위치가 확인된 2곳만 반영했습니다. Google/NAVER OAuth 계획은 취소했으며 [이메일 인증 설정](docs/auth-setup.md)을 사용합니다. 지도에는 NAVER Cloud Maps 공개 Key ID와 허용 도메인, 추후 배포에는 GitHub·Vercel 설정이 필요합니다.

Phase 6의 Git commit·push·Vercel 배포·외부 운영 설정 변경은 사용자 승인 후 수행합니다. 기존 Supabase 테이블·데이터·RLS는 변경하지 않습니다.
