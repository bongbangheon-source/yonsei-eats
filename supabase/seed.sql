-- Generated from data/restaurants.json. No fabricated menus or reviews.
-- Re-running preserves existing verified edits. Apply only after approval.
BEGIN;
INSERT INTO public.restaurants (id, name, category, address, latitude, longitude, representative_menu, representative_price, opening_hours, photo_url, source_url, verified_at, verification_status, is_franchise, operating_status, verification_notes) VALUES
  ('sinchon-01', '라구식당', '양식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-02', '오천집 신촌점', '한식·국밥', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://www.diningcode.com/list.dc?query=%EC%97%B0%EC%84%B8%EB%8C%80+%ED%95%B4%EC%9E%A5', NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-03', '카츠업', '일식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-04', '카라멘야', '일식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-05', '소바연구소', '일식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-06', '고삼이', '한식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-07', '오향미엔', '중식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-08', '꼬숑돈까스', '일식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-09', '야바이', '일식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-10', '완차이', '중식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-11', '소신이쏘 신촌본점', '한식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-12', '유닭스토리 닭한마리', '한식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-13', '여우골초밥', '일식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-14', '평안도식당', '한식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-15', '공복식당', '한식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-16', '춘천집 닭갈비 막국수', '한식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-17', '더도이축산직영점 신촌점', '한식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://naver.me/GctrAcmo', NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-18', '키친봄날', '분식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-19', '미분당 신촌본점', '베트남식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://www.diningcode.com/profile.php?rid=1wncLCo6ldIe', NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.'),
  ('sinchon-20', '백소정 신촌점', '일식', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'https://www.diningcode.com/profile.php?rid=i3dKO3GOaxqm', NULL, 'pending', NULL, NULL, '초기 등록 승인. 상세 검증 대기; 원본 상세값과 메모는 v2 보존본 참조.')
ON CONFLICT (id) DO NOTHING;
COMMIT;
