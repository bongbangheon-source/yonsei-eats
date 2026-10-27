# 연세잇츠(Yonsei Eats) 프로젝트 명세

## 현재 Phase 6 — 배포·제출 준비

사용자 Phase6 지시에 따라 기존 기능을 보존하며 GitHub `bongbangheon-source/yonsei-eats`, Vercel Next.js/Node24.x 배포와 제출 자료를 준비한다. commit/push/외부연결/운영설정은 승인 후 수행한다. DB테이블·데이터·RLS 변경은 하지 않는다. 실제 운영 URL/환경설정/검사 결과는 [제출 자료](./submission/final-report.md)와 [운영 검사 기록](./submission/production-tests.md)에 별도로 기록하며 미실행은 미검증으로 표시한다.

## 현재 Phase 5 정책 — 2026-10-28

사용자Phase5지시로NAVER Maps 기반 `/map`을 구현한다. 기존Phase1~4·식당20곳의ID/원본JSON/seed·인증/리뷰/즐겨찾기/평점뷰를유지한다. 지도목록은기존이름/정확한category검색, q/category/selected/view URL상태와목록↔지도전환을지원한다. PC동시보기·모바일전환,실패시목록계속사용.

지도마커는위치전용레지스트리verified와DB이름/주소/좌표가정확일치하는식당만허용한다. 공식서울관광에서소바연구소·꼬숑돈까스2곳주소/좌표확인,다른18곳보류. 전반상세verifiedAt/영업확인으로확대해석하지않는다. 출처/날짜/충돌은[phase5-location-audit.md](./phase5-location-audit.md),별도SQL은[phase5-db-review.md](./phase5-db-review.md),설정은[maps-setup.md](./maps-setup.md)를따른다. 사용자가SQL과키설정을완료한후실제공개DB·SDK·지도타일·마커클릭검사를수행한다. 실제로딩없으면정상으로보고하지않는다. Phase6·배포는진행하지않는다.

## 현재 Phase 4 정책 — 2026-10-28

이 절이 과거 단계의 범위 제한보다 우선한다. 실제 Supabase 리뷰 작성·조회·본인 수정/삭제·실제 태그, 카드/상세 즐겨찾기, 마이페이지 본인 리뷰/즐겨찾기를 구현한다. 평균은 기존 restaurant_ratings/catalog의 사용자별 최신1건 집계만 사용하며 총 리뷰 수와 참여자 수를 구분한다. 목록은 모든 리뷰를 최신순(created_at DESC,id DESC)으로 20건 페이지 탐색한다.

권한은 Phase 3의 getUser 검증 사용자와 기존 RLS를 재사용한다. 클라이언트 user_id는 신뢰하지 않는다. 리뷰 별점1~5 정수·본문1~5000자·실제 태그최대10개를 검사하고, 태그를 임의 생성하지 않는다. 리뷰와 태그 변경은 신규 save_review SECURITY INVOKER RPC로 한 트랜잭션 저장한다. 제출 UUID를 재시도에 재사용해 중복등록을 막으며 같은 사용자의 별도 리뷰는 새 UUID로 허용한다.

즐겨찾기는 명시적 추가/해제와 기존복합PK·중복무시 삽입을 사용한다. 빠른 재제출은 pending/ref로 막고 오류도 실제 상태를 재조회한다. 리뷰 저장/삭제의 응답 실패도 페이지를 재검증한다. 본문·닉네임·태그는 React 텍스트만 표시하며 HTML 주입하지 않는다. 실제 데이터가 없으면 빈 상태, 조회 실패는 오류로 구별한다.

기존 profiles RLS는 유지한다. 공개 리뷰 닉네임에 한정한 owner view review_author_names(review_id,display_name)와 reviews INSERT(id) 권한 보완은 별도 SQL 승인 대상이다. 자세한 변경/개인정보 공개 범위는 [phase4-db-review.md](./phase4-db-review.md), 작업은 [phase4-plan.md](./phase4-plan.md)를 따른다. 실제 적용 전에는 리뷰 쓰기 준비 안내를 표시한다. 로컬 자동 검사와 원격 인증 계정의 쓰기/RLS 검사는 구분한다. 지도·배포·Phase 5는 진행하지 않는다.

