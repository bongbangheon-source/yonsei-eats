# Phase 2 Supabase 설정·적용 검토서

작성일: 2026-10-28. 사용자 직접 초기 migration/seed 적용 후 공개 catalog 20곳 조회를 검증했다. 아래 SQL 적용 절차는 최초 준비 이력이다. Phase 3는 기존 스키마·RLS를 사용하며 추가 SQL 적용이 없다. 이메일 인증 설정은 [auth-setup.md](./auth-setup.md)를 따른다. 실제 사용자 Auth 통합 검사는 별도다.

## 1. 현재 준비된 파일

- `supabase/migrations/202610280001_initial_schema.sql`: 신규 테이블 7개·RLS·인덱스·timestamp/identity trigger·security_invoker view 2개.
- `supabase/seed.sql`: 승인 JSON 20곳의 `INSERT ... ON CONFLICT(id) DO NOTHING`. 리뷰·메뉴·사용자·태그를 가짜 생성하지 않는다.
- `scripts/generate-seed.mjs`: JSON에서 SQL 파일을 만드는 로컬 생성기. DB 연결/원격 실행 기능 없음. `npm.cmd run seed:generate`, `npm.cmd run seed:check`.
- `tests/database.test.mjs`: PGlite 실제 PostgreSQL 엔진에서 migration·seed·제약·RLS·집계 실행. Auth/JWT/PostgREST가 아닌 테스트용 auth.uid fixture를 사용.
- `src/lib/supabase/server.ts`: 공개 키로 익명 서버 조회만 수행. Auth session/cookie·service_role·관리자 API 미사용.

## 2. 사용자가 설정할 값

