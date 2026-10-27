import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const initial=readFileSync('supabase/migrations/202610280001_initial_schema.sql','utf8');
const seed=readFileSync('supabase/seed.sql','utf8');
const migration=readFileSync('supabase/migrations/202610280003_verified_locations.sql','utf8');
const verified=JSON.parse(readFileSync('data/restaurant-locations.json','utf8')).locations.filter(row=>row.status==='verified');
const user='11111111-1111-4111-8111-111111111111';
async function database() {
 const db=new PGlite();
 await db.exec(`create role anon nologin;create role authenticated nologin;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;insert into auth.users values('${user}');`);
 await db.exec(initial);await db.exec(seed);
 await db.exec(`insert into public.profiles(id,display_name) values('${user}','local owner');insert into public.menus(restaurant_id,name,price) values('sinchon-02','local fixture',12345);insert into public.reviews(restaurant_id,user_id,rating,body) values('sinchon-02','${user}',4,'local fixture review');insert into public.favorites(user_id,restaurant_id) values('${user}','sinchon-02');`);
 return db;
}
const rows=async db=>(await db.query('select * from public.restaurants order by id')).rows;
const unrelated=async db=>{
 const result={};
 for(const table of ['profiles','menus','reviews','favorites','restaurant_ratings'])result[table]=(await db.query(`select * from public.${table} order by 1`)).rows;
 return result;
};
test('verified locations migration matches registry, preserves unknown data and replays without changes',async()=>{
 const db=await database();
 try {
  assert(verified.length>0);
  const before=await rows(db),beforeUnrelated=await unrelated(db);
  await db.exec(migration);
  const after=await rows(db);
  assert.equal(after.length,20);
  assert.equal(after.filter(row=>row.latitude!==null&&row.longitude!==null).length,verified.length);
  assert.equal(after.filter(row=>row.latitude===null&&row.longitude===null).length,20-verified.length);
  for(const location of verified){
   const row=after.find(row=>row.id===location.id);
   assert.equal(row.name,location.name);assert.equal(row.address,location.address);
   assert.equal(row.latitude,location.latitude);assert.equal(row.longitude,location.longitude);
   assert.equal(row.source_url,before.find(item=>item.id===location.id).source_url??location.sourceUrl);assert.equal(row.verification_status,'partial');assert.equal(row.verified_at,null);
  }
  const changed=new Set(['address','latitude','longitude','source_url','verification_status','updated_at']);
  for(let i=0;i<before.length;i++)for(const [key,value] of Object.entries(before[i]))if(!changed.has(key)||!verified.some(row=>row.id===before[i].id))assert.deepEqual(after[i][key],value,`${before[i].id} ${key}`);
  assert.deepEqual(await unrelated(db),beforeUnrelated);
  await db.exec(migration);
  assert.deepEqual(await rows(db),after,'replay must not touch even timestamps');
  assert.deepEqual(await unrelated(db),beforeUnrelated);
 } finally {await db.close();}
});
test('existing conflicting last location aborts all rows and preserves original values',async()=>{
 const db=await database();
 try {
  const target=verified.at(-1);
  await db.query('update public.restaurants set latitude=$1,longitude=$2 where id=$3',[37.5,126.8,target.id]);
  const before=await rows(db),beforeUnrelated=await unrelated(db);
  await assert.rejects(db.exec(migration));await db.exec('rollback');
  assert.deepEqual(await rows(db),before,'earlier verified rows must roll back too');
  assert.deepEqual(await unrelated(db),beforeUnrelated);
 } finally {await db.close();}
});
test('name mismatch fails closed and existing source/verification metadata stays intact',async()=>{
 const db=await database();
 try {
  const target=verified.at(-1);
  await db.query('update public.restaurants set name=$1 where id=$2',['different branch fixture',target.id]);
  const before=await rows(db);
  await assert.rejects(db.exec(migration));await db.exec('rollback');assert.deepEqual(await rows(db),before);
  await db.query('update public.restaurants set name=$1,address=$2,latitude=$3,longitude=$4,source_url=$5,verification_status=$6,verified_at=$7 where id=$8',[target.name,target.address,target.latitude,target.longitude,'https://example.invalid/preserved-source','verified','2026-01-01T00:00:00Z',target.id]);
  await db.exec(migration);
  const result=(await rows(db)).find(row=>row.id===target.id);
  assert.equal(result.source_url,'https://example.invalid/preserved-source');assert.equal(result.verification_status,'verified');assert.equal(new Date(result.verified_at).toISOString(),'2026-01-01T00:00:00.000Z');
 } finally {await db.close();}
});
test('missing approved ID aborts migration rather than creating a replacement restaurant',async()=>{
 const db=await database();
 try {
  await db.query('delete from public.restaurants where id=$1',[verified.at(-1).id]);
  const before=await rows(db);
  await assert.rejects(db.exec(migration));await db.exec('rollback');assert.deepEqual(await rows(db),before);
 } finally {await db.close();}
});
