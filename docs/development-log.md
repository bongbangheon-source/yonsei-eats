# 개발 및 AI 활용 기록

## 2026-10-27 — Phase 0 조사·설계

### 범위와 현재 상태

사용자의 Phase 0 지시서를 기준으로 조사했다. 사용자는 최소 초기화를 선택했고 독립 builder check 후 docs/spec.md의 Phase 0 설계를 승인했다. 승인 이후 프로젝트 생성·설치·기본 화면·문서 구성을 수행했다. lint와 production build는 exit 0을 확인했다. 추가 typecheck·HTTP smoke test와 최종 검토는 아래 결과를 기록한다. 외부 서비스 설정과 배포는 하지 않았다.

### 실제 도구·스킬 사용

| 실제 호출·읽기 | 목적 | 결과 |
|---|---|---|
| functions.exec → exec_command | Get-Location, Get-ChildItem -Force, git status --short --branch, node --version, npm --version | 빈 폴더; Git 저장소 아님; Node 26.7.0; npm.ps1 실행 정책 오류 |
| exec_command → npm.cmd --version | PowerShell 실행 정책을 바꾸지 않는 대안 | npm 11.19.0 정상 |
| Superpowers brainstorming SKILL.md 읽기 | 명세 검토·접근 방식 비교·설계 승인 경계 | 최소 초기화 선택; 설계 문서 작성 후 승인 요청 |
| Superpowers writing-plans SKILL.md 읽기 | 계획 형식 사전 확인 | 읽기 완료; 설계 승인 전 실행 계획 작성 단계는 시작하지 않음 |
| Superpowers test-driven-development SKILL.md 읽기 | 테스트 적용 범위 확인 | 향후 동작 구현은 RED/GREEN; 현재 초기화 검증은 lint/build 중심 |
| Superpowers using-git-worktrees SKILL.md 읽기 | 기존 저장소·격리 여부 판단 | 초기 저장소가 없어 기존 브랜치/작업 충돌 없음; worktree 생성 안 함 |
| Superpowers verification-before-completion SKILL.md 읽기 | 실제 증거로만 완료 판단 | 검증 실행 전 성공 주장 금지 적용 |
| Caveman cavecrew 및 lean-build SKILL.md 읽기 | 조사·독립 검토와 최소 범위 적용 | 네이티브 presets 대신 범용 Codex agent 사용을 명시 |
| Context7 context7-mcp SKILL.md 읽기 | 문서 검색 규칙 확인 | library resolve 후 query 사용 |
| ALL_TOOLS 메타데이터 조회 | 실제 MCP 도구 확인 | mcp__context7 및 mcp__codex_apps__context7 경로 노출 확인 |
| mcp__context7__resolve_library_id | Next.js, Supabase, Tailwind 식별 | 3회 성공 |
| mcp__context7__query_docs | Next 설치·Node·ESLint, Supabase custom OAuth, Tailwind v4 PostCSS | 3회 성공; 각 library ID·근거는 spec.md 기록 |
| mcp__codex_apps__context7_resolve_library_id | NAVER Login, NAVER Maps, Vercel 식별 | 3회 성공; Login 검색은 SDK 결과와 공통 Open API 중 웹 API 문서를 선택 |
| mcp__codex_apps__context7_query_docs | NAVER OAuth/profile, Maps v3 로딩, Vercel Node 버전 | 3회 성공 |
| web__run open | Supabase custom OAuth와 Google 공식 원문·NAVER API 교차 확인 | 공식 문서 읽기 성공; Google 문서는 social-sign-in 경로로 redirect |
| web__run open | 사용자 제공 https://naver.me/GctrAcmo 확인 | 접근 실패; 식당 주소·가격 등을 추측하지 않음 |
| exec_command → npm.cmd view (네트워크 승인 실행) | latest stable 버전·engines·peerDependencies | next/CNA 16.4.3, react 19.3.1, tailwind 4.3.3, supabase-js 2.118.0, ssr 0.12.7 |
| collaboration.spawn_agent phase0_investigator | 읽기 전용 폴더·Git·스킬 조사 | Superpowers 15, Caveman plugin 20, 로컬 skills 23 확인. 네이티브 Cavecrew agents 정의 없음 |
| collaboration.spawn_agent phase0_design_check | Superpowers builder-check-prompt 기반 독립 설계 검토 | Phase 0 중요 미결 사항 없음. 파일 변경 없음 |
| apply_patch | docs/spec.md 및 이 기록 작성 | 제품 코드·실제 식당 데이터 없음 |
| request_user_input_async | 접근 방식 선택 및 설계 승인 | 최소 초기화 선택 후 별도 설계 승인 완료 |

모든 서브에이전트는 실제 Codex 범용 agent이다. Cavecrew investigator/reviewer 출력 계약을 적용했지만 네이티브 cavecrew-investigator/builder/reviewer preset을 호출했다고 주장하지 않는다. 이번 범위는 1~2파일 제품 수정이 아니므로 builder preset을 사용하지 않았다. Caveman Cloud·비용 분석·외부 모델 압축도 실행하지 않았다.

