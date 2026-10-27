# Phase 2 SQL 적용 전 최종 검토

검토일: 2026-10-28. **실제 Supabase 접속·SQL 적용 없음.** 검사는 PGlite 0.5.12의 PostgreSQL 18.6 WASM에서 격리 실행했다.

## 1. 필요한 SQL 수정

`supabase/migrations/202610280001_initial_schema.sql`의 verification_status에 이름 있는 CHECK를 추가했다.

```sql
verification_status text not null default 'pending'
  constraint restaurants_verification_status_check
  check (verification_status in ('pending', 'partial', 'verified'))
```

세 값만 허용하고 NULL도 기존 NOT NULL로 거부한다. 허용하지 않은 INSERT가 통과하는 테스트 실패를 먼저 확인한 뒤 수정했다. 나머지 스키마/권한/집계 SQL은 결함이 발견되지 않아 변경하지 않았다. seed.sql은 JSON 일치·재실행·NULL 보존이 확인되어 원문을 보존했다.

## 2. PK·FK·CHECK·인덱스

| 테이블 | 키·참조 | 제약·인덱스 검토 |
|---|---|---|
| profiles | UUID PK -> auth.users.id | 선택 표시명 1~80자, PK가 FK 조회 인덱스도 담당 |
| restaurants | text PK, JSON ID 유지 | 이름/종류 비어 있음 거부, 가격 음수 거부, 좌표 범위, 상태 허용 값. 미확인 필드 nullable |
| menus | identity PK, restaurant_id FK | 이름 비어 있음/음수 가격 거부, restaurant_id 인덱스 |
| reviews | UUID PK, restaurant_id/user_id FK | 1~5 별점, 본문 1~5000자, 최신 조회 복합 인덱스와 user_id 인덱스 |
| review_tags | identity PK, 이름 UNIQUE | 빈 이름 거부, 이름 중복 방지 인덱스 |
| review_tag_links | review_id+tag_id 복합 PK, FK 2개 | PK가 review_id 조회 담당, tag_id 별도 인덱스 |
| favorites | user_id+restaurant_id 복합 PK, FK 2개 | 사용자 중복 방지/조회, restaurant_id 별도 인덱스 |

총 PK 7개, FK 8개와 RLS 7개를 실제 catalog에서 확인했다. FK 선언만으로 자식 인덱스가 생성되는 것은 아니므로 기존 PK 선두 컬럼/명시 인덱스의 참조 조회 범위를 함께 검토했다. PK 중복·태그명 중복·유효하지 않은 FK·CHECK/NOT NULL을 PostgreSQL 오류 코드와 함께 검증했다.

## 3. 최신 리뷰와 평균

`DISTINCT ON (restaurant_id,user_id)`와 `ORDER BY restaurant_id,user_id,created_at DESC,id DESC`의 선두 컬럼이 일치한다. 고유 PK id까지 정렬하여 같은 작성 시각에도 결과가 결정적이다. UUID 크기는 삽입 순서를 의미하지 않으며 동률 처리 기준이다.

작성 시각은 서버 trigger가 결정하고 일반 사용자는 ID/소유자/식당/created_at/updated_at을 직접 변경할 컬럼 권한이 없다. 수정은 rating/body만 허용한다. 별도 identity trigger도 불변 필드를 보호한다. 과거 리뷰 수정으로 최신 순서가 바뀌지 않고 최신 삭제 시 이전 리뷰가 집계에 복귀함을 확인했다.

동일 시각 fixture에서 더 큰 UUID 평점이 선택되는 회귀 검사도 통과했다. 이 fixture는 로컬 메모리 DB에서만 관리자 권한으로 timestamp trigger를 일시 비활성화한 것이며 원격 보호 장치를 변경한 것이 아니다. 리뷰 없는 평균은 NULL이고 총 리뷰 수와 집계 참여자 수는 별개다.

## 4. RLS 및 최소 권한 행렬

| 테이블 | 익명 조회 | 본인 쓰기 | 타인 쓰기 |
|---|---|---|---|
| profiles | 차단 | 본인 생성·표시명/아바타 수정·삭제 | 차단 |
| restaurants | 공개 | 일반 사용자 불가 | 불가 |
| menus | 공개 | 일반 사용자 불가 | 불가 |
| reviews | 공개 | 본인 생성·본문/별점 수정·삭제 | 차단 |
| review_tags | 공개 | 일반 사용자 불가 | 불가 |
| review_tag_links | 공개 | 부모 리뷰 소유자만 추가·삭제 | 차단 |
| favorites | 차단 | 본인 조회·추가·삭제 | 차단 |