작성일: 2026-10-27 (Asia/Seoul). Phase 0/1 승인·구현 후, 2026-10-28 사용자 지시로 Phase 2 로컬 구현·검증을 승인받았다. 실제 Supabase migration/seed 적용은 별도 승인 대상이다.

## 목적과 범위

연세대학교 신촌캠퍼스 주변 교외 식당을 검색하고 조건으로 비교하는 반응형 웹앱이다. 가격·음식 종류·자체 리뷰 평점으로 식당을 찾고 네이버 지도로 위치를 확인한다. 로그인 회원은 리뷰와 즐겨찾기를 관리한다.

이번 Phase 0 산출물은 Next.js App Router + TypeScript + Tailwind CSS + ESLint 초기화, 외부 설정 없이 실행되는 한국어 기본 화면, 기본 디렉터리, README, .gitignore, .env.example, 본 명세, 구현 계획, 개발 기록이다. lint와 production build를 검증한다. DB·OAuth·지도·식당 검색 기능은 구현하지 않는다. 실제 배포나 유료 서비스 설정도 하지 않는다.

## 접근 방식

1. **최소 초기화 — 사용자 선택(2026-10-27):** UI 실행 기반과 문서만 준비하고 Supabase·지도 SDK는 해당 구현 단계에서 설치한다. 현재 불필요한 의존성과 비밀 키를 요구하지 않는다.
2. 연동 SDK 선설치: 다음 단계 준비가 조금 빠르지만 현재 검증할 수 없는 의존성과 설정이 늘어난다. 이번에는 선택하지 않았다.

Phase 0 기본 화면은 서비스명, 간단한 소개, 식당 데이터 준비 안내를 표시한다. 동작하지 않는 로그인·검색·지도 버튼이나 가상의 식당 카드는 만들지 않는다. 폰트는 시스템 글꼴로 빌드 중 외부 폰트 다운로드를 피한다. 상세 시각 디자인은 Phase 1에서 검토한다. 이후 데이터 정책 변경으로 승인된 20곳을 초기 등록 대상으로 확정했지만 이번 데이터 정리에서는 화면 코드를 변경하지 않는다.

## 기술 선택과 호환성

2026-10-27 npm 레지스트리 실제 조회 결과:

| 항목 | 조회 결과 | 적용 범위 |
|---|---|---|
| Next.js / create-next-app | 16.4.3 / 16.4.3; Node >=20.9.0 | Phase 0 설치 후 lockfile로 실제 버전 기록 |
| React | 19.3.1; Next는 ^19.0.0 허용 | 초기화 결과로 확정 |
| Tailwind CSS | 4.3.3 | v4 PostCSS 방식 |
| Supabase JS | 2.118.0; Node >=22.0.0 | 아직 설치하지 않음 |
| Supabase SSR | 0.12.7; JS ^2.114.0 요구 | 아직 설치하지 않음 |
| 로컬 Node / npm | 26.7.0 / 11.19.0 | 현재 검증 환경 |

Vercel 공식 문서가 안내하는 기본 Node는 24.x이다. 로컬 Node 26 검증만으로 배포 호환성을 확정하지 않는다. 목표 런타임은 Node 24 LTS(.nvmrc)이며 OS 전역 Node를 임의로 변경하지 않는다. Node 24 재검증은 배포 전 필수이다. Next.js 16에서는 next lint가 제거되어 ESLint CLI와 next build를 각각 실행한다. 초기 UI에는 비즈니스 로직이 없어 불필요한 단위 테스트 프레임워크를 추가하지 않는다. 이후 동작 구현은 실패 테스트부터 작성한다.

