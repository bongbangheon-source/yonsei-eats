# 연세잇츠 · Yonsei Eats

연세대학교 신촌캠퍼스 주변 맛집을 찾는 웹앱입니다. 현재는 **Phase 0: 프로젝트 기반과 설계 문서**만 구성하며, 식당·지도·로그인 기능은 아직 제공하지 않습니다. 검토된 식당 자료 없이 임의의 목록이나 가격·평점을 생성하지 않습니다.

## 시작하기

권장 런타임은 Node.js 24 LTS입니다(.nvmrc). 실제 개발 환경과 검증 결과는 [개발 기록](docs/development-log.md)을 확인하세요.

```powershell
npm.cmd ci
npm.cmd run dev
```

http://localhost:3000 에 접속합니다. PowerShell 실행 정책으로 npm.ps1이 차단되면 npm.cmd를 사용하세요. macOS/Linux에서는 npm으로 실행할 수 있습니다. 실행 정책을 바꿀 필요는 없습니다.

Phase 0는 환경 변수를 요구하지 않습니다. 이후 연동 단계에서 .env.example을 .env.local로 복사해 공개 값을 채웁니다. 실제 환경 파일은 커밋하지 않습니다. OAuth Client Secret과 Supabase service-role/secret key는 NEXT_PUBLIC_*에 넣지 마세요. 비밀 값은 채팅이나 Git에도 공유하지 마세요.

## 검증

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd start
```

Next.js 16의 build는 lint를 대신하지 않으므로 각각 실행합니다. start는 build 후 production 서버를 실행합니다. 정적 초기화 검증에는 단위 테스트 프레임워크를 추가하지 않았습니다. 향후 검색·RLS·리뷰·OAuth는 별도 테스트가 필요합니다.

## 구조

```text
src/
  app/             # App Router 기본 화면, 레이아웃, 전역 스타일
  components/      # 이후 공통 UI
  lib/             # 이후 데이터·외부 서비스 코드
  types/           # 이후 공유 타입과 DB 생성 타입
public/            # 정적 자산
supabase/
  migrations/      # 이후 승인된 DB migration; 현재 SQL 없음
docs/
  spec.md
  implementation-plan.md
  development-log.md
```

Next.js·TypeScript·React·Tailwind CSS·ESLint를 사용합니다. 실제 버전은 package-lock.json으로 고정합니다. Supabase·NAVER Maps SDK는 현재 설치하지 않습니다. 템플릿 AGENTS.md는 설치된 Next.js 문서를 읽도록 안내하며, 사용자 Context7 지침과 함께 적용합니다.

## 문서와 다음 단계

- [프로젝트 명세](docs/spec.md): 요구사항·데이터 정책·인증 위험·공식 문서 근거
- [구현 계획](docs/implementation-plan.md): 단계별 파일·테스트·완료 기준·사용자 설정
- [AI 활용 및 개발 기록](docs/development-log.md): 실제 호출·실패·대응·검증 결과

다음 단계에는 사용자 검토 식당 20곳 자료, Supabase 프로젝트, Google/NAVER OAuth 앱, NAVER Cloud Maps Key ID와 허용 도메인이 필요합니다. 배포 단계에는 GitHub 저장소·Vercel 프로젝트가 필요합니다. 네이버 로그인은 내장 제공자로 가정하지 않으며 custom OAuth2의 프로필 매핑·PKCE 호환성부터 검증합니다.

Phase 0 완료 후 자동으로 다음 단계를 실행하지 않습니다. 실제 배포·파괴적 DB 변경·유료 설정·중대한 인증 변경은 사전 승인 후 수행합니다.