로그인 A/B의 소유권 검사를 대칭으로 실행했다. 소유자 UPDATE/DELETE가 실제 기존 행에서 성공하고 타인 행은 반환 0개 또는 권한 오류로 차단됨을 확인했다. 태그는 리뷰 삭제 cascade와 별개로 **소유자가 연결 자체를 직접 삭제/재추가**하는 양성 사례와 타인의 삭제/추가 차단을 확인했다.

태그 연결·즐겨찾기의 UPDATE는 본인도 허용하지 않으며 관계 변경은 삭제/추가 방식이다. 익명의 모든 INSERT/UPDATE/DELETE, 전체 테이블 TRUNCATE, 인증 사용자의 TRUNCATE, 정의 테이블의 쓰기·identity sequence 사용·trigger 함수 EXECUTE가 열려 있지 않음을 확인했다. auth.uid가 없는 authenticated 역할도 소유권을 주장할 수 없다.

두 view는 security_invoker=true다. 로컬 fixture에서 anon의 원본 reviews SELECT를 취소했을 때 view 조회도 거부되어, view가 원본 권한을 우회하지 않음을 실제 확인했다. Supabase에서 이 기능을 쓰려면 PostgreSQL 15 이상이어야 한다. 실제 프로젝트 버전·설정은 이번에 조회하지 않았다.

## 5. seed 및 NULL

seed를 두 번 실행해 정확히 승인된 20개 ID/상호/음식 종류와 참고 출처를 유지함을 확인했다. ON CONFLICT(id) DO NOTHING으로 중복되지 않고, 나중에 검증한 주소를 바꾼 뒤 재실행해도 덮어쓰지 않는다.

주소·위도·경도·메뉴·가격·영업시간·사진·영업 상태·검증일·프랜차이즈 여부의 200개 값이 NULL인 것을 비교했다. pending 식당 20곳을 유지한다. seed가 사용자·메뉴·리뷰·태그·즐겨찾기를 임의 생성하지 않음도 확인했다. 테스트의 사용자/메뉴/리뷰는 메모리 fixture에만 있다.

## 6. 실행 결과

- `npm.cmd test`: 최종 **25 passed / 0 failed**, 기존 Node 모듈 유형 경고는 비치명적이다.
- `npm.cmd run seed:check`: JSON과 seed 정확히 일치.
- `npm.cmd run lint`: exit 0, 오류·경고 출력 없음.
- `git diff --check`: exit 0(기존 LF→CRLF 안내만 존재).
- 작업 시작 시 보존 해시 26개 비교: 앱·데이터·seed·패키지·설정 파일 변경 없음.

새 감사 검사는 tests/helpers/database-audit.mjs에 두고 기존 tests/database.test.mjs에서 등록하여, package.json을 변경하지 않고 npm test에 포함했다. 앱 코드가 바뀌지 않아 build/typecheck/브라우저 검사는 이번에 재실행하지 않는다.

## 7. 공식 문서와 실제 도구

2026-10-28 Context7 resolve 2회(Supabase/PostgreSQL), query 3회로 아래 공식 문서를 확인했다. 웹 문서의 current 인덱스와 로컬 엔진 버전은 구분한다.

- https://supabase.com/docs/guides/database/postgres/row-level-security — auth.uid, RLS와 PG15+ invoker view.
- https://supabase.com/docs/guides/database/views — view 소유자 권한과 invoker 권한의 차이.
- https://www.postgresql.org/docs/current/sql-select.html — DISTINCT ON과 결정적인 ORDER BY.
- https://www.postgresql.org/docs/current/ddl-constraints.html — PK/FK/CHECK 및 자식 FK 인덱스.

Superpowers receiving-code-review/TDD/verification-before-completion 절차와 Caveman review를 적용했다. 일반 Codex agent에 Cavecrew reviewer 역할을 부여해 독립 SQL 감사를 수행했다. 네이티브 preset은 사용하지 않았다.

실제 Supabase Auth/JWT/PostgREST·호스팅 RLS·기존 객체 충돌·서버 버전 검증은 미실행이다. SQL을 원격에 실행하거나 commit·push·배포하지 않았다.
