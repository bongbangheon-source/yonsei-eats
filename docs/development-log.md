# 개발 및 AI 활용 기록

현재 데이터 정책은 문서 끝의 **2026-10-27 — 식당 초기 데이터 정책 최종 변경** 항목을 따른다. 아래 Phase 0 당시의 '전체 식당 자료 필요'·검증 선행 조건은 당시 이력이며 최신 초기 등록 정책이 아니다.

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

## 2026-10-27 — 식당 초기 데이터 정책 최종 변경

### 사용자 결정과 작업 범위

사용자가 승인한 v2 식당 20곳 전체를 초기 등록한다. 정육면체 제외·오천집 신촌점 포함이며 더도이축산직영점 신촌점을 유지한다. 상세 검증은 개발 완료 후 진행한다. v3 검증 현황 및 v4의 3곳 제한, 주소/출처/현재 영업 미확인을 이유로 한 게시 보류를 초기 등록 기준에서 폐기한다. 기본 카드/상세 표시 자격과 검증 진행도를 분리한다.

이번에는 **데이터·문서만 변경**했다. Phase 1을 시작하지 않았고 UI 로더·카드·검색·필터·상세·지도·DB seed 기능을 구현하지 않았다. 기존 src·패키지·설정·README·환경 파일을 수정하지 않았고 .env 내용은 조회하지 않았다. 실제 외부 서비스 검증·설정·배포·커밋도 수행하지 않았다.

### 생성·수정 파일과 결정

- 신규 `data/restaurants.json`: 활성 초기 데이터. v2의 ID·이름·음식 종류 20개와 원본 참고 URL 4개를 보존했다. 전체 status=approved_initial_data, requiresVerificationForListing=false, 개별 verificationStatus=pending이다.
- 원본 `data/yonsei-eats-restaurants-v2.json`은 작업 시작부터 존재한 미추적 사용자 파일이며 수정하지 않았다. 원본의 후보/게시 보류 메모는 이력으로만 남기고 활성 데이터 정책이 우선한다. 루트의 별도 v2나 v3/v4 파일은 발견되지 않았다.
- 필드별 증거가 부족한 주소·좌표·메뉴·가격·영업시간·사진·영업 상태·verifiedAt·프랜차이즈 여부는 활성 JSON에서 null로 처리했다. 원본 주소·날짜·잠정 분류는 v2 보존본에 남겨 정보 손실을 피했다. 원본 링크는 미검증 참고 자료이며 조회/검증 완료를 의미하지 않는다.
- 신규 `docs/restaurant-data.md`: 식당별 8개 항목(총 160개)의 미완료 체크박스와 필드별 출처·확인 날짜·상태를 갱신할 기록 표. 검증 전에도 20곳 목록/상세 제공, null 표시·필터 의미·지도 마커 제외를 명시했다.
- 수정 `docs/spec.md`, `docs/implementation-plan.md`: 최종 정책과 이후 단계의 nullable 저장·20곳 seed·검증 독립 표시 조건·좌표 없는 마커 제외를 반영했다. 실제 UI/DB 구현 완료로 표시하지 않았다.
- 수정 `docs/development-log.md`: 본 기록과 과거 정책의 효력 구분을 추가했다.

### 실제 사용한 도구·스킬

- `exec_command`: AGENTS·Git 상태·관련 데이터/문서/화면 읽기, rg 파일/참조 검색, SHA-256 보존 검사, Node 내장 모듈 기반 JSON 작성/검증, git diff 검사.
- Superpowers brainstorming을 읽고 적용했다. 사용자가 데이터 기준·null 처리·표시 규칙·작업 범위를 명확히 확정했으므로 별도 제품 기능 설계를 추가하지 않고 지시된 정책만 적용했다. verification-before-completion을 읽고 아래 실제 결과를 확인했다.
- Caveman surgical-patch 및 cavecrew 스킬을 읽었다. `data_policy_investigator`로 읽기 전용 조사, `data_policy_review`로 독립 최종 검토했다. 둘 다 범용 Codex 서브에이전트이며 네이티브 Cavecrew preset 호출은 아니다. 최종 검토 결과는 No issues였다. 검토자는 20개 원본 ID/상호/종류·200개 null·20개 체크리스트/160개 미완료 항목·UTF-8과 활성 정책 일치를 확인했고 제품 기능 테스트는 실행하지 않았다.
- `apply_patch`: 명세·계획·개발 기록 수정. JSON/체크리스트는 Node stdin 스크립트로 작성했다. 별도 생성기·의존성·테스트 프레임워크 파일을 추가하지 않았다.
- Context7은 이번에 호출하지 않았다. 외부 라이브러리/API 사용이나 설정을 변경하지 않는 순수 JSON·문서 작업이므로 최신 라이브러리 문서 조회가 필요하지 않았다. 외부 식당 출처를 방문하거나 상세 검증했다고 주장하지 않는다.

### 발견한 오류와 처리

첫 Node stdin 검증 스크립트에서 PowerShell 기본 파이프 인코딩(us-ascii) 때문에 한글 정규식이 손상되어 SyntaxError가 발생했다. 생성 JSON의 한국어 정책 메모와 체크리스트에도 같은 문제가 있음을 확인했다. 해당 shell 호출에만 OutputEncoding=UTF-8을 설정한 뒤 새로 만든 JSON 메모/체크리스트를 다시 작성하고, 한글 상호 일치·깨진 문자·연속 물음표 검사를 포함하여 재검증했다. 원본 v2와 기존 앱 파일은 영향받지 않았다. 최종 검증은 exit 0이다.

Git은 LF가 향후 CRLF로 변환될 수 있다는 경고를 표시했다. 공백/충돌 검사 실패는 아니며 전역 Git 설정을 변경하지 않았다.

### 실제 검증 결과

Node stdin의 `node:assert/strict` 검사와 `git diff --check`를 실행해 exit 0을 확인했다.

- JSON 파싱, 식당 20곳, 고유 ID·상호 20개, 원본 ID/이름/음식 종류 순서 보존: 통과.
- 오천집 신촌점·더도이축산직영점 신촌점 포함, 정육면체·담산 제외: 통과.
- 식당당 10개 미확인 필드 총 200개 null, 개별 pending 상태와 등록 검증 조건 분리: 통과.
- 원본 참고 URL 4개 보존, 외부 rating 필드 미생성: 통과.
- 식당별 체크리스트 20개·미완료 체크박스 160개, UTF-8/충돌 마커/행 끝 공백 검사: 통과.
- 원본 v2 SHA-256은 작업 전후 `96d7b3cb1863905877c434813e72a6dbf42cb8053f0aab81e75a67748ed65796`으로 동일하다.
- `git diff --exit-code HEAD -- src public package.json package-lock.json README.md AGENTS.md next.config.ts tsconfig.json eslint.config.mjs`: exit 0, 기존 제품 코드·패키지·설정 변경 없음.
- 유효 좌표 쌍은 0곳이다. 향후 지도 구현 시 현재 데이터에서 생성 가능한 마커도 0개이며 20곳의 목록/상세 자격은 유지한다. 실제 지도/UI 실행을 검증한 것은 아니다.

이번 작업에서는 lint·build·TypeScript·브라우저·DB·OAuth·지도 테스트를 다시 실행하지 않았다. 데이터 파일은 아직 화면에서 import하지 않으므로 JSON/문서 무결성과 기존 파일 보존을 검증 범위로 삼았다. 위 Phase 0의 lint/build 통과는 과거 실행 결과다.

## 2026-10-27 — Phase 1 메인 탐색 UI 및 기본 상세

### 승인 범위 및 구현

사용자가 Phase 1을 명시 승인했다. 과거 기본 UI만 계획했던 범위를 로컬 데이터 검색·필터·기본 상세까지 확장한다. 기존 Git 상태는 main/clean이었다. Git commit·push·Vercel 배포·Phase 2는 수행하지 않는다.

승인 데이터 20곳 모두를 읽는 데이터 계층, 홈, 이름 검색, 원본 7개 종류 필터, AND 조합, 초기화, 결과 개수, 빈 결과 안내, 기본 상세 20곳과 잘못된 ID의 404를 구현했다. 흰색/네이비/블루/회색, 모바일 1열·데스크톱 3열 카드와 일관된 사진 준비 플레이스홀더를 사용한다. 실제 이미지·가격·영업시간·거리·별점·리뷰는 생성하지 않았다. 자체 리뷰 없음과 정보/위치/영업 상태 확인 중을 표시한다. 지도·로그인·가격/평점 필터는 disabled와 준비 중 문구로 실제 미구현 상태를 밝힌다.

데이터 JSON·원본 v2·lockfile·기존 Next/TS/ESLint 설정은 보존했다. package.json은 test/test:http/test:browser 스크립트만 추가했으며 의존성 설치/갱신은 하지 않았다. .env는 도구로 열거나 내용을 출력하지 않았다. Next 실행 로그에 .env 파일명만 표시됐고 비밀 값을 제품에 전달하는 코드는 추가하지 않았다.

### 실제 도구·AI 사용