### 오류·대응·남은 위험

1. Git status 실패: 저장소가 없기 때문. 승인 후 git init으로 초기 저장소를 구성할 예정이며 기존 기록은 없다.
2. npm.ps1 PSSecurityException: npm.cmd로 우회했다. ExecutionPolicy를 변경하지 않았다.
3. 로컬 Node 26과 Vercel 기본 Node 24 차이: 배포 전 Node 24 재검증 필요. OS 런타임을 임의로 설치/변경하지 않는다.
4. 네이버 custom OAuth: response.id 중첩 profile, state/token 처리, PKCE 호환성, 이메일 미제공·계정 연결은 실제 검증 전이다. 네이버가 Supabase 내장 provider라고 가정하지 않는다.
5. 초기 식당 전체 목록 부재와 단축 링크 접근 실패: 20곳 seed를 만들지 않는다. 사용자 검토 자료 필요.
6. Context7은 웹/canary 인덱스이므로 stable 버전 판정은 npm metadata로 보강했다. 조회일은 한국 기준 2026-10-27이며 미설치 SDK를 설치/검증 완료로 표시하지 않는다.

### 초기 조사 시점에 실행 전이었던 검증 (최종 결과는 아래)

- npm.cmd run lint
- npm.cmd run build
- 실제 브라우저 반응형·지도·OAuth 테스트
- DB migration/RLS 및 최신 리뷰 집계 테스트
- Vercel 배포 및 Node 24 환경 검증

실행 결과는 해당 명령이 실제 완료된 뒤 기록한다.

## 2026-10-27 — 승인 후 초기화·검증

### 실행 및 변경

- Superpowers writing-plans를 다시 읽고 적용하여 docs/implementation-plan.md를 작성했다. 이후 단계는 실행 승인이 필요한 로드맵이다. Phase 0만 실행한다.
- Superpowers executing-plans를 읽고 단일 Phase 0 작업을 직접 수행했다. 기존 커밋이 없어 commit SHA 기반 실행 스크립트/worktree 대신 현재 폴더·본 기록·명시 검증 명령을 사용했다. OS 전역 설정·실제 배포는 변경하지 않았다.
- `npx.cmd --yes create-next-app@16.4.3 yonsei-eats --typescript --tailwind --eslint --app --src-dir --import-alias '@/*' --use-npm --skip-install --disable-git --no-react-compiler --yes` exit 0.
- 하위 생성 경로가 workspace 안인지 확인하고, 각 대상 파일 충돌 여부를 모두 검사한 뒤 파일을 루트로 이동했다. 기존 docs는 보존했다.
- `npm.cmd install --no-fund --no-audit` exit 0, 357 packages 설치. Supabase·지도 SDK는 설치하지 않았다.
- 템플릿의 React 19.3.0 대신 레지스트리 latest 19.3.1을 명시했다. 설치 결과: Next 16.4.3, React/React DOM 19.3.1, Tailwind/@tailwindcss/turbopack 4.3.3, TypeScript 5.9.3, eslint-config-next 16.4.3, ESLint 9.39.5. package-lock.json 기록.
- AGENTS.md의 Next 가이드를 읽고 설치된 `node_modules/next/dist/docs/01-app/01-getting-started/01-installation.md`, `03-layouts-and-pages.md`, `03-api-reference/05-config/01-next-config-js/turbopack.md`와 Tailwind loader README를 확인했다.
- Ruling: Context7 PostCSS 예제 대신 실제 공식 템플릿의 Tailwind Turbopack 로더 유지 — 설치된 stable 구성에 맞춤 — Webpack 전환 시 별도 PostCSS 구성이 필요하다.
- Ruling: 템플릿 cacheComponents·partialPrefetching 제거 — 이번 정적 초기화에 불필요 — 필요 시 별도 설계/테스트 후 활성화한다.
- Ruling: 정적 소개/생성 설정에는 테스트 프레임워크 추가 안 함 — 낮은 영향의 초기화이며 lint/build/HTTP로 확인 — 브라우저 상호작용·비즈니스 로직은 검증하지 않았다. 이후 동작은 TDD 적용한다.
- Next Google 폰트 의존을 제거하고 한국어 title/lang·시스템 글꼴·지정 색상을 사용했다. 식당명/가격/평점을 생성하지 않았다.
- .env.example(빈 공개 설정), .env* ignore 예외, .nvmrc=24, components/lib/types 및 supabase/migrations 자리만 구성했다.
- `git init -b main` exit 0. 아직 커밋·remote·push 없음. GitHub/Vercel 앱은 호출하지 않았다.

### 실제 오류·경고와 해결