초기화 중 확인된 차이: create-next-app 16.4.3 템플릿은 Tailwind의 @tailwindcss/turbopack 로더를 사용한다. Context7의 PostCSS 예제와 차이가 있어 생성된 구성과 설치 문서를 확인하여 적용한다. 초기화 시 선택되지 않은 cacheComponents/partialPrefetching 옵션은 최소 구성에서 제외한다. 이 변경은 외부 기능 추가나 인증 설계 변경이 아니다.

## MVP 수용 조건

- 정문·신촌역·서문·연희동 일부의 교외 식당 20곳. 개인 식당 중심 18곳, 프랜차이즈 최대 2곳.
- 교내 식당·햄버거 전문점·담산 신촌 제외. 더도이축산직영점 신촌점 필수 포함.
- 식당명·메뉴 검색, 가격·종류·평점 복합 필터, 상세 페이지, 카드 중심 홈.
- 목록·지도 전환에도 동일 검색·필터 유지. 지도 마커와 네이버 외부 길찾기 제공.
- Supabase 이메일·비밀번호 회원가입/로그인, 본인 리뷰 수정·삭제, 계정별 즐겨찾기·마이페이지. Google·네이버 OAuth는 2026-10-28 사용자 지시로 취소했다.
- 텍스트 리뷰, 1~5점 정수 별점, 사전 정의된 추천 태그. 같은 사용자의 동일 식당 여러 리뷰 허용.
- 평균 평점에는 각 사용자별 최신 리뷰 한 건만 반영. 리뷰가 없으면 NULL과 '아직 리뷰 없음'을 사용하며 0점으로 저장하거나 표시하지 않는다.
- PC 다열·모바일 한 열. 배경 #FFFFFF, 네이비 #142B50, 블루 #3276DC, 보조 배경 #F1F5F9. 둥근 카드·충분한 여백·접근 가능한 입력과 포커스.
- Supabase RLS 및 Vercel 배포. 실제 배포는 사전 승인 필요.

사진 업로드, 키워드 추출, 맞춤·랜덤 추천, 종합 추천 점수, 관리자, 식당 제보 승인, 할인 정보는 2차 기능이며 MVP에서 제외한다.

## 데이터 정책 — 2026-10-27 사용자 최종 변경

사용자가 승인한 `data/yonsei-eats-restaurants-v2.json`의 식당 **20곳 모두**를 초기 등록 대상으로 사용한다. 정육면체는 제외하고 오천집 신촌점을 포함한다. ID·식당명·음식 종류는 v2를 승계하고 임의의 식당을 추가/교체하지 않는다. 활성 초기 데이터는 `data/restaurants.json`, 원본 v2는 보존 이력이다. 식당별 후속 검증은 [restaurant-data.md](./restaurant-data.md)에 기록한다.

**초기 등록 승인과 상세 검증은 분리한다.** 상세 검증은 개발 완료 후 별도 진행한다. v3 검증 현황, v4의 3곳 제한, 주소/영업 상태/출처 미확인에 따른 게시 보류는 더 이상 초기 등록 기준이 아니다. 현재 저장소에는 v3/v4 파일이나 해당 로더가 없으므로 제거 작업을 수행했다고 주장하지 않는다. 미검증 식당도 카드·이름 검색·종류 필터·상세 조회 대상에 포함하며 `verificationStatus`로 전체 식당을 차단하지 않는다.

확인되지 않은 주소·위도·경도·메뉴·대표 가격·영업시간·사진·현재 영업 상태와 검증 완료 날짜는 `null`로 저장한다. 원본 주소와 포괄적 `verifiedAt`은 필드별 근거가 충분하지 않아 활성 데이터에 사실로 복사하지 않고 원본에 보존한다. 참고 출처 링크는 유지하되 출처 확인 완료를 의미하지 않는다. 검증 체크리스트에서 필드별 출처 URL·실제 확인일·상태를 후속 갱신한다. 프랜차이즈 여부도 재확인 전 `null`이며 원본의 잠정 분류는 보존본에서만 참조한다. 개인 식당 18곳·프랜차이즈 최대 2곳 등 기존 구성 목표는 후속 검토 항목이고, 현시점 충족을 단정하거나 20곳을 임의 교체하지 않는다.