`.env.example`을 참고하여 Git에서 제외되는 `.env.local`에 설정한다. 기존 `.env`는 덮어쓰지 않는다.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
RESTAURANT_DATA_SOURCE=supabase
```

공개 키는 `sb_publishable_...` 또는 기존 anon JWT이다. secret/service_role JWT는 거부한다. 실제 값을 채팅·Git·보고서에 붙이지 않는다. 키를 바꾼 뒤 Next 서버를 재시작한다. 이 단계에는 DB 비밀번호·service_role·Google/NAVER OAuth 키가 필요하지 않다.

명시적으로 로컬 원본을 사용할 때만 `RESTAURANT_DATA_SOURCE=local`로 바꾼다. 값이 없으면 기본은 supabase다. 키 누락/형식 오류/네트워크/스키마/RLS 실패 시 원인을 분류한 안내와 '로컬 원본 (연결 복구 모드)'를 표시한다. 정상 조회가 빈 배열이면 seed/조회 정책 확인 안내를 표시하고 조용히 JSON으로 대체하지 않는다.

연결 복구 중 로컬 원본에 없는 ID는 실제 DB에서의 존재 여부를 판단할 수 없으므로 404 대신 '식당 정보를 확인할 수 없어요' 화면을 제공한다(현재 UI 응답은 HTTP 200). 정상 DB 또는 명시적 local 모드에서 없는 ID는 기존 404다. 원격 장애를 식당 삭제로 오인시키지 않는다.

## 3. 테이블·권한

| 객체 | 주요 제약 및 접근 |
|---|---|
| profiles | id -> auth.users, 본인만 조회·생성·표시명/아바타 수정·삭제 |
| restaurants | text ID PK, 이름/종류 필수. 주소·좌표·대표 메뉴/가격·시간·사진·검증 메타 nullable, 공개 읽기만 |
| menus | restaurant FK, 이름 필수·가격 nullable/음수 금지, 공개 읽기만 |
| reviews | auth.users/restaurant FK, 별점 1~5, 본문 1~5000자, 복수 리뷰 허용. 공개 읽기·본인 쓰기 |
| review_tags | 고유 태그명, 공개 읽기만. 사전 태그 seed는 아직 없음 |
| review_tag_links | 복합 PK/FK, 공개 읽기·부모 리뷰 소유자만 연결 추가/삭제 |
| favorites | 사용자+식당 복합 PK, 본인 조회·추가·삭제. 관계 수정은 삭제/추가로 처리 |

모든 7개 테이블에 RLS를 활성화한다. broad default privileges를 revoke하고 필요한 테이블/컬럼만 grant한다. 리뷰 수정 가능 컬럼은 rating/body뿐이다. ID·user_id·restaurant_id·created_at은 변경 불가이며 생성 시각은 서버가 결정한다. auth.users 삭제 시 해당 프로필·리뷰·즐겨찾기 등이 cascade되며 식당 삭제 시 관련 메뉴·리뷰·즐겨찾기/태그 연결이 cascade된다. 이 migration이 기존 식당이나 사용자를 삭제하는 것은 아니다.

`restaurant_ratings`는 사용자별 최신 리뷰를 created_at DESC, id DESC로 선정한다. 전체 리뷰 수 review_count와 참여자 수 reviewer_count를 구분한다. 평균은 최신 리뷰만, 없으면 NULL이다. 최신 리뷰 삭제 시 이전 리뷰가 자동 반영된다. `restaurant_catalog`는 식당 정보와 이 집계를 합친 공개 조회용 view다. 두 view 모두 SECURITY INVOKER로 RLS를 따른다.

## 4. 실제 프로젝트 적용 전 승인할 변경과 위험

다음 작업은 아직 실행하지 않았다. **사용자의 명시적 승인과 대상 프로젝트 확인 후에만 실행한다.**

1. Supabase SQL Editor 등에서 현재 public 테이블/함수/view 이름이 충돌하는지 확인한다. 기존 데이터가 있으면 백업·변경 검토가 먼저다.
2. migration SQL 전체 검토 후 1회 적용한다. 이미 객체가 있으면 CREATE가 실패하고 transaction이 rollback되며 기존 객체를 임의로 DROP/덮어쓰지 않는다.
3. 성공을 확인한 뒤 seed SQL을 실행한다. 미확인 필드는 NULL, pending 20곳이다. 재실행은 같은 ID를 추가하지 않고 **기존 행을 갱신하지 않으므로** 나중에 검증한 주소·메뉴 등을 덮어쓰지 않는다.
4. 적용 결과 테이블 7개/RLS/view·익명 권한 및 20개 ID를 확인한다. 원격의 실제 Auth 사용자 A/B와 anon 경로를 통해 소유권·조회 검증을 별도로 수행한다.
5. 공개 키 기반 목록/상세에 '데이터 출처: Supabase'가 나오고, 20개 식당·검색·필터·404가 유지되는지 확인한다.

직접 적용하는 경우에도 migration 실패 후 seed를 이어 실행하지 않는다. 이 단계에서 로그인 UI·리뷰 쓰기 UI·지도는 추가하지 않는다. migration을 되돌리려고 테이블을 일괄 DROP하면 데이터가 지워질 수 있으므로 그런 rollback은 자동 제공/실행하지 않는다. 별도 승인된 복구 계획이 필요하다.

## 5. 준비된 로컬 검증과 원격 미검증

로컬 PostgreSQL WASM(PGlite)의 fixture 역할은 anon/authenticated와 auth.uid를 재현한다. seed 재실행·NULL·제약·익명 조회·타인 변경 차단·최신 리뷰/삭제 후 복귀를 실제 SQL로 검사한다. 저장된 SQL 문자열만 검사하는 mock은 아니다.

하지만 Supabase 호스팅의 실제 auth.users 운영 구조, JWT 검증, PostgREST schema cache, Dashboard 설정·기존 스키마 충돌·원격 네트워크/RLS 경로는 아직 검증하지 않았다. 현재 프로젝트에는 실제 Supabase URL/공개 키가 없고 원격 DB에 접근/변경하지 않았다. 서버 repository의 SDK 응답·오류 분기 단위 검사는 주입된 응답이며 실제 원격 성공이라고 보고하지 않는다.

## 6. 문서 근거

2026-10-28 Context7 실제 조회: [Supabase API keys](https://supabase.com/docs/guides/api/api-keys), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [views](https://supabase.com/docs/guides/database/views), [Next server components](https://nextjs.org/docs/app/getting-started/server-and-client-components), [PGlite API](https://pglite.dev/docs/api). 설치 버전은 package-lock.json과 development-log.md에 기록한다. Supabase SSR Auth는 이 단계에서 구현하지 않아 구형 auth-helpers/cookie 예제는 사용하지 않는다.
# 실제 연결 확인 (2026-10-28)

사용자가 초기 migration 및 seed를 적용한 뒤 URL·Publishable Key를 `.env.local`에 저장했다. 에이전트는 원격 SQL을 실행하지 않고 `restaurant_catalog` SELECT만 수행했다. `npm.cmd run db:check`로 공개 키 조회 및 승인된 20곳의 ID·이름·응답 형식을 확인했다.

설정을 변경하면 개발 서버를 재시작한다. 아래 엄격 모드는 로컬 복구 화면을 DB 연결 성공으로 인정하지 않는다. 앱 서버를 먼저 실행하고 `BASE_URL`을 필요에 따라 지정한다(기본 3101).

```powershell
npm.cmd run db:check
$env:EXPECTED_DATA_SOURCE='supabase'
npm.cmd run test:http
npm.cmd run test:browser
```

원격 Auth/JWT 및 사용자별 쓰기 RLS 검증은 이 읽기 전용 연결 검사에 포함하지 않는다. 아래 초기 준비 시점 기록의 '원격 미검증'은 당시 상태이며, 현재 공개 조회 검증과 구분한다.
