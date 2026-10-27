import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { restaurants, getRestaurant, getCategories, filterRestaurants, formatPrice } from '../src/lib/restaurants.ts';

test('all 20 approved restaurants remain available, independently of verification', () => {
  assert.equal(restaurants.length, 20);
  assert.equal(new Set(restaurants.map(r => r.id)).size, 20);
  assert(restaurants.some(r => r.name === '오천집 신촌점'));
  assert(restaurants.some(r => r.name === '더도이축산직영점 신촌점'));
  assert(!restaurants.some(r => r.name.includes('정육면체')));
  assert.equal(filterRestaurants(restaurants, '', '').length, 20);
});

test('name search trims and ignores case without inventing menu data', () => {
  assert.equal(filterRestaurants(restaurants, '  오천집  ', '')[0].id, 'sinchon-02');
  assert.equal(filterRestaurants(restaurants, '더도이', '').length, 1);
  assert.equal(filterRestaurants([{ ...restaurants[0], name: 'Yonsei Eats' }], 'yonsei', '').length, 1);
  assert.equal(filterRestaurants(restaurants, '   ', '').length, 20);
});

test('category uses seven exact approved labels and combines with query using AND', () => {
  assert.equal(getCategories(restaurants).length, 7);
  assert(getCategories(restaurants).includes('한식·국밥'));
  assert.equal(filterRestaurants(restaurants, '', '일식').length, 7);
  assert.equal(filterRestaurants(restaurants, '오천집', '한식·국밥').length, 1);
  assert.equal(filterRestaurants(restaurants, '오천집', '일식').length, 0);
  assert.equal(filterRestaurants(restaurants, '존재하지않는상호', '').length, 0);
});

test('filtering preserves approved data and unknown fields', () => {
  const before = JSON.stringify(restaurants);
  filterRestaurants(restaurants, '신촌', '일식');
  assert.equal(JSON.stringify(restaurants), before);
  for (const r of restaurants) {
    for (const field of ['address','representativeMenu','representativePrice','openingHours','latitude','longitude','photoUrl','operatingStatus']) assert.equal(r[field], null);
  }
});

test('null prices are unknown, verified prices format in won, ID lookup rejects missing IDs', () => {
  assert.equal(formatPrice(null), '정보 확인 중');
  assert.equal(formatPrice(12000), '12,000원');
  assert.equal(getRestaurant('sinchon-02')?.name, '오천집 신촌점');
  assert.equal(getRestaurant('not-a-restaurant'), undefined);
});

test('small accent text has at least 4.5:1 contrast on white and pale category surfaces', () => {
  const css = readFileSync('src/app/globals.css', 'utf8');
  const color = css.match(/--color-link-blue:\s*(#[0-9a-f]{6})/i)?.[1];
  assert(color, 'A text-specific accessible blue token is required');
  const luminance = hex => {
    const values = hex.slice(1).match(/../g).map(v => parseInt(v, 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return .2126 * values[0] + .7152 * values[1] + .0722 * values[2];
  };
  for (const background of ['#ffffff', '#eff6ff', '#f1f5f9']) {
    assert((luminance(background) + .05) / (luminance(color) + .05) >= 4.5);
  }
});
