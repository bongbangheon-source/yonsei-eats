# 연세잇츠 최종 과제 제출 자료

작성일: 2026-10-28. **현재 문서는 배포 전 제출 준비본이다. 실제 Vercel URL 및 운영 검사가 확정되면 해당 항목을 갱신한다.**

## 제출 링크와 상태

| 항목 | 현재 상태 |
|---|---|
| GitHub | https://github.com/bongbangheon-source/yonsei-eats — 저장소 존재·계정 권한 확인, 업로드 승인 대기 |
| 최종 Vercel URL | 미확정, 임의 도메인을 최종 URL로 기재하지 않음 |
| 배포 환경 변수 | 설정 대기. 실제 값은 제출 문서에 포함하지 않음 |
| 운영 도메인 인증 | 배포 URL 확정 후 Supabase/NAVER 설정 및 실제 검사 필요 |
| 로컬 배포 전 검사 | Node24.22.1, 테스트69개/lint/typecheck/build/DB조회3회 통과 |

기계 판독 결과는 [preflight-results.json](./preflight-results.json), 실제 운영 결과는 [production-tests.md](./production-tests.md)에 별도로 기록한다.

## 서비스와 주요 기능

연세잇츠는 연세대학교 신촌캠퍼스 주변 식당을 탐색하는 웹앱이다. 승인된 식당20곳을 음식 종류와 이름으로 검색하며, 상세 페이지에서 현재 확보된 정보와 실제 리뷰를 확인한다.

- 목록: 반응형 카드, 이름·종류 AND 검색, 결과수·빈상태·초기화, URL 상태 유지.
- 인증: Supabase 이메일·비밀번호 가입/로그인, 이메일 확인, 공식 SSR 쿠키 세션, 본인 프로필·닉네임·마이페이지.
- 리뷰: 1~5점/본문/실제 태그, 본인 수정·삭제, 같은 사람의 반복 리뷰. 평균에는 사용자별 최신 리뷰1건만 반영한다.
- 즐겨찾기: 계정별 추가·해제·지속 상태 및 마이페이지 목록. 중복 요청을 멱등 처리한다.
- 지도: 실제 NAVER SDK, 검색·목록/마커 선택·URL 연동, PC 동시 보기·모바일 전환. 공식 위치2곳만 마커로 표시한다.

가격·영업시간·사진 등 미확인 값은 NULL과 '정보 확인 중'을 사용한다. 자체 리뷰가 없으면 '아직 리뷰 없음'으로 표시한다. 가짜 리뷰·별점·거리·위치는 생성하지 않았다. Google/NAVER OAuth 계획은 취소하고 이메일 인증으로 변경했다.

## 사용 기술과 구조

Next.js16.4.3 App Router, React19.3.1, TypeScript, Tailwind CSS4, Supabase PostgreSQL/Auth, Supabase JS2.118.0/SSR0.12.7, NAVER Maps JavaScript API v3를 사용한다. Node24.x를 배포 런타임으로 고정했다. GitHub/Vercel은 최종 업로드·배포 대상으로 사용한다.

서버 컴포넌트에서 Supabase 데이터를 조회하고, 서버 액션에서 인증된 사용자 ID를 검증한다. 상호작용 UI와 지도는 클라이언트 컴포넌트로 분리한다. 단순 쿠키 내용이나 localStorage를 사용자 권한의 근거로 삼지 않는다.

## DB 및 RLS

| 테이블 | 역할 및 보안 |
|---|---|
| profiles | auth.users ID 연결. 본인 생성·조회·수정만 허용 |
| restaurants | 식당20곳. 공개 조회, 일반 사용자 수정 금지 |
| menus | 식당 메뉴/가격, 미확인 NULL. 공개 조회, 일반 수정 금지 |
| reviews | 공개 조회, 검증된 본인만 작성·수정·삭제. 별점/본문 CHECK |
| review_tags | 실제 태그 정의. 공개 조회, 일반 사용자 추가 금지 |
| review_tag_links | 리뷰와 태그 연결. 해당 리뷰 소유자만 쓰기 |
| favorites | 사용자/식당 복합키로 중복 방지. 본인만 조회·추가·삭제 |

restaurant_ratings/catalog는 created_at DESC/id DESC로 사용자별 최신 리뷰를 집계한다. 최신 리뷰 삭제 시 남은 이전 리뷰가 다시 반영된다. 총 리뷰수와 참여자수를 구분하고 리뷰가 없으면 평균은NULL이다.

save_review SECURITY INVOKER RPC가 리뷰와 태그를 한 트랜잭션으로 저장하며, 제출UUID로 재전송 중복을 방지한다. 공개 닉네임 뷰는 공개 리뷰 작성자의 review_id/display_name 두 열만 노출하는 의도적인 최소 조회 경로다. profiles 자체의 본인 RLS는 유지한다. 서비스 역할 키는 사용하지 않는다.

Phase6에서는 기존 스키마·RLS·식당·사용자 데이터를 변경하지 않는다. 상세 SQL은 `supabase/migrations/`와 Phase2/4/5 검토서를 참조한다.

## 데이터 검증

승인된20곳의 ID·식당명을 유지했다. 정육면체를 제외하고 오천집 신촌점·더도이축산직영점 신촌점을 포함한다. 공식 서울관광 원문에서 소바연구소·꼬숑돈까스2곳의 주소·좌표를 확인했으며, 나머지18곳은 공식좌표 미확보·다른지점·주소충돌 등의 사유로 지도에서 제외했다. 이는 현재 영업 상태 전체를 검증했다는 뜻이 아니다.

출처와 확인일, 보류 사유는 [위치 확인 기록](../phase5-location-audit.md) 및 [식당 데이터 정책](../restaurant-data.md)에 있다.

