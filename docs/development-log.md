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
