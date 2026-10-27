# Phase 5 위치 확인 기록

확인일: **2026-10-28 (Asia/Seoul)**. 승인된20곳을 모두 실제 검색했다. 지도/공식기관/브랜드 원문을 우선했고, 민간자료만으로 좌표를 확정하지 않았다. 접근실패나429를 우회하지 않았다. 현재영업·폐업·이전 여부가 독립 확인됐다는 뜻이 아니다.

**위치 반영 가능2곳, 보류18곳**(주소충돌2곳 포함). 마커 허용 기준은 `data/restaurant-locations.json` 위치전용 verified + DB id/name/address/좌표의 정확한 일치다. 등록20곳 목록은 유지한다. 원본 JSON/seed의NULL은 보존하며 실제DB 갱신은 신규 승인SQL로만 한다.

## 공식 위치 근거

| 식당 | 공식 주소 | 위도 / 경도 | 근거 |
|---|---|---|---|
| sinchon-05 소바연구소 | 서울 서대문구 명물길50-9 (창천동) | 37.5587750739815 / 126.939459409798 | [서울관광 공식 신촌본점](https://korean.visitseoul.net/area/SobaLabSinchon/KOP1kjvs6) |
| sinchon-08 꼬숑돈까스 | 서울 서대문구 명물1길2 (창천동) | 37.557838918578 / 126.937349643274 | [서울관광 공식](https://korean.visitseoul.net/restaurants/CochonTonkatsu/KOPf7618z) |

각 공식HTML의 식당 이름을 포함한 길찾기 함수와 `data-map-x/y`, lat/lng가 일치함을 investigator가 확인하고 main도 공개원문HTTP200에서 좌표값을 독립 재확인했다. 공통 fallback인 명동 좌표는 배제했다. 소바연구소 공식명은 신촌본점이며 승인된 원래 이름·ID는 바꾸지 않는다. 페이지 수정일2026-06-30과 실제 확인일을 구분한다. 원문주소의 공백은 레지스트리에 기록한 표준 문자열을 사용한다.

## 20곳별 결과와 후속 확인

| ID | 식당 | 상태·보류 사유 | 실제 확인/시도 출처 |
|---|---|---|---|
| 01 | 라구식당 | conflict: 민간 연세로42-24/42-28 충돌, 공식좌표 미확인 | [후보Instagram](https://www.instagram.com/ragu_pasta/), [주소자료](https://www.placeview.co.kr/id/MjY5NzY1MjYg) |
| 02 | 오천집 신촌점 | pending: 신촌점/신촌본점 표기 추가확인, 공식좌표 없음 | [업체프로필 후보](https://www.daangn.com/kr/local-profile/%EC%98%A4%EC%B2%9C%EC%A7%91-%EC%8B%A0%EC%B4%8C%EB%B3%B8%EC%A0%90-8dwty2sfyoz5/) |
| 03 | 카츠업 | pending: 브랜드는 신촌본점 언급, 지점주소/좌표 미확보. footer홍익로10은 본사 | [공식브랜드](https://katsup.co.kr/) |
| 04 | 카라멘야 | pending: 예약/민간 주소 후보만 확인 | [예약페이지](https://www.tabling.co.kr/restaurant/9048) |
| 05 | 소바연구소 | verified: 위 공식근거 | 위 표 |
| 06 | 고삼이 | pending: 민간 주소 후보만 확인 | [참고자료](https://www.diningcode.com/profile.php?rid=Q2aMjuw2lv7M) |
| 07 | 오향미엔 | pending: 민간후보. 성동구 사업자주소를 신촌매장에 쓰지 않음 | [참고자료](https://www.diningcode.com/profile.php?rid=gD0zxU8m5QWc) |
| 08 | 꼬숑돈까스 | verified: 위 공식근거 | 위 표 |
| 09 | 야바이 | pending: NAVER Place 접근제한/HTTP429 | [NAVER 장소](https://m.place.naver.com/restaurant/13564299/home) |
| 10 | 완차이 | pending: 공식관광페이지 방화벽차단, 대체영문404 | [서울관광 공식링크](https://korean.visitseoul.net/restaurants/%EC%99%84%EC%B0%A8%EC%9D%B4/KOP012577) |
| 11 | 소신이쏘 신촌본점 | pending: 사업자 공고 주소는 있으나 현재지점·좌표 미확인 | [사업자제공공고](https://www.alba.co.kr/job/Detail?adid=146973224) |
| 12 | 유닭스토리 닭한마리 | pending: 공식 신촌점 항목/Place13440707 확인, NAVER429/관광공사상세500 | [관광공사](https://korean.visitkorea.or.kr/detail/ms_detail.do?cotid=4c78b9ce-4689-4bc4-bd54-95874d40491c) |
| 13 | 여우골초밥 | pending: 관광공사자료는 홍대지점으로 보여 신촌에 대입하지 않음 | [신촌민간후보](https://www.diningcode.com/profile.php?rid=X7qDhoNWtHYX), [다른지점공식](https://big5chinese.visitkorea.or.kr/svc/contents/infoHtmlView.do?vcontsId=138462) |
| 14 | 평안도식당 | pending: 민간 신촌주소 후보, 공식좌표 미확보 | [참고자료](https://superchart.com/ko/stores/pyeongando-sikdang-sinchon/) |
| 15 | 공복식당 | pending: 민간주소 후보만 확인 | [참고자료](https://www.diningcode.com/profile.php?rid=Mk0uoz3Po7VO) |
| 16 | 춘천집 닭갈비 막국수 | conflict: 공식 연세로5가길1 / 민간 연세로5가길8 충돌 | [관광공사](https://english.visitkorea.or.kr/svc/contents/contentsView.do?menuSn=352&vcontsId=86497), [충돌자료](https://new.emmaru.com/matzip/matzip.do?code=M170703140912931263L&f=1&s=0&t=0) |
| 17 | 더도이축산직영점 신촌점 | pending: 공식ID/사업장좌표 후보 확보, 전체명칭/주소 원문인코딩 재확인 보류 | [사용자링크](https://naver.me/GctrAcmo), [NAVER Place1910033423](https://m.place.naver.com/restaurant/1910033423/home) |
| 18 | 키친봄날 | pending: 기사/SNS후보, 현재공식좌표 미확보 | [기사](https://www.esquirekorea.co.kr/article/53731) |
| 19 | 미분당 신촌본점 | pending: 본점/2호점 구분 필요, 공식502/접근불가 | [공식브랜드 접근시도](https://mifendang.com) |
| 20 | 백소정 신촌점 | pending: 본사열람, 연결브랜드준비중, 지점좌표 미확보 | [본사](https://cnbcorp.co.kr/baeksojeong), [연결브랜드](https://www.baeksojeong-official.com/) |

## 보류 후보의 정확한 구분

- 춘천집 공식 JSON-LD는 이름과 주소에 연결된 **37.5569917657037 / 126.936059192042**를 포함한다. 다른주소자료 충돌을 사용자에게 보고하고 실제DB/활성좌표에 반영하지 않았다.
- 더도이 사용자 단축링크는 NAVER 장소1910033423으로 연결된다. 최초HTTP200의 같은 PlaceDetailBase 사업장Coordinate는 **37.5577599 / 126.9354334**였다. 별도 panorama 좌표는 사용하지 않는다. PowerShell 문자 인코딩 문제로 전체한국어 명칭/주소의 정상UTF8 재확인 근거가 부족하고 후속429 이후 중단했다. 공식좌표후보를 확보했다는 사실과, 이번 지도 허용을 보류했다는 결정을 구분한다. 반영을 원하면 NAVER 지점을 사용자브라우저에서 수동대조한 뒤 별도검토한다.
- NAVER429는 일부페이지에서 발생한 결과이며 모든식당이 폐업했다거나 NAVER에 등록되지 않았다는 뜻이 아니다. 폐업·이전은 대부분 미확정이고 UI에서 '영업 중'으로 표시하지 않는다.
