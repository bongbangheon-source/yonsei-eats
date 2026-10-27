# Phase 5 지도 구현 계획

사용자 Phase5 지시에 따라 `/map`과 검증 위치만 표시하는 NAVER Maps SDK를 구현한다. Superpowers writing-plans/TDD/검증과 Cavecrew 조사·리뷰를 적용한다. 기존 Phase1~4·식당ID20곳·JSON/seed는 보존한다.

1. 공식 NAVER SDK/Cloud 인증·도메인·이용조건, Context7 NAVER/Next 및 설치Next16.4.3 scripts문서를 확인한다. `ncpKeyId`, `window.navermap_authFailure`, 이벤트/지도 제거 API, script실패/timeout을 검증한다. 공개Key ID만 브라우저에 전달한다.
2. `data/restaurant-locations.json`에20곳의 위치전용상태·출처·실제확인일·사유를 기록한다. 기존전반verificationStatus와 별개다. `src/lib/maps/locations.ts`는 레지스트리verified와 DB id/name/address/좌표 정확일치일때만 마커허용, 누락/충돌은fail-closed. JSON원본/seed는 바꾸지 않는다.
3. 공식좌표확보분만 별도비파괴SQL에 준비한다. 현재DB NULL→확인값, 충돌이면 전체rollback. 기존사용자값/평점/리뷰/즐겨찾기/전반verified_at를 덮어쓰지 않는다. 실제적용은 사용자승인/직접실행후읽기검증.
4. `src/lib/maps/{state,sdk,controller}.ts`, `naver-types.ts`; `src/components/{map-explorer,naver-map,view-link}.tsx`; `src/app/map/page.tsx`. 검색/정확한category/selected/mobile view를URL에 유지하고 history/popstate동기화한다. PC지도+목록, 모바일탭. 검증되지않은20곳목록은 유지하고 미표시사유 안내.
5. 맵초기화/marker/event/InfoWindow/resize/cleanup은 최소SDK인터페이스로분리. 정보창 DOM은textContent/고정내부링크로XSS방지. SDK실패/인증실패/timeout은서로안내하고좌표0건도fake마커생성없음. 지도중심은검증된위치중첫좌표 또는SDK기본중심이며 식당미확인좌표를새로만들지않는다.
6. 헤더/목록↔지도링크와상세의선택지도링크연결. auth/confirm의no-referrer유지, /map만origin기반referrer정책으로NAVER도메인인증지원. 지도타일/저작권컨트롤을가리거나제거하지않는다.
7. 입력상태/좌표게이트/SDKloader/controller를fixture로TDD검사. 실제SDK/실제마커검사와분리한다. npm test/lint/typecheck/build/db, 기존Edge회귀, /map검색/URL/선택/모바일/SDK오류, 가능한실제API로딩검사.
8. docs/restaurant-data/spec/implementation-plan/development-log,설정안내/완료보고서갱신. commit/push/Vercel/Phase6없이검토대기. 키또는좌표확보못하면실제정상동작이라고보고하지않는다.
