import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import test from 'node:test';

// Read the production SQL before importing the optional local test engine.
const migration = readFileSync('supabase/migrations/202610280001_initial_schema.sql','utf8');
const seed = readFileSync('supabase/seed.sql','utf8');
const { auditDatabase } = await import('./helpers/database-audit.mjs');
test('final SQL audit: catalog constraints, full role matrix and seed preservation', auditDatabase);

test('PostgreSQL migration, seed, constraints, RLS ownership and latest-review aggregation', async () => {
  const { PGlite } = await import('@electric-sql/pglite');
  const db = new PGlite();
  const a='11111111-1111-4111-8111-111111111111', b='22222222-2222-4222-8222-222222222222';
  const scalar = async sql => Object.values((await db.query(sql)).rows[0])[0];
  const asUser = async uid => { await db.exec(`reset role; set role authenticated; select set_config('request.jwt.claim.sub','${uid}',false);`); };
  try {
    await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated; insert into auth.users values('${a}'),('${b}');`);
    await db.exec(migration);
    for (const status of ['pending','partial','verified']) {
      await db.exec(`insert into public.restaurants(id,name,category,verification_status) values('status-${status}','status fixture','test','${status}')`);
    }
    await assert.rejects(db.exec("insert into public.restaurants(id,name,category,verification_status) values('status-invalid','status fixture','test','unreviewed')"), error => error.code === '23514');
    await assert.rejects(db.exec("insert into public.restaurants(id,name,category,verification_status) values('status-null','status fixture','test',null)"), error => error.code === '23502');
    await assert.rejects(db.exec("update public.restaurants set verification_status='UNKNOWN' where id='status-pending'"), error => error.code === '23514');
    await db.exec("delete from public.restaurants where id like 'status-%'");
    await db.exec(seed); await db.exec(seed);
    assert.equal(Number(await scalar('select count(*) from public.restaurants')),20);
    assert.equal(Number(await scalar("select count(*) from public.restaurants where address is null and latitude is null and representative_price is null")),20);
    assert.equal(Number(await scalar("select count(*) from pg_tables where schemaname='public' and rowsecurity")),7);
    assert.equal(Number(await scalar("select count(*) from public.restaurants where name in ('오천집 신촌점','더도이축산직영점 신촌점')")),2);
    await db.exec("update public.restaurants set address='Verified later' where id='sinchon-01'");
    await db.exec(seed);
    assert.equal(await scalar("select address from public.restaurants where id='sinchon-01'"),'Verified later');
    await assert.rejects(db.exec("insert into public.menus(restaurant_id,name,price) values('missing','test',1000)"));
    await assert.rejects(db.exec("insert into public.restaurants(id,name,category,latitude,longitude) values('bad','test','test',99,127)"));
    await db.exec("insert into public.review_tags(id,name) values(1,'test-only-tag')");
    await db.exec('set role anon');
    assert.equal(await scalar('select rolsuper from pg_roles where rolname=current_user'),false);
    assert.equal(Number(await scalar('select count(*) from public.restaurant_catalog')),20);
    assert.equal(Number(await scalar('select count(*) from public.menus')),0);
    assert.equal(Number(await scalar('select count(*) from public.reviews')),0);
    assert.equal(await scalar("select average_rating from public.restaurant_ratings where restaurant_id='sinchon-02'"),null);
    await assert.rejects(db.exec("insert into public.restaurants(id,name,category) values('no','no','no')"));
    await assert.rejects(db.exec(`insert into public.reviews(restaurant_id,user_id,rating,body) values('sinchon-02','${a}',4,'anonymous')`));
    await asUser(a);
    assert.equal(await scalar('select rolsuper from pg_roles where rolname=current_user'),false);
    await db.exec(`insert into public.profiles(id,display_name) values('${a}','A')`);
    await assert.rejects(db.exec(`insert into public.profiles(id,display_name) values('${b}','spoof')`));
    await assert.rejects(db.exec(`insert into public.reviews(restaurant_id,user_id,rating,body) values('sinchon-02','${a}',6,'bad')`));
    await assert.rejects(db.exec(`insert into public.reviews(restaurant_id,user_id,rating,body) values('sinchon-02','${a}',4,' ')`));
    await assert.rejects(db.exec(`insert into public.reviews(restaurant_id,user_id,rating,body) values('sinchon-02','${b}',4,'spoof')`));
    const first=(await db.query(`insert into public.reviews(restaurant_id,user_id,rating,body) values('sinchon-02','${a}',2,'first') returning id`)).rows[0].id;
    await db.exec('select pg_sleep(0.01)');
    const second=(await db.query(`insert into public.reviews(restaurant_id,user_id,rating,body) values('sinchon-02','${a}',5,'second') returning id`)).rows[0].id;
    await db.exec(`insert into public.review_tag_links(review_id,tag_id) values('${second}',1); insert into public.favorites(user_id,restaurant_id) values('${a}','sinchon-02');`);
    await assert.rejects(db.exec(`insert into public.favorites(user_id,restaurant_id) values('${a}','sinchon-02')`));
    await assert.rejects(db.exec(`update public.reviews set user_id='${b}' where id='${second}'`));
    await assert.rejects(db.exec(`update public.reviews set created_at=now() where id='${first}'`));
    await db.exec(`update public.reviews set body='edited old',rating=1 where id='${first}'`);
    await asUser(b);
    await db.exec(`insert into public.profiles(id,display_name) values('${b}','B')`);
    assert.equal(Number(await scalar('select count(*) from public.profiles')),1);
    assert.equal(Number(await scalar('select count(*) from public.favorites')),0);
    assert.equal((await db.query(`update public.profiles set display_name='attack' where id='${a}' returning id`)).rows.length,0);
    await assert.rejects(db.exec(`insert into public.favorites(user_id,restaurant_id) values('${a}','sinchon-01')`));
    assert.equal((await db.query(`update public.reviews set body='attack' where id='${second}' returning id`)).rows.length,0);
    assert.equal((await db.query(`delete from public.reviews where id='${second}' returning id`)).rows.length,0);
    assert.equal((await db.query(`delete from public.favorites where user_id='${a}' returning user_id`)).rows.length,0);
    assert.equal((await db.query(`delete from public.review_tag_links where review_id='${second}' returning review_id`)).rows.length,0);
    await assert.rejects(db.exec(`insert into public.review_tag_links(review_id,tag_id) values('${first}',1)`));
    await assert.rejects(db.exec("update public.restaurants set name='attack' where id='sinchon-02'"));
    await assert.rejects(db.exec("insert into public.menus(restaurant_id,name) values('sinchon-02','attack')"));
    await db.exec(`insert into public.reviews(restaurant_id,user_id,rating,body) values('sinchon-02','${b}',3,'B')`);
    let summary=(await db.query("select * from public.restaurant_ratings where restaurant_id='sinchon-02'")).rows[0];
    assert.equal(Number(summary.average_rating),4); assert.equal(Number(summary.reviewer_count),2); assert.equal(Number(summary.review_count),3);
    await asUser(a);
    await db.exec(`delete from public.reviews where id='${second}'`);
    summary=(await db.query("select * from public.restaurant_ratings where restaurant_id='sinchon-02'")).rows[0];
    assert.equal(Number(summary.average_rating),2); assert.equal(Number(summary.reviewer_count),2); assert.equal(Number(summary.review_count),2);
    assert.equal(Number(await scalar('select count(*) from public.review_tag_links')),0);
    await db.exec(`delete from public.favorites where restaurant_id='sinchon-02'; delete from public.reviews where id='${first}'; delete from public.profiles where id='${a}';`);
    await db.exec('reset role; set role anon');
    assert.equal(Number(await scalar("select count(*) from public.reviews where restaurant_id='sinchon-02'")),1);
    assert.equal(Number(await scalar("select reviewer_count from public.restaurant_ratings where restaurant_id='sinchon-02'")),1);
    // Privileged fixture only: same timestamp proves UUID DESC tie handling.
    await db.exec(`reset role; alter table public.reviews disable trigger reviews_timestamps; insert into public.reviews(id,restaurant_id,user_id,rating,body,created_at) values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1','sinchon-03','${b}',1,'tie first','2026-01-01T00:00:00Z'),('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2','sinchon-03','${b}',5,'tie second','2026-01-01T00:00:00Z'); alter table public.reviews enable trigger reviews_timestamps; set role anon;`);
    assert.equal(Number(await scalar("select average_rating from public.restaurant_ratings where restaurant_id='sinchon-03'")),5);
  } finally { await db.close(); }
});
