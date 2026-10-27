import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { PGlite } from '@electric-sql/pglite';

export async function auditDatabase(t) {
  const db=new PGlite();
  const a='11111111-1111-4111-8111-111111111111', b='22222222-2222-4222-8222-222222222222';
  const seed=readFileSync('supabase/seed.sql','utf8');
  const rows=async sql=>(await db.query(sql)).rows;
  const scalar=async sql=>Object.values((await rows(sql))[0])[0];
  const role=async (name,uid='')=>db.exec(`reset role; set role ${name}; select set_config('request.jwt.claim.sub','${uid}',false);`);
  const denied=async sql=>assert.rejects(db.exec(sql),error=>error.code==='42501');
  const constraint=async (sql,code)=>assert.rejects(db.exec(sql),error=>error.code===code);
  const tables=['profiles','restaurants','menus','reviews','review_tags','review_tag_links','favorites'];
  try {
    await db.exec(`create role anon nologin; create role authenticated nologin; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated; insert into auth.users values('${a}'),('${b}');`);
    await db.exec(readFileSync('supabase/migrations/202610280001_initial_schema.sql','utf8'));
    console.log('Local engine: '+await scalar('select version()'));

    await t.test('all seven PK/RLS, eight FK and leading lookup indexes; invoker views',async()=>{
      assert.equal(Number(await scalar("select count(*) from pg_constraint where connamespace='public'::regnamespace and contype='p'")),7);
      assert.equal(Number(await scalar("select count(*) from pg_constraint where connamespace='public'::regnamespace and contype='f'")),8);
      assert.equal(Number(await scalar("select count(*) from pg_tables where schemaname='public' and rowsecurity")),7);
      for(const index of ['menus_restaurant_idx','reviews_latest_idx','reviews_user_idx','review_tag_links_tag_idx','favorites_restaurant_idx']) {
        assert.equal(Number(await scalar(`select count(*) from pg_indexes where schemaname='public' and indexname='${index}'`)),1);
      }
      const latest=await scalar("select indexdef from pg_indexes where indexname='reviews_latest_idx'");
      assert.match(latest,/restaurant_id, user_id, created_at DESC, id DESC/);
      for(const view of ['restaurant_ratings','restaurant_catalog']) assert((await scalar(`select reloptions from pg_class where oid='public.${view}'::regclass`)).includes('security_invoker=true'));
      assert.equal(Number(await scalar("select count(*) from pg_index where indrelid='public.favorites'::regclass and indisprimary")),1);
    });

    await t.test('seed twice preserves 20 exact identities and all unknown NULL fields',async()=>{
      await db.exec(seed); await db.exec(seed);
      const original=JSON.parse(readFileSync('data/restaurants.json','utf8')).restaurants;
      const records=await rows('select * from public.restaurants order by id');
      assert.equal(records.length,20);
      for(const row of records) {
        const source=original.find(r=>r.id===row.id);
        assert(source); assert.equal(row.name,source.name);assert.equal(row.category,source.category);assert.equal(row.source_url,source.sourceUrl);
        for(const field of ['address','latitude','longitude','representative_menu','representative_price','opening_hours','photo_url','operating_status','verified_at','is_franchise']) assert.equal(row[field],null,`${row.id}.${field}`);
        assert.equal(row.verification_status,'pending');
      }
      for(const table of tables.filter(name=>name!=='restaurants')) assert.equal(Number(await scalar(`select count(*) from public.${table}`)),0);
      await constraint("insert into public.restaurants(id,name,category) values('sinchon-01','duplicate','test')",'23505');
    });

    await t.test('CHECK/NOT NULL/unique/FK constraints reject invalid rows',async()=>{
      for(const status of ['', 'UNKNOWN', 'pending ']) await constraint(`insert into public.restaurants(id,name,category,verification_status) values('invalid','test','test','${status}')`,'23514');
      await constraint("update public.restaurants set verification_status=null where id='sinchon-01'",'23502');
      for(const assignment of ["name=' '","category=''",'representative_price=-1','latitude=91','longitude=-181']) await constraint(`update public.restaurants set ${assignment} where id='sinchon-01'`,'23514');
      await constraint(`insert into public.profiles(id) values('33333333-3333-4333-8333-333333333333')`,'23503');
      await constraint("insert into public.menus(restaurant_id,name) values('missing','test')",'23503');
      await constraint("insert into public.menus(restaurant_id,name,price) values('sinchon-01','test',-1)",'23514');
      await constraint(`insert into public.reviews(restaurant_id,user_id,rating,body) values('missing','${a}',3,'test')`,'23503');
      await constraint(`insert into public.reviews(restaurant_id,user_id,rating,body) values('sinchon-01','33333333-3333-4333-8333-333333333333',3,'test')`,'23503');
      for(const rating of [0,6]) await constraint(`insert into public.reviews(restaurant_id,user_id,rating,body) values('sinchon-01','${a}',${rating},'test')`,'23514');
      await constraint(`insert into public.reviews(restaurant_id,user_id,rating,body) values('sinchon-01','${a}',3,repeat('x',5001))`,'23514');
      await constraint(`insert into public.favorites(user_id,restaurant_id) values('${a}','missing')`,'23503');
      await constraint(`insert into public.favorites(user_id,restaurant_id) values('33333333-3333-4333-8333-333333333333','sinchon-01')`,'23503');
      await constraint("insert into public.review_tag_links(review_id,tag_id) values('33333333-3333-4333-8333-333333333333',1)",'23503');
    });

    // Positive fixture rows exist so blocked UPDATE/DELETE cannot pass vacuously.
    await db.exec(`insert into public.profiles(id,display_name) values('${a}','A'),('${b}','B'); insert into public.menus(restaurant_id,name) values('sinchon-01','local test'); insert into public.review_tags(id,name) values(1,'local test');`);
    const ra=(await rows(`insert into public.reviews(restaurant_id,user_id,rating,body) values('sinchon-01','${a}',4,'A') returning id`))[0].id;
    const rb=(await rows(`insert into public.reviews(restaurant_id,user_id,rating,body) values('sinchon-01','${b}',2,'B') returning id`))[0].id;
    await db.exec(`insert into public.review_tag_links values('${ra}',1),('${rb}',1); insert into public.favorites(user_id,restaurant_id) values('${a}','sinchon-01'),('${b}','sinchon-01');`);
    await constraint(`insert into public.review_tag_links values('${ra}',999)`,'23503');
    await t.test('remaining table primary/unique keys and text CHECKs are enforced',async()=>{
      await constraint(`insert into public.profiles(id) values('${a}')`,'23505');
      await constraint("insert into public.menus(id,restaurant_id,name) select id,restaurant_id,name from public.menus limit 1",'23505');
      await constraint(`insert into public.reviews(id,restaurant_id,user_id,rating,body) values('${ra}','sinchon-01','${a}',3,'duplicate')`,'23505');
      await constraint("insert into public.review_tags(id,name) values(1,'duplicate')",'23505');
      await constraint("insert into public.review_tags(id,name) values(999,'local test')",'23505');
      await constraint(`insert into public.review_tag_links values('${ra}',1)`,'23505');
      await constraint(`insert into public.favorites(user_id,restaurant_id) values('${a}','sinchon-01')`,'23505');
      await constraint(`update public.profiles set display_name=' ' where id='${a}'`,'23514');
      await constraint("insert into public.menus(restaurant_id,name) values('sinchon-01',' ')",'23514');
      await constraint("insert into public.review_tags(name) values(' ')",'23514');
    });

    const inserts={profiles:`insert into public.profiles(id) values('${a}')`,restaurants:"insert into public.restaurants(id,name,category) values('blocked','test','test')",menus:"insert into public.menus(restaurant_id,name) values('sinchon-01','blocked')",reviews:`insert into public.reviews(restaurant_id,user_id,rating,body) values('sinchon-01','${a}',3,'blocked')`,review_tags:"insert into public.review_tags(name) values('blocked')",review_tag_links:`insert into public.review_tag_links values('${ra}',1)`,favorites:`insert into public.favorites(user_id,restaurant_id) values('${a}','sinchon-02')`};
    const updates={profiles:"display_name='blocked'",restaurants:"name='blocked'",menus:"name='blocked'",reviews:"body='blocked'",review_tags:"name='blocked'",review_tag_links:'tag_id=1',favorites:"restaurant_id='sinchon-02'"};

    await t.test('anon public reads; all inserts/updates/deletes/truncates blocked',async()=>{
      await role('anon');
      assert.equal(await scalar('select rolsuper from pg_roles where rolname=current_user'),false);
      for(const table of tables) {
        if(['profiles','favorites'].includes(table)) await denied(`select * from public.${table}`);
        else assert(Number(await scalar(`select count(*) from public.${table}`))>0);
        await denied(inserts[table]); await denied(`update public.${table} set ${updates[table]}`); await denied(`delete from public.${table}`); await denied(`truncate public.${table} cascade`);
      }
      assert.equal(Number(await scalar('select count(*) from public.restaurant_catalog')),20);
    });

    for(const [who,other,ownReview,otherReview] of [[a,b,ra,rb],[b,a,rb,ra]]) await t.test(`authenticated ${who===a?'A':'B'} owner CRUD and other-owner isolation`,async()=>{
      await role('authenticated',who);
      assert.equal(await scalar('select rolsuper from pg_roles where rolname=current_user'),false);
      assert.deepEqual((await rows('select id from public.profiles')).map(r=>r.id),[who]);
      assert.equal(Number(await scalar('select count(*) from public.favorites')),1);
      assert.equal((await rows(`update public.profiles set display_name='own edit' where id='${who}' returning id`)).length,1);
      assert.equal((await rows(`update public.profiles set display_name='attack' where id='${other}' returning id`)).length,0);
      assert.equal((await rows(`delete from public.profiles where id='${other}' returning id`)).length,0);
      await db.exec(`delete from public.profiles where id='${who}'; insert into public.profiles(id) values('${who}')`);
      await denied(`insert into public.profiles(id) values('${other}')`);
      assert.equal((await rows(`update public.reviews set rating=3,body='own edit' where id='${ownReview}' returning id`)).length,1);
      assert.equal((await rows(`update public.reviews set body='attack' where id='${otherReview}' returning id`)).length,0);
      assert.equal((await rows(`delete from public.reviews where id='${otherReview}' returning id`)).length,0);
      await denied(`insert into public.reviews(restaurant_id,user_id,rating,body) values('sinchon-01','${other}',3,'spoof')`);
      for(const assignment of [`user_id='${other}'`,"restaurant_id='sinchon-02'","id=gen_random_uuid()",'created_at=now()','updated_at=now()']) await denied(`update public.reviews set ${assignment} where id='${ownReview}'`);
      const inserted=(await rows(`insert into public.reviews(restaurant_id,user_id,rating,body) values('sinchon-02','${who}',5,'own insert') returning id`))[0].id;
      assert.equal((await rows(`delete from public.reviews where id='${inserted}' returning id`)).length,1);
      assert.equal((await rows(`delete from public.review_tag_links where review_id='${ownReview}' returning review_id`)).length,1);
      await db.exec(`insert into public.review_tag_links values('${ownReview}',1)`);
      assert.equal((await rows(`delete from public.review_tag_links where review_id='${otherReview}' returning review_id`)).length,0);
      await denied(`insert into public.review_tag_links values('${otherReview}',1)`);
      await denied(`update public.review_tag_links set tag_id=1 where review_id='${ownReview}'`);
      await db.exec(`insert into public.favorites(user_id,restaurant_id) values('${who}','sinchon-02')`);
      assert.equal((await rows(`delete from public.favorites where user_id='${who}' and restaurant_id='sinchon-02' returning user_id`)).length,1);
      assert.equal((await rows(`delete from public.favorites where user_id='${other}' returning user_id`)).length,0);
      await denied(`insert into public.favorites(user_id,restaurant_id) values('${other}','sinchon-02')`);
      await denied(`update public.favorites set restaurant_id='sinchon-02' where user_id='${who}'`);
      for(const table of ['restaurants','menus','review_tags']) { await denied(inserts[table]); await denied(`update public.${table} set ${updates[table]}`); await denied(`delete from public.${table}`); }
      for(const table of tables) await denied(`truncate public.${table} cascade`);
      for(const sequence of ['menus_id_seq','review_tags_id_seq']) await denied(`select nextval('public.${sequence}')`);
      for(const fn of ['set_row_timestamps','preserve_review_identity']) assert.equal(await scalar(`select has_function_privilege(current_user,'public.${fn}()','EXECUTE')`),false);
    });

    await t.test('authenticated role without auth.uid cannot claim private data or ownership',async()=>{
      await role('authenticated');
      assert.equal(Number(await scalar('select count(*) from public.profiles')),0);
      assert.equal(Number(await scalar('select count(*) from public.favorites')),0);
      for(const table of ['profiles','reviews','favorites','review_tag_links']) await denied(inserts[table]);
    });

    await t.test('invoker view cannot bypass revoked underlying permission',async()=>{
      await db.exec('reset role; revoke select on public.reviews from anon;');
      await role('anon'); await denied('select * from public.restaurant_ratings'); await denied('select * from public.restaurant_catalog');
      await db.exec('reset role; grant select on public.reviews to anon;');
    });

    await t.test('auth-user FK cascades remove own dependent rows and preserve other user',async()=>{
      await db.exec(`reset role; delete from auth.users where id='${b}'`);
      for(const [table,col] of [['profiles','id'],['reviews','user_id'],['favorites','user_id']]) assert.equal(Number(await scalar(`select count(*) from public.${table} where ${col}='${b}'`)),0);
      assert.equal(Number(await scalar(`select count(*) from public.review_tag_links where review_id='${rb}'`)),0);
      assert.equal(Number(await scalar(`select count(*) from public.reviews where id='${ra}'`)),1);
    });
  } finally { await db.close(); }
}