## 주요 화면

현재 첨부물은 **로컬에서 실제 실행한 화면**이다. Vercel 운영 화면으로 표시하지 않는다. 원본 환경 구분은 [manifest.json](./screenshots/manifest.json)에 남겼다.

| 화면 | 파일 |
|---|---|
| 홈 PC | [home-desktop.png](./screenshots/home-desktop.png) |
| 홈 모바일 | [home-mobile.png](./screenshots/home-mobile.png) |
| 상세 모바일 | [detail-mobile.png](./screenshots/detail-mobile.png) |
| 로그인 모바일 | [login-mobile.png](./screenshots/login-mobile.png) |
| 회원가입 PC | [signup-desktop.png](./screenshots/signup-desktop.png) |
| 실제 NAVER 지도 PC | [map-desktop.png](./screenshots/map-desktop.png) |
| 실제 NAVER 지도 모바일 | [map-mobile.png](./screenshots/map-mobile.png) |

로그인된 마이페이지·본인 리뷰 작성 화면의 제출용 캡처는 아직 없다. 운영 계정으로 직접 캡처할 경우 이메일 등 개인정보를 가리고 별도로 추가한다.

## AI 활용과 프롬프트 개선

AI에게 일괄 구현을 맡기지 않고 Phase별 범위·승인·테스트·완료 조건을 지정했다. Superpowers의 계획/TDD/디버깅/검증 지침, Context7의 현재 공식 문서, Cavecrew 역할을 부여한 일반 서브에이전트의 조사·작은 변경·독립 리뷰를 사용했다. 실제 호출과 실패는 [개발 로그](../development-log.md)에 기록했다.

실제 요청에서 나타난 개선 사례:

| 요청의 개선 | 구현·검증에 미친 영향 |
|---|---|
| 도구 이름만 요구하는 초기 요청 → 설치·연결·실제 호출과 실패를 구분하도록 명시 | 존재하지 않는 preset을 사용했다고 하지 않고 일반 agent 역할 사용을 기록 |
| 식당 목록 승인 →20곳 유지·NULL 존중·출처/날짜와 지도 검증 분리 | 불완전한 데이터를 버리거나 가짜 좌표로 채우는 일을 방지 |
| DB 점검 성공이라는 결과 → Next 웹은 실패한다는 구체 재현을 함께 제시 | 동일 코드의 프로세스 네트워크 권한 차이를 찾아 EACCES 해결 |
| 리뷰 CRUD 요구 → 반복 리뷰·사용자별 최신 평균·삭제 시 이전 리뷰 복귀를 명시 | DB 집계와 원자 저장·RLS 부정 테스트의 기준이 명확해짐 |
| 지도 구현 요구 → 실제 API 로딩 전에는 정상이라고 보고하지 말 것을 명시 | 모의 SDK, 실제 SDK·타일·마커 클릭, 실제 오류 차단 검사를 분리 |
| 배포 요청 → commit/push/외부 설정 승인·미실행 검사의 미완료 표시 명시 | 로컬 준비 성공을 실제 운영 배포 성공으로 오인하지 않도록 구분 |

## 오류와 해결

- Windows SWC 파일 잠금으로 npm ci가 실패한 사례: 해당 프로젝트 서버 종료와 설치 성공 확인 후 실행하도록 안내했다.
- 독립 DB 성공/Next 실패: 안전한 오류명·코드 진단으로 EACCES를 확인하고 네트워크 허용 환경에서 같은 서버를 재시작했다.
- 인증 next 경로 검증이 정상 검색어 공백까지 차단: 경로와 쿼리 검사를 분리하고 실패→통과 회귀 테스트를 추가했다.
- RPC가 탭·개행만 있는 본문을 허용: DB 비공백 조건을 추가하고 실제 로컬 PostgreSQL로 검증했다.
- SDK 재시도의 이전 script 오류가 새 요청을 거부: 로드 세대 검사로 수정했다.
- 지도 숨김/크기 갱신: 실제 setSize와 ResizeObserver 적용 후 타일·마커를 검사했다.
- 합성 marker.click 검사의 시간 초과: 화면 내 마커에 실제 마우스 입력을 보내 동기화를 확인했다.

## 테스트 증거와 한계

Node24.22.1 배포 전 검사에서 자동테스트69개·lint·typecheck·build와 실제 공개DB조회3회가 통과했다. 로컬 PostgreSQL fixture·모의 Auth/SDK·실제 공개DB·실제 NAVER지도 검사는 각각 범위가 다르다.

이전 Phase에서 사용자는 실제 리뷰/즐겨찾기/마이페이지 정상 동작을 직접 확인했다. 에이전트의 직접 계정 쓰기 또는 실제 Vercel 사이트 검사로 바꾸어 기록하지 않는다.

현재 미완료/미검증:

- 승인 후 Git commit/push 및 실제 Vercel 배포, 운영 환경 변수·도메인 연결.
- 실제 운영 사이트의 가입 메일·세션·본인 리뷰/즐겨찾기와 전체 운영 검사.
- 원격 두 계정으로 타인 데이터를 변경하려는 RLS 부정 검사.
- 실제 태그 정의가0건이므로 태그 선택/교체의 원격 통합 검사.
- 나머지18곳 위치·영업 상태 및 미확인 상세정보.

기존 이력의 작성자 이메일·구형 PDF 로컬경로는 사용자에게 설명한 뒤 이력 보존/공개 허용을 받았다. 실제 값을 새 제출 문서에 복사하지 않았다. 현재 후보 및 과거 blob/ZIP 감사에서 실제 환경값·개인키·토큰 노출은 발견하지 않았다.