- 초기 문서 경로 `.mdx`를 읽으려 했으나 패키지가 설치 중이고 실제 확장자는 `.md`여서 실패했다. 설치 파일을 rg로 찾은 뒤 실제 .md를 읽었다.
- apply_patch에서 같은 README.md에 Delete/Add를 함께 지정해 거부되었다. 해당 호출은 적용되지 않았다. 별도 편집으로 새 생성 README만 작성했다.
- PowerShell의 `node -e` 문자열 인용이 깨져 SyntaxError가 났다. here-string을 node stdin으로 전달해 package.json을 정상 JSON/UTF-8로 다시 기록했다.
- 임시 빈 폴더 삭제가 OneDrive ReadOnly 속성으로 거부되었다. 절대 경로와 빈 폴더임을 확인한 뒤 해당 임시 폴더의 ReadOnly만 해제하여 삭제했다. 사용자 디렉터리 재귀 삭제는 하지 않았다.
- npm은 ESLint 9.39.5 지원 종료 경고를 냈다. 공식 Next 템플릿이 선택한 ESLint 9를 유지했고 lint는 통과했다. 향후 지원되는 ESLint 메이저와 플러그인 호환성을 검증해 갱신해야 한다.
- npm 11은 unrs-resolver@1.12.2의 미승인 postinstall 경고를 냈다. 스크립트를 추가 승인하지 않았다. 설치/lint/build는 성공했고 의도적으로 `--no-audit`를 사용했으므로 보안 감사 통과를 주장하지 않는다.

### 검증 결과 (로컬 Node 26.7.0)

| 명령 | 실제 결과 |
|---|---|
| npm.cmd ls --depth=0 | exit 0, 최상위 의존성 트리 정상 |
| npm.cmd run lint | exit 0, 경고/오류 출력 없음 |
| npm.cmd run build | exit 0, Next 16.4.3 Turbopack compile/TypeScript/정적 생성 성공; / 및 /_not-found |
| git check-ignore --no-index .env.local .env.production .env.example node_modules .next | 실제 환경 파일/node_modules/.next는 ignored; .env.example은 ignored 아님 |
| git diff --check | exit 0, 단 초기 untracked 파일은 검사 대상이 아니므로 이것만으로 신규 파일 전체 검증을 주장하지 않음 |

실제 브라우저 렌더링, 모바일 시각 확인, DB·OAuth·지도, Node 24·Vercel 검증은 미실행이다.

### 추가 검증

- `npm.cmd run typecheck` exit 0. `next typegen && tsc --noEmit`으로 라우트 타입과 TypeScript를 별도 확인했다.
- `npm.cmd start -- --hostname 127.0.0.1 --port 3100`으로 production 서버를 실행했다. PowerShell Invoke-WebRequest로 `/`와 실제 연결된 CSS가 HTTP 200인 것을 확인했다. 한국어 lang/title·준비 안내, CSS의 brand 색상/반응형 규칙을 검사했다. 외부 Google font 주소는 없었다.
- 검증용 서버는 write_stdin Ctrl+C로 종료했다(exit 1은 의도적 중단 결과이며 build 실패가 아니다).
- Superpowers requesting-code-review와 receiving-code-review 스킬을 읽었다. `phase0_final_review` 범용 Codex agent를 독립 컨텍스트로 호출하여 신규 파일 전체를 검토하도록 했다. Cavecrew reviewer 계약을 사용했고 네이티브 preset 실행은 아니다.
- 독립 최종 검토: Critical 0, Important 0, Minor 2. Minor는 구현 계획 체크박스 및 typecheck/HTTP/최종 검토 기록 누락 지적이었다. 검토 도중 갱신한 문서와 대조해 완료 상태·실제 결과를 반영했다. 코드 변경 요구는 없었다. 보류한 코드 결함은 없다.
- 신규 파일은 Git untracked이므로 별도 Node stdin 스크립트로 16개 텍스트 파일의 trailing whitespace·conflict marker를 검사했다. exit 0, 0 issues. `.env.example`은 값이 없는 공개 설정 예제이며 실제 키 파일은 생성하지 않았다.

### Phase 0 최종 상태와 인계

Phase 0의 초기화·기본 정적 화면·기본 구조·README/ignore/env 예제·3개 문서·lint/build/typecheck·HTTP 확인·독립 검토를 완료했다. 자동화 단위/E2E·실제 브라우저 시각·외부 서비스 기능 테스트 완료를 의미하지 않는다. Git은 main의 최초 커밋 전 상태다. 커밋 제안은 `chore: initialize yonsei eats foundation`이며, 커밋·push·배포는 수행하지 않았다.

이후 Phase 1(기본 UI)은 사용자 승인 대기다. Phase 2 seed는 사용자 검토 식당 전체 자료가 필요하다. Node 24 재검증, ESLint 지원 버전 갱신, Supabase/NAVER OAuth 프로필·PKCE 검증, Maps 도메인·요금 설정과 실제 배포는 해당 단계의 미완료 항목이다. 현재 lint/build 실패는 없다.
