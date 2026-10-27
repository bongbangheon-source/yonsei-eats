# 연세잇츠 · Yonsei Eats

연세대학교 신촌캠퍼스 주변 맛집을 찾는 웹앱입니다. 현재 **Phase 1: 식당 20곳 탐색 UI**를 제공합니다. 식당명 검색·음식 종류 필터·기본 상세 페이지를 사용할 수 있습니다. 지도·로그인·실제 리뷰·가격/평점 필터는 준비 중입니다. 승인된 목록 외 식당이나 미확인 가격·평점을 생성하지 않습니다.

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

Phase 1 로컬 데이터 탐색에는 환경 변수가 필요하지 않습니다. 이후 연동 단계에서 .env.example을 .env.local로 복사해 공개 값을 채웁니다. 실제 환경 파일은 커밋하지 않습니다. OAuth Client Secret과 Supabase service-role/secret key는 NEXT_PUBLIC_*에 넣지 마세요. 비밀 값은 채팅이나 Git에도 공유하지 마세요.

## 검증

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd start
```

Next.js 16의 build는 lint를 대신하지 않으므로 각각 실행합니다. Node 내장 테스트로 초기 데이터·검색·필터·null 가격·작은 글씨 색상 대비를 확인합니다. start는 build 후 production 서버를 실행합니다. DB·RLS·리뷰·OAuth는 아직 테스트 대상이 아닙니다.

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
  migrations/      # 이후 승인된 DB migration; 현재 SQL 없음
docs/
  spec.md
  implementation-plan.md
  development-log.md
  phase1-plan.md
data/              # 승인된 초기 식당 데이터 및 보존 원본
tests/             # Node 단위·HTTP·headless 브라우저 검사
```

Next.js·TypeScript·React·Tailwind CSS·ESLint를 사용합니다. 실제 버전은 package-lock.json으로 고정합니다. Supabase·NAVER Maps SDK는 현재 설치하지 않습니다. 템플릿 AGENTS.md는 설치된 Next.js 문서를 읽도록 안내하며, 사용자 Context7 지침과 함께 적용합니다.

## 문서와 다음 단계

- [프로젝트 명세](docs/spec.md): 요구사항·데이터 정책·인증 위험·공식 문서 근거
- [구현 계획](docs/implementation-plan.md): 단계별 파일·테스트·완료 기준·사용자 설정
- [AI 활용 및 개발 기록](docs/development-log.md): 실제 호출·실패·대응·검증 결과

식당 20곳의 초기 등록은 승인됐고 상세 검증은 개발 완료 후 별도 진행합니다. [식당 데이터 정책](docs/restaurant-data.md)에 따라 미확인 값을 null로 유지합니다. 이후 단계에는 Supabase 프로젝트, Google/NAVER OAuth 앱, NAVER Cloud Maps Key ID와 허용 도메인이 필요합니다. 배포 단계에는 GitHub 저장소·Vercel 프로젝트가 필요합니다. 네이버 로그인은 내장 제공자로 가정하지 않으며 custom OAuth2의 프로필 매핑·PKCE 호환성부터 검증합니다.

Phase 1 완료 후 Phase 2를 자동 실행하지 않습니다. Git commit·push·Vercel 배포도 자동 실행하지 않습니다. 실제 배포·파괴적 DB 변경·유료 설정·중대한 인증 변경은 사전 승인 후 수행합니다.
