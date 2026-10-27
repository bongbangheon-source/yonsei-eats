# NAVER Maps 설정 및 검증

확인일2026-10-28. 이 앱은 공식 NAVER Maps JavaScript API v3를 사용하며 별도 React 지도패키지나 서버 Geocoding/Directions API를 추가하지 않았다.

## 현재 적용 상태

사용자가 NAVER Cloud 설정·공개Key ID 저장·위치SQL 직접적용 완료를 회신했다. 에이전트가 실제SDK/지도타일/마커클릭과 공개DB 위치2건일치를 검증했다. 사용자키·비밀값은 기록하지 않는다. 이미 적용한SQL은 재실행할 필요가 없다.

## 개발자 설정

1. NAVER Cloud Console의 **Services → Application Services → Maps**에서 Maps 애플리케이션과 Web Dynamic Map 사용을 설정한다. 기존 AI·NAVER API와 새 Maps 상품 안내가 함께 존재하므로 현재Maps 콘솔에서 발급된Key를 사용한다. 서비스약관/요금/무료적용계정·이용한도는 사용자가 직접 확인한다. 에이전트는 계정가입·유료설정·한도상향을 하지 않는다.
2. Web 서비스 URL에 실제 개발주소 `http://127.0.0.1:3000`을 등록한다. localhost도 사용한다면 해당주소도 확인한다. 운영에서는 확정도메인만 등록한다. 브라우저 인증은 등록서비스주소와 일치해야 하므로 `localhost`/`127.0.0.1` 혼용으로 실패할 수 있다.
3. `.env.local`에 `NEXT_PUBLIC_NAVER_MAPS_KEY_ID=YOUR_PUBLIC_KEY_ID`를 저장한다. **Key ID는 브라우저공개 인증식별자**이며 Client Secret은 넣지 않는다. Supabase비밀키나NAVER Client Secret을 이 변수에 넣지 않는다. `.env.local`은 Git제외다.
4. 환경파일 변경후 서버를 재시작하거나 전체새로고침하고, production은 새환경으로 다시build한다. 브라우저정적번들의 NEXT_PUBLIC 값은빌드시반영된다.
5. 사용량/일별·월별한도/알림을현재콘솔에서확인한다. NAVER로고/지도데이터저작권은기본컨트롤을유지한다. 무료이용량은대표계정등상품조건에따르므로모든계정/모든호출무료라고가정하지않는다.

공식 스크립트는 `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=...`이다. 공개Key ID를URL인코딩해사용하며 rawURL/키를앱진단로그에출력하지않는다. `window.navermap_authFailure`를스크립트삽입전에설정해인증실패를받는다.

## Referrer와 인증 보안

NAVER 도메인검증에 필요한 origin을보내도록 `/map` 응답·메타·SDK script는 `strict-origin-when-cross-origin`이다. 이메일인증 `/auth/confirm`을비롯한다른페이지의 `no-referrer`는유지한다. 외부요청에인증토큰/이메일확인쿼리를전달하지않고 SDK에는브라우저현재origin만전달한다. 기존SupabaseSSR쿠키·RLS·ServerActionCSRF는변경하지않았다.

스크립트로드는API공식script방식과async를사용하며, 실패재시도/15초timeout/전역auth callback선등록을위해전용loader로관리한다. NextScript의공식onReady/onError규약도검토했으나전역인증·재시도수명관리는직접캡슐화했다. 지도모듈은클라이언트에서만실행한다. 소프트네비게이션은SDK로드를공유하고지도/마커/이벤트/정보창은해제한다.

## 위치 데이터

- 출처별기록: [phase5-location-audit.md](./phase5-location-audit.md)
- 레지스트리: `data/restaurant-locations.json`
- 반영SQL과충돌정책: [phase5-db-review.md](./phase5-db-review.md)

레지스트리의위치verified만으로DB값을대체하지않는다. DB이름/주소/위도/경도가정확히일치해야마커허용한다. 글로벌verification_status가pending/partial인것과위치전용검증은별개다. 확인된2곳도현재영업중/가격검증을의미하지않는다. 다른18곳은목록/상세에유지하며마커나가짜길찾기링크를생성하지않는다.

## 실행 검사

```powershell
npm.cmd test
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
npm.cmd run db
npm.cmd run db:locations
$env:BASE_URL='http://127.0.0.1:3000'
$env:EXPECTED_DATA_SOURCE='supabase'
$env:MAP_SMOKE='1'
$env:REQUIRE_REAL_MAP='1'
npm.cmd run test:browser
```

`REQUIRE_REAL_MAP=1`은실제SDKready/정상타일이미지/검증마커/실제마우스클릭URL동기화를필수로한다. 키가없거나인증에실패하면실패하며가짜지도로통과시키지않는다. 모의loader/controller단위테스트와구분한다.

오류안내만검사하려면별도터미널에서`MAP_SMOKE=1`, `MAP_ONLY=1`, `MAP_BLOCK_SDK=1`을설정하고`REQUIRE_REAL_MAP`은제거한뒤browser검사를실행한다. CDP에서NAVERSDK URL만차단하는테스트이며제품코드에테스트용지도나가짜좌표를넣지않는다.

## 오류별 확인

- 키누락: 공개Key ID변수/서버재시작확인.
- 인증실패: 현재Maps상품Key ID, WebDynamicMap사용설정, 실제접속도메인과허용URL확인. Client Secret으로대체하지않는다.
- 네트워크실패/timeout: SDK호스트차단·콘텐츠차단·실행환경네트워크확인. 목록검색은계속사용가능하다.
- 마커0개: DB에검증좌표가적용됐는지 `db:locations`로확인. 검색조건상위치확인식당0곳일수도있다. 임의좌표로대체하지않는다.

## 공식 근거

- Context7 `/websites/navermaps_github_io_maps_js_ncp`: [시작·인증실패](https://navermaps.github.io/maps.js.ncp/docs/tutorial-2-Getting-Started.html), [정보창](https://navermaps.github.io/maps.js.ncp/docs/tutorial-3-InfoWindow.html), [Map setSize/destroy](https://navermaps.github.io/maps.js.ncp/docs/naver.maps.Map.html)
- [NAVER Cloud Maps 애플리케이션](https://guide.ncloud-docs.com/docs/application-maps-app-vpc), [Web Dynamic Map](https://guide.ncloud-docs.com/docs/maps-web-sdk): 서비스신청·키·URL·사용량조건.
- Context7 `/vercel/next.js` 및설치Next16.4.3의scripts문서: 클라이언트에서외부script로딩/오류처리. NAVER v3 웹문서는고정npmsemver가아니다.
