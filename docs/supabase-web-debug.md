# Supabase 웹 조회 오류 조사 및 해결

작성일: 2026-10-28 (Asia/Seoul)

## 원인과 해결

3000번 포트의 기존 Next.js 개발 서버에서 외부 네트워크 연결이 차단되어 있었다. 서버 fetch 오류는 `TypeError`, `cause.code=EACCES`였다. 관찰된 실패 시간은 약 6~188ms로, 설정된 8초 타임아웃 전에 전송이 거부됐다. PostgREST 응답을 받기 전의 오류이므로 해당 실패는 RLS/뷰/키 인증 거부 응답이 아니다.

기존 서버를 이 프로젝트의 Next dev 프로세스로 식별한 후 해당 프로세스 트리만 종료했다. 같은 소스·환경 파일·조회 옵션으로 네트워크 접근이 허용된 실행 환경에서 3000번 서버를 재시작했다. 이후 홈과 상세 20곳이 모두 `data-source="supabase"`로 조회됐다. SDK 교체, 키 변경, RLS 수정, 타임아웃 연장 또는 복구 제거는 필요하지 않았다.

앞선 Phase 2 완료 검사에서는 별도 3101번 production 서버를 확인했다. 그 결과로 기존 3000번 개발 서버의 네트워크 권한까지 확인된 것은 아니었다. 이번에는 사용자가 보고한 3000번 서버를 직접 재현·수정·검증했다.

## 실행 경로 비교

| 항목 | 독립 점검 | Next.js 서버 |
|---|---|---|
| 환경 로딩 | `@next/env`의 `loadEnvConfig(cwd, true)` | `next dev`가 루트 `.env.local` 및 환경 파일 로딩 |
| 설정 검증 | `readSupabaseConfig(process.env)` | `loadRestaurantData` 안에서 같은 검증 |
| 클라이언트 | 공유 `queryRestaurantCatalog` | 같은 공유 함수 |
| 조회 | `restaurant_catalog` SELECT, ID 정렬 | 동일 |
| 요청 옵션 | 공개 키, 세션 저장/자동 갱신 없음, no-store, 8초 timeout | 동일 |
| 차이 | 네트워크 허용 실행에서 성공 | 기존 제한된 프로세스에서 EACCES, 재시작 후 성공 |

홈/상세는 동적 서버 렌더링이다. `no-store`를 유지했으며 요청 컨텍스트나 캐시를 우회하는 별도 데이터 경로를 만들지 않았다. 환경 변수의 실제 값·URL·키는 조사 로그에 출력하지 않았다.

## 변경 파일

- `src/lib/supabase/catalog.ts`: fetch 실패 시 안전한 오류명·원인 코드·경과 시간만 서버 로그에 기록. URL·헤더·원시 오류·응답 본문 제외.
- `tests/repository.test.mjs`: 오류 코드 유지와 민감 정보 로그 제외 회귀 테스트 추가.
- `README.md`, `docs/development-log.md`, 본 문서: 실행 환경 차이, 해결과 검증 기록.

## 재현 및 점검

네트워크가 제한된 프로세스에서 Next 서버를 실행하고 홈을 열면 `local-recovery`가 표시되며, 서버에는 다음 형태의 진단이 남는다. 네트워크가 허용된 별도 Node 점검은 같은 설정에서도 성공할 수 있다.

```text
[Supabase catalog transport] {"name":"TypeError","code":"EACCES","elapsedMs":15}
```

프로젝트 개발 서버를 종료한 뒤 외부 네트워크가 허용된 터미널에서 재시작한다. Codex로 시작할 경우 서버 프로세스 자체의 네트워크 접근 허용이 필요하다. 점검 명령만 네트워크 허용으로 실행해도 이미 실행 중인 서버의 권한은 바뀌지 않는다.

```powershell
npm.cmd run dev -- --hostname 127.0.0.1 --port 3000
```

별도 터미널에서 실제 웹 데이터 출처를 강제 검사한다.

```powershell
npm.cmd run db:check
$env:BASE_URL='http://127.0.0.1:3000'
$env:EXPECTED_DATA_SOURCE='supabase'
npm.cmd run test:http
npm.cmd run test:browser
```

## 실제 검증 결과

- 재시작 전: 3000 홈 HTTP 200, `local-recovery`; 서버 EACCES 재현.
- 재시작 후: `http://127.0.0.1:3000/` HTTP 200, source supabase, 카드 20개.
- 대표 상세 `/restaurants/sinchon-02`: HTTP 200, source supabase. HTTP·브라우저 검사에서 상세 20곳 모두 출처 확인.
- `npm.cmd run db:check`: 실제 원격 catalog의 승인된 20곳 ID·이름 및 응답 형식 통과.
- `npm.cmd test`: 27개 통과, 실패 0개. 원격 쓰기 검사가 아닌 로컬 PostgreSQL/fixture 검사 포함.
- `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run build`: 모두 종료 코드 0.
- 3000번 `test:http`: 홈·상세 20곳, URL AND 필터, 없는 ID 404 통과.
- 3000번 Edge `test:browser`: 검색·음식 종류·AND·초기화·빈 결과·URL reload·상세/뒤로 가기 통과. 375px 1열/1280px 3열, 가로 넘침 없음, 포착된 런타임·콘솔 오류 없음.
- 독립 Cavecrew reviewer 역할의 일반 서브에이전트: 중대한 문제 없음.

기존 Node 모듈 유형 경고는 남아 있으나 실패는 없다. DB 쓰기·SQL 변경·OAuth·지도·commit·push·배포 및 Phase 3은 수행하지 않았다. 개발 서버는 사용자 확인용으로 3000번에 실행해 두었다.