UI는 미확인 항목에 '정보 확인 중'을 표시하거나 해당 항목을 숨긴다. 영업 상태를 확인하지 않았으면 '영업 중'이라고 표시하지 않는다. 유효한 위도·경도 쌍이 없는 식당은 마커를 만들지 않고 '위치 확인 중'으로 안내하며 카드·상세는 유지한다. 자체 평점에 외부 평점을 섞지 않으며 자체 리뷰가 없으면 '아직 리뷰 없음'으로 표시한다. 이번 변경은 데이터와 문서만 정리하며 UI·DB seed·외부 API 기능은 구현하지 않는다.

구현 계약: 기본 목록은 승인된 20곳 모두를 대상으로 한다. 이름 검색은 미확인 메뉴와 무관하게 동작하고 메뉴 검색은 확인된 메뉴 값만 사용한다. 숫자 가격 범위 필터는 확인된 대표 가격만 비교하며 미확인 가격을 0원으로 처리하지 않는다. 가격 조건 미선택 시 미확인 가격의 식당도 목록에 포함한다. 평점 최솟값 필터를 켜면 자체 리뷰 없는 식당은 숫자 평점 조건에 일치하지 않는다. 범위 경계는 원 단위 정수·양끝 포함으로 정의하는 제안이며 구체 구간은 구현 단계에서 확정한다. 검색·필터·보기 상태는 URL query로 보존한다. 추천 태그 목록과 텍스트 길이 제한은 기능 구현 전 사용자 검토 대상이다.

## 데이터 모델 및 권한 설계안

모든 public 테이블에 RLS를 활성화한다. 공개 조회와 소유자 전용 쓰기를 구분하고 service role은 브라우저에 전달하지 않는다.

| 테이블 | 키·참조·역할 | 접근 정책 |
|---|---|---|
| profiles | id UUID PK -> auth.users.id; 공개 표시명만 저장 | 본인 조회·수정; 공개 리뷰에는 필요한 표시명만 안전한 조회 경로로 제공 |
| restaurants | id PK; 이름·주소·좌표·종류·확인된 대표 가격·출처 | 공개 읽기; 일반 사용자 쓰기 금지 |
| menus | id PK; restaurant_id FK; 메뉴명·가격·출처 | 공개 읽기; 일반 사용자 쓰기 금지 |
| reviews | id PK; restaurant_id FK; user_id FK; text; rating CHECK 1..5; created_at/updated_at | 공개 읽기; INSERT/UPDATE/DELETE 본인만; WITH CHECK로 소유자 위조 금지 |
| review_tags | id PK; 고유 태그명 | 공개 읽기; 일반 사용자 쓰기 금지 |
| review_tag_links | (review_id, tag_id) 복합 PK와 FK | 공개 읽기; 연결된 리뷰 소유자만 생성·삭제 |
| favorites | (user_id, restaurant_id) 복합 PK와 FK | 본인만 읽기·추가·삭제 |

user_id, restaurant_id 등 FK 조회·RLS 경로를 인덱싱한다. 리뷰는 (restaurant_id, user_id, created_at DESC, id DESC) 인덱스를 검토한다. 즐겨찾기는 사용자 순서 복합 PK와 식당 FK 인덱스를 사용한다. 삭제 연쇄 범위는 migration별 명시하고 파괴적 변경은 승인 후 수행한다.

평점의 '최신'은 **작성 시각 created_at DESC, 동률이면 id DESC**로 결정하는 제안이다. 수정만으로 과거 리뷰가 최신이 되지 않는다. 서버가 created_at과 소유자를 고정하고 UPDATE로 변경할 수 없게 DB 수준에서도 제한한다. 최신 리뷰 삭제 시 이전 리뷰가 집계에 복귀한다. 최신 리뷰 선별 후 AVG(rating)와 기여 사용자 수를 산출하고 화면 반올림은 표시 계층에서 한다. 총 리뷰 수와 기여 사용자 수를 구분한다. 이 의미는 Phase 2 전 확인 대상이다.

