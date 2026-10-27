import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const initial=readFileSync('supabase/migrations/202610280001_initial_schema.sql','utf8');
const phase4=readFileSync('supabase/migrations/202610280002_reviews_favorites.sql','utf8');
const seed=readFileSync('supabase/seed.sql','utf8');

test('Phase4 atomic reviews, idempotency, RLS, author projection and favorites (local PostgreSQL)',async t=>{
 const db=new PGlite();
 const a='11111111-1111-4111-8111-111111111111',b='22222222-2222-4222-8222-222222222222';
 const first='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',second='aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',third='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1';
 const scalar=async sql=>Object.values((await db.query(sql)).rows[0])[0];
 const user=async id=>db.exec(`reset role;set role authenticated;select set_config('request.jwt.claim.sub','${id}',false);`);
 const save=(id,rating,body,tags='array[1]::bigint[]',creating=true)=>`select public.save_review('${id}','sinchon-02',${rating},'${body}',${tags},${creating})`;
 try {
  await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;insert into auth.users values('${a}'),('${b}');`);
  await db.exec(initial);await db.exec(seed);await db.exec(phase4);
  // Only local test fixtures. No tag definitions or fake reviews are seeded remotely.
  await db.exec(`insert into public.review_tags(id,name) values(1,'local fixture one'),(2,'local fixture two');insert into auth.users values('33333333-3333-4333-8333-333333333333');insert into public.profiles(id,display_name) values('${a}','Author A'),('${b}','Author B'),('33333333-3333-4333-8333-333333333333','No public review');set role anon;`);
  await t.test('anon public reads, NULL ratings, no private profiles and no RPC writes',async()=>{
   assert.equal(Number(await scalar('select count(*) from public.restaurant_catalog')),20);
   assert.equal(await scalar("select average_rating from public.restaurant_ratings where restaurant_id='sinchon-02'"),null);
   await assert.rejects(db.exec(save(first,2,'anonymous')),e=>e.code==='42501');
   await assert.rejects(db.exec('select * from public.profiles'),e=>e.code==='42501');
   assert.equal(await scalar("select prosecdef from pg_proc where oid='public.save_review(uuid,text,integer,text,bigint[],boolean)'::regprocedure"),false);
   assert.equal(await scalar("select has_function_privilege('anon','public.save_review(uuid,text,integer,text,bigint[],boolean)','execute')"),false);
   assert.equal(await scalar("select has_function_privilege('authenticated','public.save_review(uuid,text,integer,text,bigint[],boolean)','execute')"),true);
  });
  await user(a);
  await t.test('create, retry and repeated independent reviews are distinct',async()=>{
   await db.exec(save(first,2,'first'));await db.exec(save(first,5,'retry does not overwrite'));
   assert.equal(Number(await scalar('select count(*) from public.reviews')),1);
   assert.equal(await scalar(`select body from public.reviews where id='${first}'`),'first');
   await db.exec(save(second,5,'second','array[2]::bigint[]'));
   assert.equal(Number(await scalar('select count(*) from public.reviews')),2);
   assert.equal(Number(await scalar("select average_rating from public.restaurant_ratings where restaurant_id='sinchon-02'")),5);
   assert.equal(Number(await scalar("select reviewer_count from public.restaurant_ratings where restaurant_id='sinchon-02'")),1);
  });
  await t.test('invalid ratings, body, absent id and invalid tags fail without partial writes',async()=>{
   for(const sql of [save(third,0,'bad'),save(third,6,'bad'),save(third,3,' '),save(third,3,'x'.repeat(5001)),save(third,3,'bad','array[999]::bigint[]'),save(third,3,'missing','array[]::bigint[]',false)]) await assert.rejects(db.exec(sql));
   await assert.rejects(db.exec(`select public.save_review('${third}','sinchon-02',3,E'\\n\\t',array[]::bigint[],true)`));
   await assert.rejects(db.exec(save(second,1,'must roll back','array[999]::bigint[]',false)));
   assert.equal(await scalar(`select body from public.reviews where id='${second}'`),'second');
   assert.equal(Number(await scalar(`select tag_id from public.review_tag_links where review_id='${second}'`)),2);
   assert.equal(Number(await scalar('select count(*) from public.reviews')),2);
   const oversized=`array[${Array.from({length:11},()=>1).join(',')}]::bigint[]`;
   await assert.rejects(db.exec(save(third,3,'too many tags',oversized)));
  });
  await t.test('owner updates tags atomically and cannot move review identity',async()=>{
   await db.exec(save(first,1,'edited older','array[1,2,2]::bigint[]',false));
   assert.equal(Number(await scalar(`select count(*) from public.review_tag_links where review_id='${first}'`)),2);
   assert.equal(Number(await scalar("select average_rating from public.restaurant_ratings where restaurant_id='sinchon-02'")),5);
   await assert.rejects(db.exec(`update public.reviews set id='${third}' where id='${first}'`));
   await assert.rejects(db.exec(`select public.save_review('${first}','sinchon-03',3,'move',array[]::bigint[],false)`));
  });
  await t.test('late link insertion failure rolls back changed review and deleted links',async()=>{
   // Simulate a DB error AFTER the review UPDATE and old-links DELETE have run.
   await db.exec(`reset role;create function public.fixture_reject_link() returns trigger language plpgsql as $$begin raise exception 'fixture link failure';end;$$;create trigger fixture_reject_link before insert on public.review_tag_links for each row execute function public.fixture_reject_link();`);
   await user(a);
   await assert.rejects(db.exec(save(first,4,'must completely roll back','array[2]::bigint[]',false)));
   assert.equal(await scalar(`select body from public.reviews where id='${first}'`),'edited older');
   assert.equal(Number(await scalar(`select rating from public.reviews where id='${first}'`)),1);
   assert.equal(Number(await scalar(`select count(*) from public.review_tag_links where review_id='${first}'`)),2);
   await db.exec('reset role;drop trigger fixture_reject_link on public.review_tag_links;drop function public.fixture_reject_link();');
   await user(a);
  });
  await user(b);
  await t.test('other account cannot update/delete reviews, tags or see private profiles/favorites',async()=>{
   await assert.rejects(db.exec(save(first,5,'attack','array[]::bigint[]',false)));
   await assert.rejects(db.exec(save(first,5,'attack','array[]::bigint[]',true)));
   assert.equal((await db.query(`delete from public.reviews where id='${first}' returning id`)).rows.length,0);
   await assert.rejects(db.exec(`insert into public.review_tag_links values('${second}',1)`));
   assert.equal((await db.query(`delete from public.review_tag_links where review_id='${second}' returning review_id`)).rows.length,0);
   assert.equal(Number(await scalar(`select count(*) from public.profiles where id='${a}'`)),0);
   await db.exec(save(third,3,'B review','array[]::bigint[]'));
   assert.equal(Number(await scalar("select average_rating from public.restaurant_ratings where restaurant_id='sinchon-02'")),4);
  });
  await user(a);
  await t.test('latest deletion restores previous rating and cascades tag links',async()=>{
   await db.exec(`delete from public.reviews where id='${second}'`);
   assert.equal(Number(await scalar(`select count(*) from public.review_tag_links where review_id='${second}'`)),0);
   assert.equal(Number(await scalar("select average_rating from public.restaurant_ratings where restaurant_id='sinchon-02'")),2);
   assert.equal(Number(await scalar("select review_count from public.restaurant_ratings where restaurant_id='sinchon-02'")),2);
   assert.equal(Number(await scalar("select reviewer_count from public.restaurant_ratings where restaurant_id='sinchon-02'")),2);
  });
  await t.test('favorite idempotent insertion, re-read persistence and account isolation',async()=>{
   await db.exec(`insert into public.favorites(user_id,restaurant_id) values('${a}','sinchon-02') on conflict do nothing;insert into public.favorites(user_id,restaurant_id) values('${a}','sinchon-02') on conflict do nothing;`);
   assert.equal(Number(await scalar('select count(*) from public.favorites')),1);
   await user(b);assert.equal(Number(await scalar('select count(*) from public.favorites')),0);
   await assert.rejects(db.exec(`insert into public.favorites(user_id,restaurant_id) values('${a}','sinchon-01')`));
   assert.equal((await db.query(`delete from public.favorites where user_id='${a}' returning user_id`)).rows.length,0);
   await user(a);assert.equal(Number(await scalar('select count(*) from public.favorites')),1);
   await db.exec(`delete from public.favorites where user_id='${a}' and restaurant_id='sinchon-02'`);
   assert.equal(Number(await scalar('select count(*) from public.favorites')),0);
  });
  await db.exec('reset role;set role anon');
  await t.test('author projection exposes review id and display name only; profiles stays private',async()=>{
   const rows=(await db.query('select * from public.review_author_names order by review_id')).rows;
   assert.deepEqual(Object.keys(rows[0]).sort(),['display_name','review_id']);
   assert.equal(rows.length,2);assert(rows.some(r=>r.display_name==='Author A'));assert(rows.some(r=>r.display_name==='Author B'));
   assert(!rows.some(r=>r.display_name==='No public review'));
   await assert.rejects(db.exec('select id from public.review_author_names'));
   await assert.rejects(db.exec('select display_name from public.profiles'));
  });
 } finally {await db.close();}
});