| 실제 사용 | 목적과 결과 |
|---|---|
| exec_command / rg / git | AGENTS·명세·계획·정책·데이터·기존 코드 조사, 검사 명령과 파일 보존 확인 |
| Superpowers brainstorming | 지시된 UI 범위와 기존 승인 아키텍처를 검토하고 불필요한 API 계층 없이 서버 JSON + 작은 client UI로 결정 |
| Superpowers writing-plans | docs/phase1-plan.md에 파일/역할/테스트·완료 기준 기록 |
| Superpowers test-driven-development | 데이터 계층 RED→GREEN, SSR 카드 0개 RED→20개 GREEN, 대비 회귀 RED→GREEN |
| Superpowers systematic-debugging | DevTools timeout·브라우저 스크립트 오류 구분, 독립 검토의 대비 문제를 검사로 재현 |
| Superpowers requesting-code-review / receiving-code-review | 독립 검토 요청 및 지적의 실제 영향 확인 후 대비 수정 |
| Superpowers verification-before-completion | 최종 실제 종료 코드·production HTTP/브라우저 결과 확인 후에만 완료 보고 |
| Context7 context7-mcp 스킬 읽기 | resolve 후 공식 문서 조회 규칙 적용 |
| mcp__context7__resolve_library_id 3회 | Next.js·React·Tailwind 공식 문서 ID 확인 |
| mcp__context7__query_docs 3회 | Next async params/static params/notFound/history; React controlled input/filter/stable key; Tailwind responsive variants 조회 성공 |
| 설치된 Next 16.4.3 dist/docs 읽기 | dynamic-routes.md, server-and-client-components.md, not-found.md, use-search-params.md 교차 확인 |
| Caveman cavecrew 스킬 / phase1_investigator | 일반 Codex agent에 investigator 지침을 부여한 읽기 전용 조사. 20곳·7종류·null 정책·테스트/브라우저 가용성 확인 |
| phase1_data_builder | 일반 Codex agent에 builder 지침을 부여. RED 확인 후 src/lib/restaurants.ts 한 파일만 구현, Node 5 tests GREEN |
| phase1_reviewer | 독립 컨텍스트의 일반 Codex reviewer. 작은 파란 글씨 대비 지적 및 상세 복귀 링크 동작의 명확화 제안 |
| apply_patch / Node stdin | 허용된 코드·테스트·문서 편집. 한글 Node stdin은 UTF-8 OutputEncoding을 명시 |
| Chrome/Edge + CDP + Node WebSocket | 별도 설치 없이 격리된 임시 브라우저 프로필로 실제 DOM 동작·레이아웃 검사 |
| view_image | dev 검사로 생성한 1280px/375px 스크린샷 직접 확인 |

위 investigator/builder/reviewer는 **모두 범용 Codex 서브에이전트**이며 네이티브 Cavecrew preset을 호출한 것은 아니다. 브라우저 MCP·Playwright·Supabase·Maps API는 호출/설치하지 않았다. Windows browser process 실행은 exec_command의 승인된 escalation을 사용했다.

### 문서 근거와 버전

현재 설치 버전은 Next 16.4.3, React 19.3.1, Tailwind 4.3.3이다. Context7에 정확한 설치 버전 인덱스가 없어 기본 공식 문서 ID를 사용했고, 설치된 Next 문서로 실제 API를 교차 확인했다. 조회일은 2026-10-27이다.

- /vercel/next.js: https://nextjs.org/docs/app/api-reference/file-conventions/dynamic-routes , https://nextjs.org/docs/app/api-reference/functions/generate-static-params , https://nextjs.org/docs/app/api-reference/functions/not-found — Promise params·정적 상세·404. native history는 공식 repo App Router 구현의 결과도 반환됐다.
- /reactjs/react.dev: https://react.dev/reference/react-dom/components/input , https://react.dev/learn/rendering-lists , https://react.dev/learn/sharing-state-between-components — controlled input·파생 filter·stable key.
- /tailwindlabs/tailwindcss.com: https://tailwindcss.com/docs/styling-with-utility-classes , https://tailwindcss.com/docs/responsive-design — mobile-first sm/lg variants. 검색에 섞인 과거 v1/v2 variants 설정은 적용하지 않았다.

### TDD와 오류·해결

1. tests/restaurants.test.mjs를 먼저 만들고 Node에서 모듈 미존재 ERR_MODULE_NOT_FOUND/exit 1을 확인했다. builder가 데이터 계층을 구현한 뒤 5/5 통과했다.
2. tests/http-smoke.mjs를 UI 구현 전에 실행해 SSR 카드가 0개여서 expected 20/actual 0, exit 1을 확인했다. 구현 후 dev와 production에서 같은 검사가 통과했다.
3. 초기 Chrome headless 검사에서 샌드박스 내 Page.enable, escalation 실행에서 Page.navigate가 timeout됐다. 두 실행 모두 브라우저 테스트 통과로 계산하지 않았다. 설치된 Edge로 같은 검사 환경을 비교했고 Edge는 DOM 검사까지 진행됐다. Chrome timeout의 정확한 원인은 확정하지 않았으며 Edge를 기본으로 사용한다.
4. Edge 검사에서 테스트 스크립트의 따옴표 중첩 선택자가 SyntaxError를 냈다. 브라우저에 전달한 expression을 확인한 뒤 JSON.stringify로 선택자를 인코딩해 수정했다. 이후 dev/production 검사 모두 통과했다. 제품 검색 오류로 기록하지 않는다.
5. Node native TS import는 MODULE_TYPELESS_PACKAGE_JSON 경고를 표시한다. ESM 재해석 경고이며 테스트 exit 0이다. 전역 package module semantics를 바꾸거나 경고를 숨기지 않았다.
6. 독립 reviewer가 #3276DC 작은 본문의 대비 4.411:1(<4.5)을 지적했다. 전용 대비 테스트를 RED로 확인한 뒤 --color-link-blue:#245EBC를 추가하고 작은 글씨에 적용했다. 지정 브랜드색은 큰 강조 글씨·포커스에 유지했다. 흰색/옅은 카드 배경에서 대비 테스트 GREEN, 전체 Node 6/6 통과.
7. reviewer의 상세 복귀 정책 확인: 브라우저 Back은 기존 조건을 보존한다. 라벨이 '전체 식당 탐색'인 링크와 상단 탐색은 의도적으로 전체 목록으로 이동한다. spec/phase1-plan에 구분을 명시했다. 링크가 필터 유지 복귀라고 오해되도록 표시하지 않는다.
8. OneDrive 경로의 dev 로그에 잦은 filesystem update 대기 안내가 있었지만 dev 요청·최종 build는 통과했다. Git의 LF→CRLF 안내도 공백 검사 실패가 아니며 전역 설정은 변경하지 않았다.

### 최종 실제 검증 결과

최종 코드는 대비 수정 이후 검증했다. Node 26.7.0/npm 11.19.0, Windows 환경이다.

| 명령·검사 | 실제 결과 |
|---|---|
| npm.cmd test | exit 0, 6 passed/0 failed (모듈 유형 비치명 경고 있음) |
| npm.cmd run lint | exit 0, lint 오류/경고 없음 |
| npm.cmd run typecheck | exit 0, next typegen + tsc --noEmit |
| npm.cmd run build | exit 0, 홈 요청별 서버 렌더링·상세 20개 정적 생성 |
| npm.cmd start -- --hostname 127.0.0.1 --port 3101 | production 서버 실행 성공; 실제 검사는 이 서버 대상으로 수행 |
| npm.cmd run test:http | exit 0, SSR 카드 20·상세 20 HTTP 200·URL AND 필터 1곳·잘못된 ID 404 |
| npm.cmd run test:browser | exit 0, production Edge headless에서 hydration 후 20카드·필수 상호·정육면체 제외·리뷰 없음·가짜 0원/영업 중 없음·disabled 확인 |
| 같은 browser 검사 | 이름·종류 단독 및 AND·빈 결과·초기화·URL reload·실제 상세 링크·뒤로가기 상태 보존 통과 |
| 같은 browser 검사 | 375px 1열/1280px 3열, 가로 overflow 없음, 입력 programmatic focus 통과. 수집된 runtime/console errors 0 |
| view_image | dev 375px/1280px 스크린샷 확인. production 검사도 같은 경로에 스크린샷 저장 |
| git diff --exit-code HEAD -- data package-lock.json next.config.ts tsconfig.json eslint.config.mjs | exit 0, 승인 데이터·의존성 lockfile·기존 주요 설정 보존 |
| git diff --check | exit 0 (Git 줄바꿈 안내만 존재) |

스크린샷은 `.next/phase1-checks/375.png`, `1280.png`에 저장하며 생성 결과이므로 Git에서 제외된다. 브라우저 프로필은 개인 계정과 분리된 OS 임시 디렉터리다. 실제 모바일 기기, 다른 브라우저 전체 호환성, 스크린리더·전체 키보드 탐색, Node 24, DB/RLS/OAuth/지도 테스트는 실행하지 않았다. 이번 단계에 외부 키 설정은 필요하지 않다.

### 변경 파일과 인계

- 신규 src/lib/restaurants.ts, src/components/{site-header,restaurant-card,restaurant-explorer}.tsx, src/app/restaurants/[id]/page.tsx, src/app/not-found.tsx.
- 수정 src/app/{page,layout}.tsx 및 globals.css, package.json(test 명령만), README.md.
- 신규 tests/{restaurants.test,http-smoke,browser-smoke}.mjs, docs/phase1-plan.md.
- 수정 docs/spec.md, docs/implementation-plan.md, 본 개발 기록.

Phase 1 구현과 위 검증을 완료했다. DB/로그인/지도/실제 리뷰는 미구현 상태이며 다음 단계 승인 전 진행하지 않는다. 커밋·push·배포는 하지 않았다. 검증 서버는 Ctrl+C로 종료했고 포트 3101의 listener가 없음을 확인했다. 남은 격리 테스트 브라우저 프로세스도 0개였다. 최종 Git 상태는 의도한 변경 파일만 존재하며 데이터/lockfile/주요 설정 보존 검사와 diff 공백 검사는 exit 0이다.

## 2026-10-27 — Phase 1 완료보고서 및 실행 화면 제공

사용자가 요청한 완료보고서와 실행 화면을 별도 산출물로 만들었다. 제품 코드·데이터·패키지·기능 범위는 변경하지 않았다. verification-before-completion 스킬을 읽고 기존 개발 기록·현재 파일을 확인했다. Context7·서브에이전트는 이번 보고서 작성에서 새로 호출하지 않았다.

