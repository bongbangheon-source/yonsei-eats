import nextEnv from '@next/env';
import { readFileSync } from 'node:fs';
import { readSupabaseConfig } from '../src/lib/supabase/config.ts';
import { queryRestaurantCatalog } from '../src/lib/supabase/catalog.ts';
import { mapRestaurantRow } from '../src/lib/restaurant-repository.ts';

// GET only. Never print environment values, raw server errors or credentials.
nextEnv.loadEnvConfig(process.cwd(), true, { info() {}, error() {} });
try {
  const configuration = readSupabaseConfig(process.env);
  if (!configuration.ok) throw new Error(configuration.message);
  if (process.env.RESTAURANT_DATA_SOURCE === 'local') throw new Error('RESTAURANT_DATA_SOURCE를 supabase로 설정해 주세요.');
  const result = await queryRestaurantCatalog(configuration.config);
  if (result.error || !result.data) throw new Error('공개 catalog 조회 실패: URL·공개 키·네트워크·뷰 및 RLS 권한을 확인해 주세요.');
  const rows = result.data.map(mapRestaurantRow);
  const expected = JSON.parse(readFileSync('data/restaurants.json', 'utf8')).restaurants;
  if (rows.length !== 20 || new Set(rows.map(row => row.id)).size !== 20 ||
      expected.some(item => !rows.some(row => row.id === item.id && row.name === item.name))) {
    throw new Error('조회 결과가 승인된 식당 20곳의 ID·이름과 일치하지 않습니다.');
  }
  console.log('PASS: Supabase restaurant_catalog 공개 조회 성공; 승인된 식당 20곳 ID·이름 및 nullable/평점 스키마 확인. DB 쓰기 없음.');
} catch (error) {
  // Only our own fixed messages are safe; mapping/network errors may contain data.
  const safe = error instanceof Error && /^(Supabase|RESTAURANT_DATA_SOURCE|공개 catalog|조회 결과)/.test(error.message);
  console.error('FAIL:', safe ? error.message : '연결 또는 응답 검증 실패. 설정·네트워크·catalog 스키마를 확인해 주세요.');
  process.exitCode = 1;
}
