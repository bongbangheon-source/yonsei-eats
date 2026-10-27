# 연세잇츠 Phase 5 작업완료보고서

작성일: 2026-10-28 (Asia/Seoul)

**Phase 5 지도 구현과 실제 NAVER API 검증을 완료했다.** 사용자가 공개 Key ID 설정과 위치 SQL 적용을 직접 완료했고, 에이전트는 실제 Supabase 위치 2건과 NAVER SDK·지도 타일·마커 클릭을 확인했다. 모의 SDK 검사만으로 정상 동작을 주장하지 않는다.

## 구현 기능

- `/map`: NAVER Maps JavaScript API v3, 지도와 식당 목록, 음식 종류 및 이름 검색.
- `q/category/selected/view` URL 상태, 새로고침·선택 동기화, 카드 목록↔지도 왕복 시 검색·종류 유지.
- PC에서는 지도·목록을 함께 표시하고 모바일에서는 탭으로 전환한다.
- 검증 기록과 실제 DB의 ID·이름·주소·좌표가 일치하는 식당만 마커로 표시한다. 미검증 식당도 목록·상세에서 탐색 가능하다.
- 마커와 목록 선택을 동기화하고 이름·종류·실제 평균 평점 또는 '아직 리뷰 없음'·상세 링크를 표시한다.
- 검증된 상세 페이지에 해당 식당을 선택하는 지도 링크를 제공한다. 나머지는 '위치 확인 중'을 유지한다.
- 키 누락·인증 실패·네트워크 실패·15초 시간 초과 안내와 재시도. 지도 실패 시에도 식당 목록·검색은 유지한다.
- 정보창은 DOM `textContent`와 내부 링크를 사용한다. 지도 이벤트·마커·정보창·지도 객체를 정리하고 화면 크기 변경을 반영한다.

## 위치 검증 및 DB 반영

승인된 20곳을 모두 검색했다. 공식 자료로 이번에 반영한 위치는 **2곳**이다.