- 기존 build를 `npm.cmd start -- --hostname 127.0.0.1 --port 3101`로 실행했다. 로컬 production 및 개인 프로필과 분리된 Edge headless/CDP로 화면을 **새로 캡처**했다.
- 이번 캡처에서 20카드·hydration, 오천집+한식·국밥의 1개 결과, 오천집+일식의 0개 결과, 상세의 실제 상호를 확인했다. 수집된 브라우저 runtime 오류는 0개였다.
- `docs/phase1-screenshots/`에 main-desktop, cards-desktop, search-desktop, empty-desktop, detail-desktop, main-mobile, cards-mobile, detail-mobile PNG 총 8장을 저장했다. 홈/목록/검색/빈 결과는 1280×900 또는 375×900 viewport, 상세는 내용 전체 캡처(1265×1099, 375×1382)다. 이미지 도구로 카드·검색·모바일 카드·PC/모바일 상세를 직접 확인했다.
- `docs/phase1-completion-report.md`와 동일 본문의 HTML을 작성했다. 기존 구현 범위·파일·검증·실제 도구 사용·오류/대응·남은 항목·실행 방법과 화면 8장을 담았다.
- 로컬 HTML의 이미지 8개가 모두 decode된 것을 확인한 뒤 Edge Page.printToPDF로 `docs/phase1-completion-report.pdf`를 생성했다. PDF header/size, PNG signature/크기, Markdown/HTML의 이미지 참조 8개를 실제 검사해 통과했다.
- PDF·Markdown·HTML·PNG 폴더를 `docs/phase1-deliverables.zip`으로 묶었다. 사용자 편의를 위한 제출/검토용 산출물이며 실제 배포가 아니다.
- 보고서의 lint/build/typecheck/전체 테스트 결과는 직전 Phase 1 개발 검증 기록을 명시적으로 인용한다. 이번 보고서 제작에서 해당 전체 검사를 다시 실행했다고 기록하지 않았다. Phase 2·DB·인증·지도 구현이나 Git commit/push도 수행하지 않았다.
- 캡처용 production 서버를 Ctrl+C로 종료했다. 임시 캡처/PDF 스크립트는 Git 제외되는 .next 안에만 생성했다.

## 2026-10-27 — Windows npm ci EPERM 및 next 실행 복구

