# 연세잇츠(Yonsei Eats) 프로젝트 명세

작성일: 2026-10-27 (Asia/Seoul). 상태: Phase 0 설계 사용자 승인 완료. 최소 초기화 방식도 사용자 선택 완료. Phase 1 진입 승인은 별도이다.

## 목적과 범위

연세대학교 신촌캠퍼스 주변 교외 식당을 검색하고 조건으로 비교하는 반응형 웹앱이다. 가격·음식 종류·자체 리뷰 평점으로 식당을 찾고 네이버 지도로 위치를 확인한다. 로그인 회원은 리뷰와 즐겨찾기를 관리한다.

이번 Phase 0 산출물은 Next.js App Router + TypeScript + Tailwind CSS + ESLint 초기화, 외부 설정 없이 실행되는 한국어 기본 화면, 기본 디렉터리, README, .gitignore, .env.example, 본 명세, 구현 계획, 개발 기록이다. lint와 production build를 검증한다. DB·OAuth·지도·식당 검색 기능은 구현하지 않는다. 실제 배포나 유료 서비스 설정도 하지 않는다.

## 접근 방식

1. **최소 초기화 — 사용자 선택(2026-10-27):** UI 실행 기반과 문서만 준비하고 Supabase·지도 SDK는 해당 구현 단계에서 설치한다. 현재 불필요한 의존성과 비밀 키를 요구하지 않는다.
2. 연동 SDK 선설치: 다음 단계 준비가 조금 빠르지만 현재 검증할 수 없는 의존성과 설정이 늘어난다. 이번에는 선택하지 않았다.

Phase 0 기본 화면은 서비스명, 간단한 소개, 검증된 식당 데이터 준비 안내를 표시한다. 동작하지 않는 로그인·검색·지도 버튼이나 가상의 식당 카드는 만들지 않는다. 폰트는 시스템 글꼴로 빌드 중 외부 폰트 다운로드를 피한다. 상세 시각 디자인은 Phase 1에서 검토한다. 이는 구현자의 제안이다.

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
- Google·네이버 로그인, 본인 리뷰 수정·삭제, 계정별 즐겨찾기·마이페이지.
- 텍스트 리뷰, 1~5점 정수 별점, 사전 정의된 추천 태그. 같은 사용자의 동일 식당 여러 리뷰 허용.
- 평균 평점에는 각 사용자별 최신 리뷰 한 건만 반영. 리뷰가 없으면 NULL과 '아직 리뷰 없음'을 사용하며 0점으로 저장하거나 표시하지 않는다.
- PC 다열·모바일 한 열. 배경 #FFFFFF, 네이비 #142B50, 블루 #3276DC, 보조 배경 #F1F5F9. 둥근 카드·충분한 여백·접근 가능한 입력과 포커스.
- Supabase RLS 및 Vercel 배포. 실제 배포는 사전 승인 필요.

사진 업로드, 키워드 추출, 맞춤·랜덤 추천, 종합 추천 점수, 관리자, 식당 제보 승인, 할인 정보는 2차 기능이며 MVP에서 제외한다.

## 데이터 정책과 확인 대기

검토 완료된 전체 식당 목록은 현재 없다. 20곳을 임의로 생성하거나 식당을 교체하지 않는다. 필수 포함 식당의 이름은 사용자 지시로 확인했으나 주소·좌표·메뉴·가격·영업시간의 검증은 완료되지 않았다. https://naver.me/GctrAcmo 는 조회 도구에서 접근 실패했다. 사용자가 검토한 목록과 출처 자료가 필요하다.

식당 데이터는 출처 URL·확인일을 기록한다. 알 수 없는 가격·영업시간·사진 URL은 NULL 또는 미확인으로 처리한다. 자체 평점에 외부 서비스 평점을 섞지 않는다. 초기 seed는 승인된 데이터만 포함한다. 음식 종류·가격대·혼밥·밥약·단체 목적의 다양성도 목록 검토 때 확인한다.

구현 제안(Phase 2에서 확정): 가격 필터는 검증된 대표 메뉴 가격을 기준으로 하고 미확인 가격은 별도로 구분한다. 범위 경계는 원 단위 정수·양끝 포함으로 일관되게 정의한다. 평점 최솟값 필터를 켜면 자체 리뷰 없는 식당은 제외한다. 검색·필터·보기 상태는 URL query로 보존한다. 추천 태그 목록과 텍스트 길이 제한은 기능 구현 전 사용자 검토 대상이다.

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

## 인증 설계와 위험

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