집계 view는 security_invoker 또는 검증된 최소 권한 함수로 RLS 우회를 방지한다. 익명·사용자 A·사용자 B별 SQL 테스트로 우회 여부를 확인한다. 리뷰·태그 링크는 단일 트랜잭션으로 저장한다. 일반 사용자가 reviews.user_id/restaurant_id/created_at을 수정해 집계를 조작하는 것도 금지한다.

## 인증 설계와 위험 — 현재 Phase 3 정책

2026-10-28 사용자 지시가 아래 OAuth 검토 이력보다 우선한다. OAuth는 구현하지 않으며 Supabase 이메일·비밀번호와 @supabase/ssr 0.12.7을 사용한다. `/signup`, `/login`, `/mypage`, `/auth/confirm`과 Next.js 16 `src/proxy.ts`를 구현한다. 이메일 형식·비밀번호 최소8자/확인·닉네임2~20자 검증. 기존 계정 로그인은 가입 시의 길이 제한을 새로 강제하지 않는다.

서버는 `auth.getUser()`의 검증된 ID로만 권한을 판단한다. SSR 쿠키는 공식 getAll/setAll 어댑터와 proxy 갱신을 사용하며 SameSite=Lax·HttpOnly·운영 HTTPS Secure 설정과 private no-store 응답을 적용한다. 비밀번호·원시 인증 오류·키·토큰을 로깅하지 않는다. 이메일 확인 URL의 개발 요청 로그도 제외한다. 변경은 same-origin POST Server Actions로 제한하며 복귀 URL은 검증한 내부 경로만 허용한다.

프로필은 이메일 인증 여부와 관계없이 첫 검증 세션이 확보된 후 사용자 권한으로 생성한다. metadata.display_name은 표시용 입력이며 권한 근거가 아니다. 중복 무시 upsert 후 본인 SELECT로 기존 닉네임을 덮어쓰지 않는다. 기존 사용자의 프로필 누락·생성 오류는 마이페이지에서 재시도한다. SQL/트리거/RLS 변경은 필요하지 않다. 이메일 확인이 필요한 가입 응답은 실제 세션이 없으면 로그인으로 표시하지 않는다.

이메일 확인 링크 GET은 확인 화면만 표시하고 POST에서 verifyOtp를 수행한다. Google/NAVER·리뷰 작성·즐겨찾기·지도·배포는 이번 범위 밖이다. 실제 계정 통합은 사용자가 수신 가능한 이메일로 직접 확인하며 미실행 항목은 보고서에서 미검증으로 표시한다. 설정은 [auth-setup.md](./auth-setup.md), 작업 계획은 [phase3-plan.md](./phase3-plan.md)를 따른다.

### 과거 OAuth 타당성 검토 이력 — 취소됨

Google은 Supabase의 공식 소셜 제공자 경로를 사용한다. Google Console에 Supabase가 제시하는 callback을 등록하고 Supabase에는 앱의 허용 redirect URL을 등록한다. 두 callback을 혼동하지 않는다. Next.js 서버·브라우저 클라이언트를 분리하고 @supabase/ssr의 cookie 흐름을 사용한다. 세션 쿠키 존재만으로 권한을 판단하지 않고 검증된 사용자·claims와 DB RLS를 함께 사용한다.

네이버는 Supabase 내장 제공자라고 가정하지 않는다. 최신 공식 문서는 custom OAuth2 제공자 생성과 custom: 식별자를 안내한다. 후보는 authorization=https://nid.naver.com/oauth2.0/authorize, token=https://nid.naver.com/oauth2.0/token, userinfo=https://openapi.naver.com/v1/nid/me 이다. 네이버 응답의 사용자 필드는 response.id·response.email 안에 있으므로 Supabase의 필드 추출/매핑 지원과 실제 callback 처리를 검증해야 한다. 네이버를 OIDC 제공자로 가정하지 않는다.