사용자 실행 화면에서 npm ci가 native SWC 파일 unlink의 EPERM(-4048)로 실패했고, 다음 npm run dev는 next 실행 파일을 찾지 못했다. Superpowers systematic-debugging과 Caveman investigate-first를 읽고 증상/설치 상태를 조사했다. Context7 /npm/cli를 resolve/query하여 npm ci가 설치 전에 기존 node_modules를 제거하고 package-lock은 수정하지 않는다는 공식 문서를 확인했다(https://github.com/npm/cli/blob/latest/docs/lib/content/commands/npm-ci.md).

조사 결과 node_modules/next/package.json과 .bin/next.cmd가 모두 없었고 SWC 파일만 남아 있었다. 당시 원인을 확정하지 않았으며 복구 시점에는 Node 프로세스 0개, 파일 ReadOnly=false, 독점 읽기 성공으로 현재 잠금 없음이 확인됐다. 기본 샌드박스의 프로세스 WMI 조회는 접근 거부였으나 승인된 escalation 읽기 조회를 시도했다. 다른 프로젝트 프로세스를 종료하거나 파일 권한·보안 설정을 변경하지 않았다.

현재 workspace 안의 node_modules 절대 경로를 확인한 뒤 `npm.cmd ci --no-fund --no-audit`로 lockfile 기반 재설치했다. exit 0, 357 packages 복구, package-lock 변경 없음. 기존 ESLint 지원 종료 및 unrs-resolver postinstall 승인 경고는 남았고 추가 스크립트 승인은 하지 않았다. 보안 감사를 수행했다고 주장하지 않는다.

`npm.cmd test`는 exit 0으로 6건 통과(기존 모듈 유형 비치명 경고 있음). `npm.cmd run dev -- --hostname 127.0.0.1 --port 3000`으로 Next 16.4.3 개발 서버 시작을 확인했다. 최초 HTTP 확인 스크립트의 변수명이 PowerShell 예약 변수와 충돌하여 실패했고, pageResponse로 수정했다. 페이지 HTTP 200과 SSR 카드 20개, next.cmd 복원을 확인했다. build/lint/typecheck/브라우저 전체 검사는 이번 복구에서 재실행하지 않았다.

README의 설치와 일상 실행 명령을 분리하고, 설치 실패 시 다음 명령을 계속 실행하지 않도록 안내했다. 앱 코드·데이터·환경 변수·lockfile은 변경하지 않았다. 사용자가 화면을 확인할 수 있도록 이번에는 개발 서버를 127.0.0.1:3000에 실행해 둔다. 이 서버가 실행 중일 때 npm ci를 다시 실행하지 않는다.

## 2026-10-27 — 완료보고서 신규 재작성본(v2)

사용자가 기존 보고서가 아닌 새 작업완료보고서를 요청하여 `docs/phase1-report-v2/`에 새 본문 report.md, 새 레이아웃 index.html, 새 PDF report.pdf를 작성했다. 기존 보고서·기존 화면·ZIP은 보존했다.

현재 개발 서버 http://127.0.0.1:3000 의 HTTP 200·SSR 카드 20개를 확인하고 `npm.cmd test` 6/6, `npm.cmd run lint` exit 0을 새로 확인했다. Node 모듈 유형 비치명 경고는 남았다. 이번에는 typecheck/build/전체 HTTP·브라우저 테스트를 재실행하지 않았으며 새 보고서 표에 이전 검증 이력과 구분했다.

격리된 Edge headless/CDP로 현재 개발 서버의 PC/모바일·검색·빈 결과·상세 총 8장을 새로 캡처해 screenshots에 저장했다. 20개/1개/0개 조건·상세 상호 확인은 통과했고 수집된 runtime 오류 0개였다. 임시 캡처 스크립트의 기존 production 문구는 템플릿에서 온 것으로, 실제 대상은 개발 서버임을 보고서에 명시하고 스크립트 문구도 정정했다. 이미지 도구로 새 카드 화면을 직접 확인했다.

새 HTML의 이미지 8개 decode를 확인한 뒤 Edge PDF 출력으로 새 PDF를 생성했다. PNG/PDF signature·개수·본문 한글·참조 수 검사와 `docs/phase1-report-v2.zip`의 PNG 8개 검사를 통과했다. 최신 npm ci 복구 내역·실행 방법·미검증 범위를 반영했다. 이번에는 Context7/서브에이전트를 새로 호출하지 않고 completion verification 스킬을 적용했다. 개발 기록 패치의 기준 문장이 맞지 않아 첫 적용은 실패했고 실제 문장을 확인하여 재적용했다. 앱 코드·데이터·의존성·기능 단계는 변경하지 않았고 기존 개발 서버는 유지했다. 커밋·push·배포는 하지 않았다.

## 2026-10-28 — Phase 2 Supabase 데이터 기반

### 승인 범위와 환경 조사

사용자가 Phase 2 로컬 구현을 명시 승인했다. 실제 Supabase 프로젝트 migration/seed는 사전 승인 대상이므로 **원격 쓰기·적용은 수행하지 않았다**. 시작 시 Git은 main/clean이었다. AGENTS, spec, implementation-plan, restaurant-data, development-log와 초기 JSON/기존 서버·클라이언트 코드를 읽었다. .env/.env.local은 설정 이름과 값 존재 여부만 검사하고 실제 값은 출력하지 않았다. 현재 Supabase URL/공개 키와 .env.local이 없으며 원격 DB 연결 도구도 노출되지 않았다. Docker/psql/Supabase CLI/Postgres 실행 파일도 없다.

### 도구·스킬 실제 사용

- Superpowers brainstorming으로 기존 승인 스키마/최신 리뷰 정책과 범위를 검토하고 writing-plans로 docs/phase2-plan.md에 구체 실행 계획을 작성했다. Auth/지도/리뷰 쓰기 UI 및 Phase 3 기능을 추가하지 않는다.
- test-driven-development: SQL 테스트의 migration ENOENT와 repository 미존재 RED 후 구현하여 GREEN을 확인했다. 검토 지적의 상세 장애/404 구분도 실패하는 테스트부터 추가했다.
- Context7 mcp__context7 resolve 3회/query 3회: /supabase/supabase(SDK 공개 키), /websites/supabase(RLS auth.uid WITH CHECK/security_invoker), /vercel/next.js(서버 데이터/no-store/notFound). mcp__codex_apps__context7 resolve/query 각 1회로 /electric-sql/pglite의 메모리 PostgreSQL exec/query를 확인했다. Supabase SSR/cookie 구형 예제는 적용하지 않았다.
- 설치된 Next 16.4.3 server/client 문서를 읽었다. route config의 dynamic.md 경로 조회는 파일 없음으로 실패했으며 rg 검색 후 실제 02-route-segment-config/index.md를 확인했다. SDK/Next API 사용 근거와 한계는 docs/supabase-setup.md에 기록했다.
- npm registry 메타데이터 조회 후 @supabase/supabase-js 2.118.0, server-only 0.0.1과 개발 의존성 @electric-sql/pglite 0.5.12를 설치했다. 기존 패키지의 버전 변경 0개/제거 0개, 신규 10개를 lockfile 비교로 확인했다. npm의 기존 unrs-resolver postinstall 경고는 추가 승인하지 않았다.
- Caveman cavecrew 스킬 읽기 및 범용 Codex agent 역할 사용: phase2_investigator(읽기 전용 조사), phase2_schema_builder(migration 한 파일만 구현), phase2_reviewer(독립 보안·동작 검토). 네이티브 Cavecrew preset을 호출한 것은 아니다.
- requesting-code-review/receiving-code-review 및 verification-before-completion 스킬을 읽고 실제 명령 결과로 검토·완료 여부를 판단했다. exec_command/rg/git/apply_patch 및 Node stdin을 사용했고 한글 stdin에는 UTF-8을 지정했다.

### 구현과 보안

`supabase/migrations/202610280001_initial_schema.sql`에 7개 테이블·FK/인덱스·별점/본문/가격/좌표 제약·RLS·컬럼별 grant·서버 timestamps/리뷰 identity 보호 trigger를 작성했다. profiles/reviews/favorites는 auth.users UUID를 참조한다. 공개 식당/메뉴/리뷰/태그 조회와 소유자 쓰기를 구분한다. 일반 사용자는 식당·메뉴·태그를 바꿀 수 없다. 즐겨찾기는 소유자 select/insert/delete이며 관계 변경은 삭제/추가다. 태그 연결은 부모 리뷰 소유권을 검사한다.

restaurant_ratings는 created_at DESC,id DESC로 사용자별 최신 리뷰만 평균/참여자 수에 반영하고, 전체 리뷰 수도 별도 집계한다. 리뷰 없음은 NULL이다. 수정으로 작성 시각/소유자/식당/ID를 바꾸지 못하며 최신 삭제 시 이전 리뷰가 복귀한다. 두 공개 view는 security_invoker=true다.

scripts/generate-seed.mjs는 승인 JSON에서 SQL 파일만 생성한다. seed.sql은 20곳의 stable text ID와 NULL/pending/출처 메타를 보존하고 ON CONFLICT(id) DO NOTHING으로 중복 및 기존 검증 정보 덮어쓰기를 막는다. 메뉴·리뷰·태그·사용자는 seed하지 않는다. 로컬 SQL 테스트의 사용자/태그/리뷰는 격리된 메모리 fixture이며 실제 프로젝트 데이터가 아니다.

Supabase 공개 조회는 server-only 모듈에서 persistSession/autoRefreshToken/detectSessionInUrl=false와 no-store/8초 timeout을 사용한다. 설정·응답 검증·원인 분류는 순수 repository로 테스트한다. service_role/secret 키는 config에서 거부한다. 키 누락·스키마·권한·연결·응답 형식 오류를 원문 비밀 정보 없이 안내하고 복구용 JSON 사용을 표시한다. 정상 DB 빈 목록은 seed/조회 정책 확인 안내와 빈 목록으로 유지한다. 서버 홈/상세만 async 조회로 바꾸고 client 검색/필터는 유지한다. 실제 리뷰 집계가 있을 때만 수치와 개수를 표시한다. 실제 로그인·쓰기 UI는 없다.

### 독립 검토와 회귀 보완

reviewer는 SQL 권한/RLS/identity/view/seed의 구체 결함을 발견하지 않았다. Important 1건: DB 전용 ID가 연결 장애 시 로컬에 없다는 이유로 404가 되는 문제. 테스트 RED 후 resolveRestaurantDetail로 found/missing/unavailable을 구분해 수정했다. 연결 복구 중 확인 불가 ID는 명확한 안내 화면(HTTP 200), 정상 DB/명시적 local 모드에서 없는 ID는 404다. 이는 장애를 식당 삭제로 단정하지 않기 위한 조치다.

Minor 1건: 같은 작성 시각의 ID DESC tie-break 검증 누락. 로컬 privileged fixture에서만 timestamp trigger를 잠시 비활성화해 동일 시각 두 리뷰를 넣고 큰 UUID의 평점이 채택됨을 SQL로 확인했다. 실제 migration의 보호 장치나 원격 trigger를 비활성화한 것은 아니다. anon/authenticated가 superuser가 아닌 것도 확인하고, 즐겨찾기 중복·타인 프로필/즐겨찾기 위조 차단을 추가했다.

### 현재 검증 증거

- `npm.cmd test`: 최종 14 tests passed/0 failed. 기존 Node module-type 비치명 경고가 있다. 그중 PostgreSQL 통합 test 1개 안에서 여러 실제 SQL 제약·RLS·집계 assert를 수행한다.
- PGlite에 운영 migration/seed SQL을 그대로 실행, 20개/seed 반복/검증값 보존/NULL·FK·별점·본문·좌표/7테이블 RLS/익명 조회/A·B 소유권/최신 삭제 복귀/동률/NULL 평균을 확인했다.
- Repository 7개 test는 공개 키 형태/secret 거부·잘못된 설정·로컬 모드·성공 매핑·빈 DB·스키마/RLS/네트워크 오류·비밀 원문 미노출·상세 장애 구분을 검증했다. SDK 응답 주입 단위 검사이며 실제 원격 DB 성공을 의미하지 않는다.
- `npm.cmd run seed:check`: exit 0, 저장된 SQL과 현재 JSON 20곳 일치.
- `npm.cmd run lint`, `npm.cmd run typecheck`: 검토 수정 후 exit 0을 확인했다. 최종 build/production UI 검사는 완료 후 아래 추가한다.
- `git diff --exit-code -- data`: exit 0, 승인 JSON과 원본 변경 없음. .env/.env.local ignored, .env.example은 추적 가능함을 확인했다.

실제 Supabase Auth 사용자/JWT/PostgREST·원격 RLS/스키마/seed·네트워크는 미검증이다. 현재 원격 URL/공개 키가 없고 사용자 적용 승인도 받지 않았다. 실제 환경에 적용했다고 주장하지 않는다. 구체 파일/위험/적용 순서는 docs/supabase-setup.md를 참고한다. DB 적용·commit/push/배포·Phase 3는 실행하지 않는다.

### 최종 빌드·production UI 회귀 확인

- 검토 수정 후 `npm.cmd run build` exit 0. 홈/상세 모두 요청 시 데이터 조회이며 build 중 원격 DB에 연결하지 않았다.
- `npm.cmd start -- --hostname 127.0.0.1 --port 3101` 후 기본 supabase 미설정→local-recovery 모드에서 `npm.cmd run test:http` exit 0. 20개 카드/상세·복합 URL·연결 확인 불가 안내 확인.
- 같은 서버 대상 `npm.cmd run test:browser`를 승인된 escalation으로 실행해 exit 0. 실제 Edge headless의 hydration 20카드·검색/종류/AND/초기화/빈 결과·URL reload/뒤로가기·상세20·복구 안내·375px 1열/1280px 3열/overflow 없음/입력 포커스·수집된 runtime/console errors 0을 확인했다. DB 성공 화면의 원격 브라우저 검증은 아니다.
- 별도 `RESTAURANT_DATA_SOURCE=local` 환경의 production 서버(3102)를 실행하고 BASE_URL=3102로 `npm.cmd run test:http` exit 0을 확인했다. 명시적 local 모드에서 기존 20개 목록/상세/복합 검색과 잘못된 ID의 실제 HTTP 404가 유지됨을 확인했다. 환경 파일을 수정한 것은 아니다.
- DB/seed는 메모리 로컬 엔진에만 실행했고 Supabase 호스팅에 실제로 적용한 migration/seed는 0건이다. 테스트 SQL fixture 데이터도 원격에 기록하지 않았다.

### Phase 2 변경 파일 및 인계

신규: docs/phase2-plan.md, docs/supabase-setup.md, supabase/migrations/202610280001_initial_schema.sql, supabase/seed.sql, scripts/generate-seed.mjs, src/lib/restaurant-repository.ts, src/lib/supabase/{config,server}.ts, src/components/data-source-notice.tsx, tests/{database,repository}.test.mjs.

수정: .env.example, README.md, docs/spec.md, docs/implementation-plan.md, 본 기록, package.json/package-lock.json, tsconfig.json(native TS 테스트의 .ts import 허용), src/lib/restaurants.ts(선택 집계 필드), 홈/상세·카드, 기존 HTTP/browser 테스트(복구 확인 불가와 정상 404 구분).

원격 적용 전 준비된 파일과 로컬 검증은 완료했다. 실제 Supabase 환경 설정·프로젝트 충돌 확인·사용자 승인·원격 적용·원격 anon/A/B/JWT/PostgREST 검증은 미완료다. 실제 remote generated DB 타입은 아직 생성하지 않았으며 SDK 응답은 런타임 검증과 UI 타입 매핑을 거친다. Phase 3·로그인/쓰기 UI·지도·커밋/push/배포는 하지 않는다. 사용자에게 .env.local 공개 설정과 SQL 적용 검토/승인을 요청한다.

## 2026-10-28 — migration·seed 적용 전 최종 SQL 감사

사용자의 최종 검토 요청만 수행했으며 실제 Supabase 접속/SQL 실행은 0건이다. 기존 미커밋 Phase 2 변경도 보존했다. 작업 시작 시 앱/src·data·seed·패키지/주요 설정 등 26개 파일의 SHA-256을 기록하고 종료 전 모두 일치함을 확인했다. 환경 값은 읽지 않았다.

SQL 수정은 `202610280001_initial_schema.sql`의 verification_status에 `restaurants_verification_status_check CHECK (verification_status IN ('pending','partial','verified'))`를 추가한 것뿐이다. NULL은 기존 NOT NULL로 거부한다. status 미허용 INSERT/UPDATE의 거부 테스트를 먼저 작성해 Missing expected rejection RED를 확인한 뒤 CHECK 추가로 GREEN을 확인했다. seed.sql은 내용 변경 없이 보존했다.

기존 tests/database.test.mjs에 상태 회귀 검사와 감사 helper 등록을 추가했고 tests/helpers/database-audit.mjs에 실제 PostgreSQL 검사 10개 하위 항목을 작성했다. 기존 npm test에 포함되므로 package.json은 수정하지 않았다. PK 7개·FK 8개·RLS 7개·인덱스·invoker view 메타, 7테이블 PK/일부 UNIQUE·CHECK·NOT NULL/FK의 SQL 오류 코드, 전체 anon CRUD 차단/공개 조회, 대칭 A/B 소유자 CRUD·타인 차단, uid NULL 거부, TRUNCATE/sequence/function 권한, 태그 소유자 직접 삭제/재추가와 타인 추가/삭제 차단, auth.users 삭제 cascade를 확인했다.

로컬 실제 엔진은 **PostgreSQL 18.6 (PGlite 0.5.12)**이다. 기존 최신 리뷰/삭제 복귀/동일 timestamp에서 UUID DESC 선택 검사도 함께 통과했다. seed를 두 번 실행한 20개 ID·상호·종류·참고 URL 및 200개 NULL을 원본 JSON과 대조했고 가짜 사용자/메뉴/리뷰 seed가 없음을 확인했다. 기존 검증 주소를 나중에 수정한 뒤 seed 재실행해 보존되는 검사도 유지했다.

추가 PK 테스트에서 메뉴 identity ID를 1로 가정해 처음에는 실패했다. PostgreSQL sequence는 앞선 실패 INSERT에도 증가하므로 실제 fixture의 기존 ID를 SELECT해 중복 삽입하도록 테스트를 고쳤다. 제품 SQL/제약을 약화시킨 것은 아니다. 최종 테스트는 25 passed/0 failed다.

실제 사용 내역: Superpowers receiving-code-review·test-driven-development·verification-before-completion을 읽고 적용, Caveman caveman-review 스킬 읽기, 일반 Codex agent `phase2_sql_final_auditor`에 Cavecrew reviewer 지침을 부여해 읽기 전용 독립 감사 수행. 네이티브 preset이나 builder를 호출했다고 주장하지 않는다. 감사자는 status CHECK 누락 외 SQL 권한 결함을 발견하지 않았고 권한 행렬·시퀀스/TRUNCATE·소유자 태그 삭제 검사를 보완하도록 제안했다.

Context7은 resolve 2회(Supabase/PostgreSQL), query 3회로 공식 Supabase RLS/views와 PostgreSQL current SELECT DISTINCT ON/ORDER BY·제약·FK 인덱스를 확인했다. 정확한 링크와 행렬은 새 `docs/phase2-sql-review.md`에 기록했다. pg15+ invoker view 지원과 로컬 엔진 버전은 확인했지만 실제 호스팅 PostgreSQL 버전·Auth/JWT/PostgREST는 미검증이다.

실행 결과: `npm.cmd test` exit 0(25 통과, 기존 Node module-type 비치명 경고), `npm.cmd run seed:check` exit 0, `npm.cmd run lint` exit 0, 보존 SHA-256 26개 일치, `git diff --check` exit 0(기존 줄바꿈 안내). 수정 파일은 migration, tests/database.test.mjs, 새 tests/helpers/database-audit.mjs, 새 docs/phase2-sql-review.md, 본 개발 기록이다. 앱 변경이 없어 build/typecheck/브라우저 검사는 재실행하지 않았다. commit·push·배포·원격 실행은 하지 않았다.

## 2026-10-28 — Phase 2 실제 Supabase 공개 조회 연결

### 범위 및 구현
- 기존 Phase 1 UI/검색/정확한 음식 종류 필터/URL/상세 및 기존 SQL·JSON을 보존했다. SDK 2.118.0은 이미 설치되어 재설치하지 않았다.
- 서버 전용 진입점의 catalog SELECT를 src/lib/supabase/catalog.ts로 공유했다. 공개 키, 세션 저장 비활성화, no-store, 8초 timeout, id 정렬을 유지했다.
- scripts/check-supabase.mjs 및 npm run db:check 추가: Next 환경 로더, 공개 키만 사용, GET만 수행, 승인된 20곳 ID·이름 및 NULL/평점 응답 검증. 환경 값·원시 오류는 출력하지 않는다.
- HTTP/브라우저 smoke에 EXPECTED_DATA_SOURCE=supabase 선택적 강제 검증을 추가해 홈·상세 20곳의 로컬 복구를 성공으로 인정하지 않도록 했다.
- .env.example·README·Supabase 설정 문서를 갱신했다. .env.local은 Git ignore됨을 확인했으며 환경 파일은 수정하지 않았다.

### AI 도구 실제 사용
- Superpowers systematic-debugging, writing-plans, test-driven-development, verification-before-completion 지침을 읽고 기존 계획 기반의 최소 변경과 검증을 수행했다. 신규 SDK transport 테스트는 catalog 모듈이 없는 상태의 실패를 확인한 후 구현해 통과했다.
- Context7 MCP resolve-library-id: Next.js와 Supabase JavaScript. query-docs: /vercel/next.js App Router 서버 조회·환경 로딩, /supabase/supabase 공개 키·createClient·뷰 SELECT·오류 처리(추가 공개 조회 예제 확인 포함). 설치 Next.js 16.4.3의 node_modules/next/dist/docs 환경 변수 문서도 교차 확인했다. Context7 기본 인덱스는 특정 설치 패치 버전에 고정된 자료가 아니다.
- 공식 근거: https://nextjs.org/docs/app/guides/environment-variables , https://supabase.com/docs/guides/api/api-keys , https://supabase.com/docs/reference/javascript/select . Context7 반환 소스는 supabase/supabase 공식 저장소의 관련 docs 원문이다.
- Cavecrew SKILL.md를 읽고 네이티브 preset 대신 일반 Codex 서브에이전트 supabase_connection_review에 investigator 및 reviewer 역할을 부여했다. 조사와 변경 후 읽기 전용 리뷰를 실제 수행했으며 중대한 오류 없음. builder preset은 호출하지 않았다.

### 실제 검증 결과
- npm.cmd test: 26/26 통과. 실제 SDK + 주입 fetch fixture transport, 실패/빈 결과/NULL/평점 매핑, 검색·필터, PGlite PostgreSQL 18.6의 스키마·RLS·seed 재실행·최신 리뷰 집계 포함. 로컬 fixture 검사는 원격 JWT 검증과 구분한다.
- npm.cmd run lint: 종료 코드 0.
- npm.cmd run typecheck: next typegen + tsc --noEmit 종료 코드 0.
- npm.cmd run build: 종료 코드 0. 홈과 상세는 동적 서버 렌더링.
- npm.cmd run db:check: 실제 Supabase restaurant_catalog 공개 조회 성공, 승인된 20곳 ID·이름 및 응답 형식 일치. 원격 INSERT/UPDATE/DELETE/SQL 실행 없음.
- EXPECTED_DATA_SOURCE=supabase, 로컬 production 3101에서 npm.cmd run test:http: 홈 20카드, 상세 20곳, URL AND 필터 및 잘못된 ID 404 통과. 모든 홈·상세 출처 supabase 확인.
- 같은 조건 npm.cmd run test:browser: Edge headless로 검색/음식 종류/AND/초기화/빈 결과/URL reload/detail-back 통과. 375px 1열·1280px 3열, 가로 넘침 없음, 입력 포커스, 전체 상세 및 브라우저 런타임/콘솔 오류 없음. 스크린샷 .next/phase1-checks/375.png 및 1280.png (생성물, Git 제외).

### 오류·해결 및 한계
- 점검 스크립트 첫 실행에서 @next/env의 CommonJS named export 오류 발생. default import로 수정 후 재실행 통과.
- 샌드박스 내 원격 조회는 네트워크 제한으로 실패했다. 승인된 네트워크 실행으로 동일 db:check 재실행 및 실제 UI 조회 성공. 복구 화면을 원격 성공으로 계산하지 않았다.
- Node.js 26.7.0 native TS 실행의 MODULE_TYPELESS_PACKAGE_JSON 경고는 남아 있으나 검사는 통과한다. 경고 제거만을 위한 전역 module 설정 변경은 하지 않았다.
- 원격 사용자별 JWT·쓰기 RLS·OAuth 검사는 실행하지 않았다. 해당 보안 정책은 로컬 PostgreSQL 역할 fixture 검증만 포함한다.
- 연결 실패 시 실제 원인을 범주별 안내하고 승인된 JSON의 로컬 복구임을 명확히 표시하는 기존 정책을 유지했다. 가짜 리뷰·가격·영업 여부를 만들지 않는다.
- DB migration/seed 재실행, OAuth/리뷰 작성/즐겨찾기/지도, commit/push/배포 및 다음 Phase 진행은 하지 않았다.

## 2026-10-28 — 3000번 Next 개발 서버 Supabase 조회 오류 해결

- Superpowers systematic-debugging 및 verification-before-completion을 읽고 적용했다. 증상 재현 → 안전한 전송 로그 → 실행 환경 비교 → 동일 코드 재시작 → 실제 화면 회귀 검증 순으로 진행했다.
- 초기 3000 홈은 HTTP 200이지만 local-recovery였다. 공유 catalog fetch에 URL/키/헤더/원시 메시지를 제외한 진단을 추가한 결과 TypeError cause.code=EACCES, 약 6~188ms 즉시 실패를 확인했다. 8초 timeout 및 DB 응답 이전의 네트워크 접근 거부였다.
- check-supabase의 @next/env 로딩과 Next dev의 루트 환경 로딩을 비교했다. 둘 다 같은 config 검증 및 catalog 클라이언트를 사용한다. no-store·stateless auth·조회/정렬·timeout은 같았으며 변경하지 않았다.
- 네트워크 허용 환경의 db:check는 실제 20곳 조회 성공. 기존 서버를 프로젝트 PID/Next dev 여부로 식별해 해당 프로세스만 재시작했다. PowerShell Stop-Process 내부 오류와 EADDRINUSE가 발생해 확인된 PID의 taskkill /T로 정리한 후 네트워크 허용 환경에서 동일 3000번 next dev 실행. 홈과 상세 source=supabase로 복원했다. 키나 RLS 변경은 없었다.
- 이전 완료 검증은 별도 3101번 production 서버 대상이었다. 이번에는 사용자가 보고한 3000번 개발 서버를 직접 검증했다.
- Context7 resolve-library-id(Next.js), query-docs(/vercel/next.js): App Router no-store 및 환경 파일 로딩 문서 확인. 설치 Next.js 16.4.3 환경 변수 가이드도 읽었다. 기본 문서 인덱스는 설치 패치 버전과 고정 일치하지 않는다.
- Cavecrew SKILL.md를 읽고 일반 Codex 서브에이전트 network_error_review에 reviewer 역할을 부여해 실제 검토했다. 네이티브 preset은 사용하지 않았다. 오류 식별자만 기록하는 최소 변경과 민감 정보 제외 테스트에 중대한 문제 없음.
- 변경: src/lib/supabase/catalog.ts, tests/repository.test.mjs, README.md, docs/supabase-web-debug.md, 이 개발 로그. SQL·seed·JSON·환경 파일은 변경하지 않았다.
- npm.cmd test 27/27 통과; lint/typecheck/build 모두 종료 코드 0. 추가 테스트는 전송 실패 코드 기록·URL/키/원시 오류 로그 제외를 확인한다. 진단 코드를 먼저 추가해 원인을 조사했고, 이후 테스트를 추가했으므로 이 추가 테스트의 RED→GREEN 사이클을 수행했다고 주장하지 않는다.
- BASE_URL=http://127.0.0.1:3000, EXPECTED_DATA_SOURCE=supabase로 test:http와 Edge test:browser 통과. 홈 20카드/상세20곳 출처, 검색/카테고리/AND/초기화/빈 결과/URL reload/상세-back, 375px1열·1280px3열 및 가로 넘침 없음 확인. 상세한 명령·재현법은 docs/supabase-web-debug.md.
- Node MODULE_TYPELESS_PACKAGE_JSON 경고는 남아 있으며 검사 실패는 없다. 원격 사용자별 JWT/쓰기 RLS 검증·DB 쓰기·commit/push/배포·Phase 3은 수행하지 않았다. 3000번 개발 서버는 확인용으로 실행 상태를 유지한다.

## 2026-10-28 — Phase 3 이메일 회원가입·로그인·마이페이지

### 사용자 승인 범위와 설계
- 사용자 Phase 3 지시로 Google/NAVER OAuth를 취소하고 이메일·비밀번호 Supabase Auth, 공식 SSR 쿠키, 본인 프로필·마이페이지를 구현했다. 기존 Phase1/2 탐색·공개 catalog 계층·SQL·JSON을 보존했다.
- 초기 AGENTS/spec/implementation-plan/development-log/supabase-setup 및 관련 소스를 읽었다. 기존 profiles PK/FK·본인 RLS·열 권한으로 충분해 SQL 변경·원격 migration은 없었다.
- docs/phase3-plan.md에 파일·단위·검증/승인 경계를 기록했다. 프로필은 이메일 확인 설정과 무관하게 첫 검증 세션 이후 생성하며, ignoreDuplicates upsert 후 select로 기존 닉네임을 덮어쓰지 않는다. 실패·기존 프로필 누락은 마이페이지 재시도로 복구한다.
- npm view로 @supabase/ssr0.12.7(peer JS^2.114.0)을 확인해 설치했고 기존 JS2.118.0과 호환 확인. 설치 audit0건. root package.json에 db→db:check 별칭 및 auth 테스트 명령 추가.

### 실제 도구 사용
- Superpowers writing-plans/TDD/systematic-debugging/verification-before-completion 지침을 읽고 적용. auth 모듈 부재 RED→구현 GREEN, encoded 공백 next 회귀 RED→GREEN, SSR adapter 부재 RED→GREEN을 확인했다.
- Context7 MCP resolve-library-id(Supabase,Next.js), query-docs(/supabase/ssr SSR getAll/setAll 두번째 cache headers/getUser, /supabase/supabase 이메일 signUp/token_hash/verifyOtp/메일 템플릿, /vercel/next.js Server Actions/Origin CSRF). 설치 Next16.4.3의 proxy/cookies/server-actions/logging 로컬 문서와 SSR0.12.7 타입도 읽었다. 기본 문서 인덱스는 설치 패치 고정 문서가 아니다.
- 공식 웹 https://supabase.com/docs/guides/auth/auth-smtp 및 /rate-limits, /passwords를 열고 기본 발송기의 팀원 이메일 제한·시간당2통·동일사용자 기본60초 및 설정을 확인했다.
- Cavecrew SKILL.md를 읽고 네이티브 preset 대신 일반 Codex agent phase3_investigator/phase3_auth_reviewer에 역할 지침을 부여했다. investigator는 기존 구조/권한 조사 및 격리 PGlite에서 중복 profile 삽입이 수정된 이름을 보존함을 확인했다. reviewer는 초기/최종 코드를 읽기 전용 검토했다. 공백 query 복귀 발견은 수정 및 재검토 후 새 보안 문제 없음. builder preset은 호출하지 않았다.
- 사용자는 비동기 질문에 실제 계정 테스트를 직접 하겠다고 답했다. 이메일·비밀번호를 요청하거나 받지 않았다.

### 구현과 보안
- /signup, /login, /auth/confirm, /mypage 및 공통 폼/헤더 상태 구현. server action의 signup/login/profile/logout/confirm은 same-origin POST 검사. signup metadata.display_name, 비밀번호8자·확인일치·이메일·닉네임2~20자 검증. session 없는 signup은 인증안내만 표시한다.
- src/lib/supabase/auth-client.ts 공통 SSR SDK 팩토리, auth-server.ts cookies adapter, src/proxy.ts 요청/응답 쿠키 갱신과 cache headers. 쿠키 HttpOnly/SameSite=Lax, production Secure. 사용자 ID는 getUser 검증값만 사용. 공개 catalog 조회는 기존 익명 클라이언트 유지.
- 내부 next만 허용하고 외부/백슬래시/제어문자/다중인코딩/인증경로루프 차단. login-link로 탐색 URL 쿼리 보존. 이메일 확인 GET은 표시만, POST verifyOtp로만 토큰 소비. 인증 URL 개발요청 로그 제외·오류 원문/암호/키/토큰 로깅 금지.
- .env.local은 ignore이며 미추적임을 확인했다. 실제 환경 파일·원격 설정·스키마·seed·식당 데이터는 수정하지 않았다.

### 실제 검증
- npm.cmd test: 37/37 통과(기존27+인증10). 입력·중복/미확인가입·no-session·로그인/로그아웃오류·프로필owner/복구·redirect·실제SSR SDK cookie재사용/새클라이언트getUser/refresh/logout fixture 포함. 기존 PGlite RLS/제약/seed/latest review도 통과.
- npm.cmd run lint: 종료0. npm.cmd run typecheck: next typegen+tsc 종료0. npm.cmd run build: 종료0, /,/restaurants/[id],/login,/signup,/mypage,/auth/confirm 모두 동적, Proxy 포함.
- npm.cmd run db: 실제 Supabase 공개 catalog20곳 ID·이름·응답형식 일치.
- BASE_URL=http://127.0.0.1:3000, EXPECTED_DATA_SOURCE=supabase test:http: 홈20카드/상세20곳 출처, URL AND, 없는ID404 통과.
- test:auth:http: /login,/signup HTTP200/no-store, /mypage 비로그인307, unsafe next fallback, 잘못된confirm, 실제Supabase의 위조세션거부 통과. 계정 생성 없음.
- AUTH_SMOKE=1 test:browser: Edge 기존탐색/검색/필터/URL reload/detail-back/20상세 및 375px1열·1280px3열 통과. 가입확인암호불일치 서버검증, 외부Origin ServerAction POST차단, 안전한next, 비로그인mypage이동, login/signup375/1280넘침없음 통과. .next/phase3-checks에4장 생성. 모바일 signup 스크린샷을 실제 열어 확인했다.
- 공개 Auth settings GET을 네트워크 허용 환경에서 읽기 전용 확인: Email provider true, 이메일확인필요 true, signupDisabled false. URL·키·계정값을 출력하지 않았다. Dashboard Site URL/template/SMTP는 별도 확인 필요.

### 오류·한계·종료
- encoded 검색어공백을 safeNext에서 거부한 오류는 path/전체제어문자 검증을 분리하고 회귀통과. CDP가 DOM객체를 returnByValue로 반환해 reference chain 오류를 낸 테스트도 boolean 조건으로 수정해 재실행통과.
- Node MODULE_TYPELESS_PACKAGE_JSON 경고와 기존 unrs-resolver install-scripts 안내는 남았으나 설치·검사는 통과. 무관한 module 설정·스크립트 승인 변경은 하지 않았다.
- 실제 정상 회원가입/메일 수신·인증/정상로그인/닉네임수정/로그아웃/브라우저재접속 및 원격A/B프로필 JWT 격리는 아직 사용자확인대기다. fixture와 HTTP검사를 실제계정통합완료로 표현하지 않는다.
- 설정/수동체크: docs/auth-setup.md. 파일목록/검사/미검증/AI도구: docs/phase3-completion-report.md. spec/implementation-plan/README/supabase-setup을 현재 정책으로 갱신했다.
- 원격 DB쓰기·Dashboard 변경·Git commit/push·Vercel배포·Phase4 미수행. 사용자 검토대기. 개발서버3000은 테스트용 실행상태를 유지한다.

## 2026-10-28 — Phase 4 리뷰·즐겨찾기·마이페이지

### 범위와 사전 확인
- AGENTS/spec/implementation-plan/development-log, 기존 인증·카드·상세·마이페이지·SQL/RLS/집계 구조를 읽었다. Phase3 getUser/SSR client를 재사용하고 기존20곳/검색/카테고리/URL/상세·프로필 기능을 유지했다.
- Cavecrew investigator가 실제공개키 HEAD로 reviews/tags/links0건, ratings/catalog20건, anon profiles/favorites401을 확인했다. 원격내부메타데이터 도구는 없어 RLS 정의의 소스검토와 실제접근응답을 구분했다. 태그를 임의 생성하지 않았다.
- docs/phase4-plan.md에 작업/테스트/원격승인 경계를 기록했다. 리뷰/태그 원자성 및 공개닉네임 때문에 별도 migration을 작성했다.

### 실제 AI 도구
- Superpowers writing-plans/TDD/systematic-debugging/verification-before-completion을 읽고 적용했다. 신규domain/SQL 부재 실패→구현 통과, 공백RPC회귀 실패→수정 통과를 수행했다. 쿼리test의 Node 확장자 해석 실패도 .ts import로 수정해 통과했다.
- Context7 resolve-library-id(Supabase,Next.js), query-docs(/supabase/supabase 함수SECURITY INVOKER/DEFINER·RLS·joins/upsert/range, /vercel/next.js Server Actions인증·pending·revalidate). 기존JS2.118.0/SSR0.12.7을 재사용했고 Next16.4.3 로컬server-actions 문서도 읽었다. 문서인덱스는 특정패치에 고정되지 않는다.
- Cavecrew SKILL.md를 읽고 네이티브preset 대신 일반Codex agent phase4_investigator, phase4_sql_builder, phase4_sql_reviewer에 조사/작은2파일구현/독립리뷰 역할을 부여했다. investigator는 이후앱코드reviewer 역할도 수행했다. agent별PostgreSQL/Next Context7 조회와 로컬SQL검사도 실제 수행했다. 환경비밀/원격사용자쓰기 없이 진행했다.

### 구현 및 보안
- 리뷰작성/본인수정/삭제확인, 별1~5·본문trim1~5000·실제태그최대10, 공개최신목록20건pagination. nickname없음fallback, 빈데이터/조회오류구분, React텍스트렌더. 평균은기존DBview만 사용하고 전체리뷰수/참여자수구분.
- 신규save_review는 SECURITY INVOKER·empty search_path·authenticated EXECUTE로 auth.uid 소유권검사/RLS. 리뷰+태그 한transaction, 요청UUID/advisorylock으로 재시도중복방지. 다른UUID는동일인반복리뷰허용. authenticated INSERT(id)열grant만 추가, 기존RLS/평점/identity/timestamps유지.
- review_author_names owner view는 의도적으로 공개리뷰의 review_id/display_name2열만 노출한다. profiles자체RLS는 그대로이며 이메일/아바타/전체profile공개는없다. 공개정책변경시재검토하도록검토서에명시했다.
- favorites는정확한on/off·본인ID·복합PK/ignoreDuplicates·pending/ref잠금·실제상태재조회. 카드링크/form중첩없이홈/상세/마이페이지연결. 실패도페이지재검증하며낙관적가짜상태를표시하지않는다.
- 본인리뷰/즐겨찾기/식당이동/빈상태를마이페이지에추가했다. 새리뷰폼식당key/수정폼id+수정시각key로상태경계명시. 인증user_id는클라이언트입력값으로받지않는다. same-origin POST보호와 기존SSR쿠키사용.

### 사용자 승인·원격 적용과 검증 구분
- docs/phase4-db-review.md와 202610280002_reviews_favorites.sql을구체적으로준비하고권한/공개닉네임위험·비파괴범위를설명한뒤사용자에게검토/직접적용요청했다.
- 사용자회신: '검토 후 신규 SQL 적용 완료'. 에이전트원격SQL실행은없었다.
- 적용후 npm.cmd run db:community 실제검사통과: reviews/review_tags/review_tag_links/restaurant_catalog/review_author_names공개조회, catalog20, 익명save_review실행거부42501. 존재하지않는새UUID+creating=false권한요청이므로리뷰삽입없음. 이검사는인증사용자쓰기/RLS완료가아니다.
- 적용후실제3000상세source=supabase·리뷰영역·0건빈안내·migration준비안내해제를확인했다.
- 실제계정검사를별도로질문했고사용자회신은 '리뷰·즐겨찾기·마이페이지 모두 정상'. 요청범위는리뷰작성/수정/삭제·즐겨찾기추가/해제/새로고침유지·내목록이었다. **사용자수행통합확인**이며에이전트직접인증계정쓰기검사로기록하지않는다. 비밀번호/세션/키를요청하거나받지않았다.

### 실행 검사
- npm.cmd test 57/57통과(기존37+operations7+queries3+신규PostgreSQL10). 로컬PG18.6/PGlite실제SQL의원자성/후반태그실패rollback/A·B권한/중복UUID/반복리뷰/최신삭제평점복귀/태그cascade/즐겨찾기중복·해제·지속·격리/공개2열과profiles비공개검사포함.
- npm.cmd run lint 종료0, npm.cmd run typecheck(next typegen+tsc)종료0, npm.cmd run build종료0(동적페이지/proxy).
- npm.cmd run db 실제Supabase20곳ID·이름·NULL/평점형식통과. npm.cmd run db:community 적용후실제공개뷰/익명권한검사통과.
- BASE_URL=http://127.0.0.1:3000 EXPECTED_DATA_SOURCE=supabase COMMUNITY_SMOKE=1 test:browser를적용전/후실행통과. 홈20카드/검색/종류/AND/초기화/빈결과/URL reload/상세-back/20상세/404,375px1열·1280px3열·가로넘침없음. 공개리뷰영역/익명쓰기폼미노출/로그인안내/상세375·1280레이아웃통과. 실제원격쓰기없는격리Edge프로필이다.
- .next/phase4-checks/detail-375.png,detail-1280.png생성. 375px이미지를실제로열어확인했다. Git제외생성물이다.

### 오류·수정·미검증
- 독립SQLreviewer가btrim의탭/개행공백허용을로컬직접RPC로재현. builder가회귀RED후POSIX비공백검사추가GREEN. 원격적용요청전에수정완료했다.
- 리뷰DB커밋후응답만실패시목록/평점낡음가능성을코드리뷰로발견해오류도유효식당경로재검증. formkey추가는방어적명시이며현재Next에서재현확정결함으로기록하지않는다.
- 기존browser의모든리뷰없음가정을실제리뷰/평점도허용하도록수정해실제사용자데이터와양립시켰다. nativeNode query→validation확장자누락은.ts로수정. patch의기존Props매칭실패는파일실제signature확인후수정했고사용자파일을삭제/초기화하지않았다.
- 원격두JWT A/B의타인수정/삭제부정검사, 실제태그선택(현재정의0건), 에이전트직접인증CRUD/원격실패주입/동시탭검사는미수행이다. 로컬SQL/fixture/사용자직접정상회신과분리한다. 로그인된작성폼의기기별UI증거는사용자로부터받지않았으며에이전트반응형검사는익명화면이다.
- Node MODULE_TYPELESS_PACKAGE_JSON 및Windows줄바꿈안내는남았지만검사는통과했다. SQL/seed/JSON기존내용과.env.local은보존했고실제사용자데이터삭제/초기화·가짜리뷰/태그생성·commit/push/배포·Phase5를하지않았다.
- 생성/수정파일전체와결과는docs/phase4-completion-report.md에정리했다. 사용자검토대기,3000서버실행유지.

## 2026-10-28 — Phase 5 NAVER Maps 및 위치 검증

### 조사·계획·데이터 정책
- AGENTS/spec/implementation-plan/development-log/restaurant-data와 기존 UI·URL·DB 조회 구조를 읽었다. 실제 공개 DB는 처음에 주소·좌표20곳 모두 NULL이었다. 별도 위치 레지스트리와 정확한 DB 일치 조건을 사용하도록 docs/phase5-plan.md에 계획했다.
- data/restaurants.json, v2, 초기 seed, 기존 식당20곳 ID는 보존했다. 위치 전용 data/restaurant-locations.json에 출처·확인일·상태·사유를 추가했다. 모든20곳을 실제 검색했으며 상세 기록은 docs/phase5-location-audit.md에 남겼다.
- 소바연구소/꼬숑돈까스는 서울관광 공식 원문의 식당별 data-map-x/y와 길찾기 함수로 주소·좌표 확인. main도 해당 두 URL을 HTTP200으로 조회해 숫자를 독립 확인했다. 공식 위치2곳만 반영했고 현재 영업·모든 상세검증을 완료했다고 하지 않았다.
- 라구식당/춘천집은 주소 자료 충돌, 더도이는 공식ID·좌표 후보를 얻었지만 원문 전체한국어 명칭/주소 재확인 문제 및 후속429로 보류했다. 다른 지점/본사 주소를 대신 사용하지 않았고, 접근 차단을 우회하거나 좌표를 추측하지 않았다.

### 실제 도구 사용
- Superpowers using-superpowers/writing-plans/TDD/systematic-debugging/verification-before-completion 지침을 읽고 계획·실패테스트·원인별 수정·검증을 적용했다. 위치/SDK 모듈 부재 RED→구현 GREEN, SQL 부재 RED→구현 GREEN, stale script 경주 회귀 RED→세대검사 GREEN을 확인했다.
- Context7 resolve(NAVER Maps JavaScript API v3, Next.js), query(/websites/navermaps_github_io_maps_js_ncp 인증·ncpKeyId/navermap_authFailure와 마커/정보창/event, /vercel/next.js client script onReady/onError). 공식 NAVER Cloud 조건·Maps v3의 setSize/destroy/InfoWindow 원문과 설치 Next16.4.3 scripts문서를 교차 확인했다. SDK는 v3 웹API이며 고정 npm패치버전을 뜻하지 않는다.
- Cavecrew SKILL.md를 읽고 일반 Codex agent phase5_locations_a/b를 위치 investigator로, phase5_investigator를 코드 investigator/두 SQL파일 builder로, phase5_locations_a를 독립 reviewer로 활용했다. 네이티브 preset 사용은 아니다. 실제 웹검색·공개HTML 확인·PGlite SQL·SDK경주 재현·최종재검토를 수행했다. reviewer의 최종 map/SDK8테스트도 통과했다.

### 구현·보안
- /map, 검색/정확한category/선택/모바일 view의 URL 상태, 목록↔지도 왕복을 구현했다. PC동시보기·모바일탭, 상세의 검증위치 링크, 미검증식당 목록/안내를 연결했다.
- 마커는 레지스트리 verified와 DB id/name/address/lat/lng가 정확히 일치할 때만 생성한다. DB NULL을 레지스트리로 조용히 대체하지 않는다. 기존평점뷰의 실제평점/리뷰없음만 표시한다.
- 클라이언트 전용 공식 SDK async loader, 키누락/인증/네트워크/15초timeout/재시도 및 늦은인증실패를 처리한다. 이전시도 콜백의 새로드 간섭은 generation으로 막았다. 정보창은 textContent/내부링크만 쓰고 지도/마커/정보창/listener를 정리한다.
- DOM 양수크기를 setSize로 반영하고 ResizeObserver로 모바일숨김/크기변경에 대응한다. NAVER로고·저작권 기본컨트롤을 제거하지 않는다.
- /map 응답/메타/SDK에 strict-origin-when-cross-origin을 사용해 도메인인증을 지원하고 /auth/confirm 등의 no-referrer는 유지했다. SSR쿠키/RLS/기존Auth권한은 변경하지 않았다. Key ID만브라우저사용, Client Secret/서비스역할키 미사용. 실제키값은 로그/보고서에출력하지 않았다.

### 사용자 설정·승인·실제 조회
- 초기 키미설정을 presence boolean으로 확인한 뒤 사용자에게 공개 Key ID와 허용URL 설정을 요청했다. 사용자가 '지도 설정 및 공개 Key ID 저장 완료'라고 회신했다. 사용자 환경파일 값은 에이전트가 덮어쓰지 않았다.
- docs/phase5-db-review.md와 202610280003_verified_locations.sql을 준비하고 충돌/보존 범위를 설명했다. 사용자가 '검토 후 위치 SQL 적용 완료'라고 회신했다. 에이전트 원격SQL 실행은 없었다.
- 신규SQL은 이름/현재값 충돌검사와 FOR UPDATE, 전체transaction을 사용한다. 두행의 주소/좌표 및 필요한partial/source만 보완하며 기존source_url/전반verified_at/사용자데이터/미확인상세는 보존한다. 재실행시 updated_at도 보존한다.
- npm.cmd run db:locations 실제결과: restaurants20, verifiedLocationRecords2, dbMatches2, unlocated18, pendingLocationIds없음. npm.cmd run db도 승인20곳과응답형식통과.

### 실제 실행 검증
- npm.cmd test 69/69통과(기존57 + 위치/URL3 + SDK/controller5 + 위치SQL4). SQL은 격리 PGlite의 실제PostgreSQL에서2건일치/18NULL/기존값·리뷰·즐겨찾기·집계보존/충돌·이름불일치·누락ID rollback/재실행불변을 검사했다.
- npm.cmd run lint 종료0, npm.cmd run typecheck next typegen+tsc 종료0, npm.cmd run build 종료0. 공개키 설정 후 production build도 다시 실행했다. /map은 명시적 요청시 동적렌더링이다.
- test:http(3000, EXPECTED_DATA_SOURCE=supabase): 홈20카드/상세20곳/URL AND/404/검증위치링크 또는미확인안내 통과. test:auth:http도 로그인·가입·보호페이지·위조세션거부 통과.
- 전체 Edge회귀(AUTH_SMOKE=1 COMMUNITY_SMOKE=1 MAP_SMOKE=1 REQUIRE_REAL_MAP=1): 기존 검색/종류/초기화/빈결과/URL reload/상세-back/20상세/375·1280, 인증폼입력/CSRF, 공개리뷰영역, 실제NAVER맵까지 통과했다. 인증계정쓰기는 하지 않았다.
- 실제NAVER강제검사: 실제SDK ready, 정상타일이미지, 마커2곳, 목록선택의정보창, 실제마우스마커클릭→URL/목록동기, 모바일전환, 검색/카테고리갱신 통과. 홈에서 첫SPA진입하는 경우의 도메인인증과 카드목록↔지도 왕복도 추가로 실제통과했다.
- 별도격리Edge에서 NAVER SDK URL만 CDP차단(MAP_BLOCK_SDK=1): 오류안내, 목록/검색/상태유지 통과. 모의SDK단위검사·실제정상검사·실제요청차단검사를 구분했다.
- 실제스크린샷 .next/phase5-checks/map-ready-375.png/1280.png와오류 map-error-375.png/1280.png를 분리생성했다. 실제모바일지도이미지를 열어 타일/정보창/저작권표시를 확인했다. 생성물은 Git제외다.

### 오류·해결·미검증·종료
- 리뷰어가 Event.trigger resize만으로 SDK내부크기를 갱신하지못하는 문제를 발견했다. setSize/ResizeObserver/ready후크기반영으로 수정하고 실제타일/마커검사를 통과했다.
- 제거된 옛 script.onerror가 새재시도를 거부하는 경주를 mock재현했다. 세대체크로 회귀실패→통과.
- 합성 marker.click() 검사는 URL동기시간초과로 실패했다. 실제화면 안에마커를 배치하고 CDP mousePressed/Released로 바꿔 실제사용자입력을 검사해 통과했다. 실패를 숨기지 않았으며 SDK성공으로 위장하지 않았다.
- /map 사전렌더시도의 요청전용fetch가 전송오류처럼 진단로그를 남겨 dynamic force-dynamic으로 정리했고 최종build에는 해당로그없이 통과했다. 기존HTTP의 모든위치NULL가정도 위치레지스트리 기준으로갱신했다.
- 남은18곳의 정확한현재위치·영업상태·미확인상세는 후속검증대상이다. localhost별도도메인, 잘못된실제키로의인증실패강제검사, 새실제계정가입/로그인/리뷰/즐겨찾기쓰기는 이단계미수행이다. 인증실패는mock, 네트워크실패는실제요청차단으로 검증했다.
- 기존 Node모듈유형 및Windows줄바꿈경고는 남아있으나 검사실패없다. .env.local은ignore/미추적 확인. 초기JSON/seed/식당ID·기존사용자데이터보존, 패키지추가없음. Git commit/push/Vercel배포/Phase6를 진행하지 않았다.
- 전체변경파일·결과는 docs/phase5-completion-report.md, 설정은docs/maps-setup.md에 기록했다. 3000서버는 실행상태이며 사용자검토를 기다린다.

## 2026-10-28 — Phase 6 배포 전 준비 (진행 중)

- AGENTS 및 Phase5/명세/계획/개발기록을 확인하고 로컬 main의 기존3커밋과 미커밋 Phase2~5 변경을 조사했다. GitHub connector get_repo/get_user_login으로 대상 public 저장소·연결 계정·push권한을 실제 확인했다. git ls-remote는 refs 없이 종료0으로 빈 원격임을 확인했다. 로컬 origin은 아직 없다.
- Superpowers writing-plans/verification-before-completion 및 Cavecrew 지침을 읽고 계획/읽기전용 독립 보안감사를 수행했다. 일반 Codex agent phase6_security_audit에 조사·reviewer 역할을 부여했다. 네이티브preset은 사용하지 않았다.
- Context7 resolve Vercel/Supabase, query Vercel GitHub import·환경변수·Node24 engines override, Supabase SiteURL/RedirectURLs/메일템플릿을 확인했다. 실제 사용환경변수3개와 선택RESTAURANT_DATA_SOURCE를 소스에서 조사했고 NEXT_PUBLIC_SITE_URL은 현재런타임필수가 아님을 확인했다.
- Plugin Management 스킬로 Vercel연결도구를 검색했다. 미연결 상태를 확인하고 사용자승인 후 연결안내를 제공했다. 아직 실제연결·프로젝트생성·배포했다고 주장하지 않는다.
- 독립감사: 후보텍스트/실환경값4개, 과거고유Gitblob159개·ZIP/PDF를 검사해 실제환경값/개인키/토큰노출0. 기존3커밋작성자이메일 및 구형PDF/ZIP의로컬경로메타데이터를 발견했다. 사용자에게충돌을설명했고 '기존 이력을 보존하고 공개 허용' 회신을받았다. 값은새문서에복사하지않고이력재작성하지않는다. 현재파일검사와사용자허용이력예외를구분했다.
- Vercel목표와일치하도록package/lock루트engines를24.x로명시했다. npm임시캐시Node24.22.1로scripts/preflight.mjs를실행했으며전역Node/프로젝트기능/DB를변경하지않았다. npm스크립트문맥에서도node --version24.22.1을확인했다.
- 실제preflight결과: npm test69/69, lint, typecheck, build 모두종료0. 사용자요청대로npm run db3회를각각실행해모두실제catalog20곳조회통과. 안전한요약만docs/submission/preflight-results.json에저장했고원시로그/키/토큰은저장하지않았다.
- 제출자료final-report.md,실제운영검사표production-tests.md,배포절차docs/deployment.md작성. 이전로컬실제캡처7장을docs/submission/screenshots에복사하고로컬출처manifest를기록했다. 운영캡처로표시하지않는다. 실제Vercel URL·운영검사는아직미실행이다.
- scripts/audit-release.mjs는실제env값정확일치·토큰패턴·개인키·환경파일을후보/stage바이트에서검사하고값없는요약만저장한다. 첫후보159개검사findings0. 실제stage/commit/push/운영변경은아직미수행이며사용자에게구체적인파일목록과메시지를제시한후승인받는다.
