import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const base = process.env.BASE_URL || 'http://127.0.0.1:3101';
const restaurants = JSON.parse(readFileSync('data/restaurants.json', 'utf8')).restaurants;
const response = await fetch(base);
assert.equal(response.status, 200);
const html = await response.text();
assert.equal((html.match(/data-restaurant-card="/g) || []).length, 20, 'SSR must render all 20 approved cards');
for (const r of restaurants) {
  assert(html.includes(r.name), r.name);
  const detail = await fetch(`${base}/restaurants/${r.id}`);
  assert.equal(detail.status, 200, r.id);
  const detailHtml = await detail.text();
  assert(detailHtml.includes(r.name), r.name);
  assert(detailHtml.includes('위치 확인 중'));
  assert(detailHtml.includes('영업 상태 확인 중'));
}
const query = await fetch(`${base}/?q=${encodeURIComponent('오천집')}&category=${encodeURIComponent('한식·국밥')}`);
assert.equal(((await query.text()).match(/data-restaurant-card="/g) || []).length, 1, 'URL filters applied by SSR');
const missing = await fetch(`${base}/restaurants/missing-id`);
assert.equal(missing.status, 404);
console.log('PASS: SSR 20 cards, 20 detail routes, URL combined filter, missing-ID 404.');