Supabase custom provider는 기본 PKCE 활성화이나 네이버 호환성은 아직 검증하지 않았다. 계정 동의 거부·이메일 미제공·state 변조·callback 재사용·로그아웃·중복 계정/연결 정책도 테스트한다. 이메일 문자열만으로 수동 계정 병합이나 가짜 이메일 사용자 생성은 하지 않는다. 표준 custom OAuth2로 불가능하면 검증된 중개/커스텀 방식의 별도 설계와 승인을 받는다. 설정 변경·PKCE 완화·세션 발급 우회는 임의로 하지 않는다. SDK나 호스팅 플랜의 실제 기능 가용성도 Phase 5에서 재확인한다.

## 지도 및 환경 변수

NAVER Maps JavaScript API v3 공식 로딩 예제는 ncpKeyId를 사용한다. 브라우저용 Key ID는 공개될 수 있으므로 등록 도메인·사용량 제한을 설정한다. 지도 Client Secret을 브라우저에 넣지 않는다. 지도는 Client Component에서만 로딩하며 실패 시 목록을 계속 사용할 수 있게 한다. 외부 길찾기는 검증된 좌표·이름을 URL 인코딩하고 PC/모바일 목적지를 검증한다.

Phase 0 .env.example은 빈 placeholder만 제공한다. 향후 공개 값: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_NAVER_MAPS_KEY_ID, NEXT_PUBLIC_SITE_URL. OAuth secret은 공급자/Supabase 설정에만 저장한다. 앱 서버에서 필요해지기 전 service role 환경 변수를 추가하지 않는다. .env.local 등 실제 환경 파일은 Git에서 제외한다.

## 문서 근거와 한계

아래는 2026-10-27 실제 조회한 문서이다. Context7은 canary·웹 문서 인덱스이므로 최신 npm stable과 동일 버전이라는 보장은 없다. 패키지 버전은 npm metadata/lockfile로 별도 검증한다. 웹 문서는 고정 semver가 없다.

| Context7 ID / 추가 확인 | 문서·확인 내용 |
|---|---|
| /vercel/next.js | https://nextjs.org/docs/app/getting-started/installation ; https://nextjs.org/docs/app/guides/upgrading/version-16 — Node >=20.9.0, App Router CLI, ESLint 별도 실행 |
| /tailwindlabs/tailwindcss.com | https://tailwindcss.com/blog/tailwindcss-v4 ; https://tailwindcss.com/docs/upgrade-guide — PostCSS 플러그인과 CSS import |
| /websites/supabase | https://supabase.com/docs/guides/auth/custom-oauth-providers — generic OAuth2/OIDC; 웹 원문도 교차 확인 |
| 공식 웹 추가 확인 | https://supabase.com/docs/guides/auth/social-sign-in/auth-google — Google 공식 제공자 |
| /websites/developers_naver | https://developers.naver.com/docs/login/api/api.md ; https://developers.naver.com/docs/login/profile/profile.md — authorization code, state, 중첩 profile |
| /websites/navermaps_github_io_maps_js_ncp | https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html — Maps v3 ncpKeyId |
| /websites/vercel | https://vercel.com/docs/functions/runtimes/node-js/node-js-versions — 24.x 기본, 22.x/20.x 제공 |
| npm CLI metadata | next/create-next-app/react/tailwindcss/@supabase/supabase-js/@supabase/ssr @latest의 version·engines·peerDependencies |

## Phase 0 완료 기준과 승인 경계

- 기존 작업 보존, 버전과 lockfile 기록, 비밀 값 없는 환경 예제, 명세·계획·실제 도구 기록 제공.
- npm.cmd run lint 및 npm.cmd run build 실제 종료 코드 확인. 실패 시 원인과 남은 상태를 그대로 보고.
- 외부 키가 없어도 빌드되고 기본 화면을 제공. 실제 식당·DB·지도·OAuth 기능을 완료했다고 표현하지 않음.
- 검증된 변경에 대해서만 Git 커밋을 제안. push·배포·파괴적 DB 변경·유료 설정·중대한 인증 변경은 사전 승인.
- Phase 0 완료 후 자동으로 다음 단계에 진입하지 않음.