| 식당 | 주소 | 위도 / 경도 | 공식 근거 |
|---|---|---|---|
| 소바연구소(sinchon-05) | 서울 서대문구 명물길 50-9 (창천동) | 37.5587750739815 / 126.939459409798 | [서울관광 신촌본점](https://korean.visitseoul.net/area/SobaLabSinchon/KOP1kjvs6) |
| 꼬숑돈까스(sinchon-08) | 서울 서대문구 명물1길 2 (창천동) | 37.557838918578 / 126.937349643274 | [서울관광 공식](https://korean.visitseoul.net/restaurants/CochonTonkatsu/KOPf7618z) |

공식 원문 식당별 지도 속성·길찾기 함수와 이름을 대조했고, main도 HTTP200 원문의 좌표를 독립 확인했다. 이 결과는 **위치 확인**이며 현재 영업·가격·영업시간 또는 모든 상세 정보의 검증 완료를 의미하지 않는다.

보류한 18곳은 라구식당, 오천집 신촌점, 카츠업, 카라멘야, 고삼이, 오향미엔, 야바이, 완차이, 소신이쏘 신촌본점, 유닭스토리 닭한마리, 여우골초밥, 평안도식당, 공복식당, 춘천집 닭갈비 막국수, 더도이축산직영점 신촌점, 키친봄날, 미분당 신촌본점, 백소정 신촌점이다. 식당별 출처·접근 실패·지점 차이·주소 충돌은 [전체 위치 확인 기록](./phase5-location-audit.md)에 정리했다.

- 라구식당·춘천집은 주소 자료 충돌이 있다. 춘천집의 공식 좌표도 자동 반영하지 않았다.
- 더도이는 사용자 링크와 일치하는 NAVER 장소 ID·사업장 좌표 후보를 확보했지만, 원문 전체 명칭·주소의 문자 인코딩 재확인과 후속 요청 제한 문제가 남아 이번 마커에서는 보류했다.
- 나머지는 공식 지점 좌표 미확보, 다른 지점 자료, 사이트 접근 제한 등이 이유다. 미등록·폐업으로 단정하지 않았다.

`202610280003_verified_locations.sql`은 사용자 검토 후 사용자가 직접 적용했다. 두 행만 갱신하며 값 충돌·이름 불일치·ID 누락이면 전체 rollback한다. 기존 테이블/RLS/인증/리뷰/즐겨찾기/평점 로직과 기존 JSON·seed는 보존했다. `source_url`의 기존 값과 전체 상세검증 날짜를 보존하고, pending은 partial로만 변경한다. 실제 공개 조회 결과는 **20곳 / 검증 기록 2곳 / DB 일치 2곳 / 지도 제외 18곳**이다.

## 생성·수정 파일

| 구분 | 파일 |
|---|---|
| 신규 위치 기록 | `data/restaurant-locations.json` |
| 신규 SQL | `supabase/migrations/202610280003_verified_locations.sql` |
| 신규 지도 로직 | `src/lib/maps/locations.ts`, `state.ts`, `sdk.ts`, `controller.ts`, `naver-types.ts` |
| 신규 화면/UI | `src/app/map/page.tsx`, `src/components/map-explorer.tsx`, `naver-map.tsx`, `view-link.tsx` |
| 기존 연결 수정 | `src/components/site-header.tsx`, `restaurant-explorer.tsx`, `src/app/restaurants/[id]/page.tsx`, `src/proxy.ts` |
| 신규 검사 | `tests/maps.test.mjs`, `maps-sdk.test.mjs`, `locations-database.test.mjs`, `scripts/check-locations.mjs` |
| 기존 검사/설정 | `tests/browser-smoke.mjs`, `tests/http-smoke.mjs`, `package.json`, `.env.example` |
| 신규 문서 | `docs/phase5-plan.md`, `phase5-db-review.md`, `phase5-location-audit.md`, `maps-setup.md`, 본 보고서 |
| 문서 갱신 | `README.md`, `docs/spec.md`, `implementation-plan.md`, `restaurant-data.md`, `development-log.md` |

기존 미커밋 작업을 보존했다. `data/restaurants.json`, v2 보존본, 초기 seed와 기존 migration은 변경하지 않았다. 지도용 새 패키지를 설치하지 않았으며 기존 Next16.4.3·React19·Supabase JS2.118.0/SSR0.12.7을 유지했다.

## 실제 실행한 검증

| 명령/검사 | 결과 |
|---|---|
| `npm.cmd test` | **69/69 통과**: 기존57 + 위치/URL3 + SDK/controller5 + 위치SQL4 |
| `npm.cmd run lint` | 통과, 종료코드0 |
| `npm.cmd run typecheck` | next typegen + tsc --noEmit 통과 |
| `npm.cmd run build` | 통과, `/map` 포함 동적 서버 렌더링 및 proxy |
| `npm.cmd run db` | 실제 Supabase 식당20곳 ID·이름·응답형식 통과 |
| `npm.cmd run db:locations` | 실제 DB 두 위치와 공식 레지스트리 일치 |
| HTTP/인증 HTTP | 홈20카드·상세20곳·URL AND·404, 로그인/가입·보호 마이페이지·안전한 next·위조세션 거부 통과 |
| 전체 Edge 회귀 | 검색·종류·초기화·빈 결과·URL reload·상세-back·20상세·375/1280 배치 통과. 인증 폼·서버 입력 검증·CSRF 및 공개 리뷰 영역도 통과 |
| 실제 NAVER 강제 검사 | `REQUIRE_REAL_MAP=1`로 실제 SDK ready, 정상 지도 타일 이미지, 검증 마커 수, 목록 선택 정보창, 실제 마우스 마커 클릭→선택/URL 동기화 통과 |
| 초기 SPA 진입/왕복 | 홈에서 링크로 처음 지도 진입해 인증·로딩 성공. 검색 후 카드 목록→지도 복귀, URL/종류/검색 유지 통과 |
| 의도적 SDK 차단 | CDP로 NAVER script URL만 차단하여 오류 안내·지도 목록/검색 지속 동작 통과. 실제 정상 검사와 별도 실행 |

실제 브라우저 검사는 `http://127.0.0.1:3000`에서 수행했다. `localhost` 별도 도메인의 실API 검사는 수행하지 않았다. 모의 SDK 검사에서는 키 누락·네트워크·인증·시간 초과·늦은 인증 실패·재시도 경쟁·리소스 정리를 검증했다. 실제 인증 실패를 만들기 위해 사용자 키를 바꾸지는 않았다.

로컬 PGlite SQL 검사는 기존 데이터 보존, 충돌 시 원자적 rollback, 잘못된 식당명/누락 ID 거부, 재실행 시 값·updated_at 불변을 확인했다. 원격 SQL 실행은 에이전트가 하지 않았다.

실행 화면은 `.next/phase5-checks/map-ready-375.png`, `map-ready-1280.png`에 생성했고, 실패 화면은 `map-error-375.png`, `map-error-1280.png`로 분리했다. 실제 모바일 지도 이미지도 열어 확인했다. 생성물은 Git 제외다.

## 오류와 해결

1. 초기 지도 크기 또는 모바일 숨김 전환에서 이벤트 알림만으로 크기가 갱신되지 않는 문제를 독립 리뷰에서 발견했다. 양수 실제 크기를 `setSize`로 전달하고 `ResizeObserver` 및 ready 후 크기 반영으로 수정했다.
2. 제거된 이전 script의 늦은 오류가 새 재시도를 거부하는 문제를 mock으로 재현했다. 로드 세대 검사와 회귀 실패→통과로 수정했다.
3. 실제 마커 검사의 합성 `.click()`은 선택 동기화 시간 초과를 일으켰다. 마커를 화면 안에 배치하고 CDP의 실제 마우스 이동·누름·뗌으로 검사하자 통과했다. 이 실패를 API 정상으로 숨기지 않았다.
4. `/map`의 사전 렌더링 시도에서 요청 전용 조회가 잘못된 전송 오류처럼 로그에 남아, 요청 시 동적 렌더링을 명시했다. 최종 build는 해당 로그 없이 통과했다.
5. 기존 HTTP 검사의 '모든 위치 NULL' 가정은 검증된 위치 링크 또는 미확인 안내를 각각 검증하도록 수정했다. 초기 JSON과 로컬 seed 자체는 보존했다.

기존 Node 모듈 유형 경고와 Windows 줄바꿈 안내는 남아 있으나 검사는 통과했다. 새로운 실제 API 오류를 미해결 상태로 숨기지 않았다.

## 설정·보안 및 남은 항목

[지도 설정 안내](./maps-setup.md)에 현재 Cloud 신청·Web Dynamic Map·허용 URL·공개 Key ID·한도·공식 문서를 기록했다. 사용자 설정으로 실제 API가 동작하며 추가 필수 설정은 없다. 운영 도메인/요금·사용량 한도는 배포 전에 사용자가 검토해야 한다. 유료 설정·한도 상향은 에이전트가 하지 않았다.

NAVER 로고·저작권 기본 컨트롤을 유지했다. `/map`에서만 도메인 인증에 필요한 origin referrer를 허용하고 이메일 인증 페이지의 no-referrer는 유지한다. Client Secret·서비스 역할 키를 추가하지 않았고 `.env.local`의 Git 제외를 확인했다.

남은 것은 18곳의 추가 수동 위치 확인이다. 실제 영업·폐업·이전 여부와 미확인 상세 정보도 계속 검증 대상이다. 이 단계에서 실제 계정으로 회원가입·로그인·리뷰·즐겨찾기 쓰기를 다시 수행하지 않았으며 기존 자동/읽기 전용 회귀와 구분한다. 기존 데이터와 충돌하는 후속 위치 변경은 별도 검토한다.

## AI 도구 사용

- Superpowers using-superpowers·writing-plans·TDD·디버깅·verification-before-completion 지침에 따라 계획·실패 테스트·독립 조사·수정·실제 검증을 수행했다.
- Context7: NAVER v3 ID resolve 후 인증/스크립트·마커/정보창·이벤트 query, Next.js resolve 후 클라이언트 script query. 공식 Cloud·NAVER 원문 및 서울관광 원문도 열람했다. 설치Next scripts 문서를 교차 확인했다.
- Cavecrew: 네이티브 preset 대신 일반 Codex 서브에이전트에 위치 investigator 2명, 코드 investigator/작은SQL builder, 최종 reviewer 역할을 부여했다. 실제 웹 조사·원문 확인·SQL 테스트·재시도/크기 결함 리뷰·수정 후 재검토를 수행했다.

Git commit·push·Vercel 배포 및 Phase6는 수행하지 않았다. 사용자 검토를 기다린다.