## Phase 1 — 사용자 승인된 현재 구현 범위

2026-10-27 Phase 1 지시가 과거 '기본 UI만 구현, 검색/상세는 Phase 3' 계획보다 우선한다. 승인된 로컬 데이터 20곳의 이름 검색·원본 7개 음식 종류 필터·AND 적용·초기화·결과 개수·빈 상태·기본 상세를 이번 단계에 포함한다. DB/Auth·네이버 지도·실제 리뷰·가격/평점 필터 활성화는 포함하지 않는다.

홈은 URL q/category를 서버에서 읽고, 클라이언트의 필터 변경은 native history에 반영한다. 새로고침과 브라우저 뒤로가기 시 조건을 유지한다. 상세의 '전체 식당 탐색' 및 상단 탐색 링크는 명시적으로 전체 목록으로 이동한다. 원본 음식 종류 `한식·국밥`은 별도 분류이며 `한식` 필터와 자동 통합하지 않는다.

카드는 실제 상세 링크를 제공하고 사진 대신 일관된 그래픽 플레이스홀더를 사용한다. null 가격·메뉴·주소·시간은 미확인 안내를 사용한다. 리뷰·별점·거리·현재 영업 중 상태를 생성하지 않는다. 미구현 메뉴/필터는 disabled와 준비 중 문구로 표시한다. 작은 파란 본문은 대비 확보용 #245EBC를 사용하며 지정 강조색 #3276DC는 큰 강조 글씨/포커스 등에 유지한다.

상세는 /restaurants/[id] 서버 페이지와 generateStaticParams로 20곳을 생성한다. 잘못된 ID는 404다. Phase 2 기능으로 확대하지 않으며 검증되지 않은 출처 링크를 확인된 상세 정보로 노출하지 않는다. 실행 증거는 development-log.md와 tests에 기록한다.

## Phase 2 — 데이터 기반과 조회 계층

2026-10-28 사용자 지시로 7개 테이블·RLS·최신 리뷰 집계·20곳 seed·SDK 공개 조회를 구현한다. [phase2-plan.md](./phase2-plan.md)와 [supabase-setup.md](./supabase-setup.md)에 설계/적용 검토를 기록한다. 로그인·리뷰 쓰기·즐겨찾기 UI·지도 및 Phase 3 기능은 제외한다.

원격 키 설정 후 홈·상세는 Supabase 공개 view를 요청 시 조회한다. 상세의 Phase 1 정적 JSON 생성은 요청 시 DB 조회로 바꾸며 build 중 원격 데이터에 의존하지 않는다. 기존 이름·종류 client 필터는 유지한다. 기본 조회 모드는 supabase, 실패 시 원인 분류 및 로컬 복구 모드임을 UI에 표시한다. 명시적 local 개발 모드도 구분한다. 정상 DB의 빈 결과에는 seed/조회 정책 안내를 제공하고 임의로 20곳을 섞지 않는다.

실제 DB 리뷰 집계가 있으면 평균·전체 리뷰 수·참여자 수를 구분해 표시하고, 리뷰가 없으면 NULL/리뷰 없음으로 유지한다. 리뷰 작성 UI를 구현한 것은 아니다. 본문 1~5000자, 프로필 표시명 1~80자(선택) 제약을 사용한다. 사용자별 최신은 created_at DESC/id DESC로 확정하고 소유자·식당·작성일 변경을 DB에서 금지한다.

로컬 PGlite SQL 실행 검증과 실제 Supabase Auth/JWT/PostgREST 검증은 다르다. 원격 migration/seed는 준비 파일·위험 설명 후 사용자 승인 전 실행하지 않는다. 실제 환경 변수 값은 기록하지 않는다.
