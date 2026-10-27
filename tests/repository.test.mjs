import test from 'node:test';
import { queryRestaurantCatalog } from '../src/lib/supabase/catalog.ts';
import assert from 'node:assert/strict';
import { loadRestaurantData, mapRestaurantRow, resolveRestaurantDetail } from '../src/lib/restaurant-repository.ts';
import { readSupabaseConfig } from '../src/lib/supabase/config.ts';
import { restaurants } from '../src/lib/restaurants.ts';

test('real SDK transport targets catalog with public key and no-store; preserves NULL', async()=>{
 let request;
 const result=await queryRestaurantCatalog({url:'https://example.supabase.co',key:'sb_publishable_fixture'},async(input,init)=>{
  request={url:new URL(String(input)),init};
  return new Response(JSON.stringify([row]),{status:200,headers:{'Content-Type':'application/json'}});
 });
 assert.equal(request.url.pathname,'/rest/v1/restaurant_catalog');
 assert.equal(request.url.searchParams.get('order'),'id.asc');
 assert(request.url.searchParams.get('select').includes('average_rating'));
 assert.equal(new Headers(request.init.headers).get('apikey'),'sb_publishable_fixture');
 assert.equal(request.init.cache,'no-store');
 assert.equal(result.error,null);
 assert.equal(result.data[0].address,null);
});

const row={id:'sinchon-02',name:'오천집 신촌점',category:'한식·국밥',address:null,latitude:null,longitude:null,representative_menu:null,representative_price:null,opening_hours:null,photo_url:null,operating_status:null,average_rating:null,reviewer_count:0,review_count:0};
const valid={NEXT_PUBLIC_SUPABASE_URL:'https://test.supabase.co',NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_publishable_test_public_key'};
const publicJwt=`e30.${Buffer.from(JSON.stringify({role:'anon'})).toString('base64url')}.test`;

test('transport diagnostics retain network code but redact URL, key and raw error', async()=>{
 const logs=[];
 const original=console.error;
 console.error=(...args)=>logs.push(args.join(' '));
 try {
  const failure=new Error('sensitive URL and key must not appear',{cause:{code:'EACCES',address:'sensitive-host'}});
  failure.name='AbortError';
  const result=await queryRestaurantCatalog({url:'https://private-project.supabase.co',key:'sb_publishable_private_fixture'},async()=>{throw failure;});
  assert(result.error);
  assert(logs.length>0);
  assert(logs.some(line=>line.includes('EACCES')));
  assert(!logs.join('').includes('sensitive'));
  assert(!logs.join('').includes('private-project'));
  assert(!logs.join('').includes('sb_publishable_private_fixture'));
 } finally { console.error=original; }
});

test('config rejects missing, malformed URL and privileged keys without returning key in error',()=>{
  assert.equal(readSupabaseConfig({}).ok,false);
  assert.equal(readSupabaseConfig({...valid,NEXT_PUBLIC_SUPABASE_URL:'not-a-url'}).ok,false);
  assert.equal(readSupabaseConfig({...valid,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:'sb_secret_do_not_expose'}).ok,false);
  const secretJwt=`e30.${Buffer.from(JSON.stringify({role:'service_role'})).toString('base64url')}.secret`;
  assert.equal(readSupabaseConfig({...valid,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:secretJwt}).ok,false);
  assert.equal(readSupabaseConfig(valid).ok,true);
  assert.equal(readSupabaseConfig({...valid,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:publicJwt}).ok,true);
});

test('missing config explicitly returns local recovery source and 20 rows, not fake DB success',async()=>{
 const result=await loadRestaurantData({env:{},local:restaurants,query:async()=>{throw new Error('must not call');}});
 assert.equal(result.source,'local-recovery'); assert.equal(result.restaurants.length,20); assert.match(result.notice,/설정/);
});

test('explicit local mode does not contact Supabase',async()=>{
 const result=await loadRestaurantData({env:{RESTAURANT_DATA_SOURCE:'local'},local:restaurants,query:async()=>{throw new Error('must not call');}});
 assert.equal(result.source,'local'); assert.equal(result.restaurants.length,20); assert.match(result.notice,/로컬/);
});

test('DB rows map nullable fields and true aggregate counts, with no local merging',async()=>{
 const result=await loadRestaurantData({env:valid,local:restaurants,query:async()=>({data:[{...row,average_rating:'4.5',reviewer_count:2,review_count:3}],error:null})});
 assert.equal(result.source,'supabase'); assert.equal(result.restaurants.length,1); assert.equal(result.restaurants[0].averageRating,4.5); assert.equal(result.restaurants[0].reviewCount,3); assert.equal(result.restaurants[0].reviewerCount,2); assert.equal(result.restaurants[0].address,null); assert.equal(result.notice,null);
});

test('successful empty DB response stays empty and explains seed; errors distinguish schema/RLS/network',async()=>{
 const empty=await loadRestaurantData({env:valid,local:restaurants,query:async()=>({data:[],error:null})});
 assert.equal(empty.source,'supabase'); assert.equal(empty.restaurants.length,0); assert.match(empty.notice,/초기 데이터/);
 for(const [code,message] of [['PGRST205','스키마'],['42501','권한'],['PGRST301','공개 키']]) {
  const result=await loadRestaurantData({env:valid,local:restaurants,query:async()=>({data:null,error:{code,message:'sensitive details must not appear'}})});
  assert.equal(result.source,'local-recovery');assert.match(result.notice,new RegExp(message));assert(!result.notice.includes('sensitive details'));
 }
 const failed=await loadRestaurantData({env:valid,local:restaurants,query:async()=>{throw new Error('network secret');}});
 assert.match(failed.notice,/연결/); assert(!failed.notice.includes('secret'));assert.equal(failed.restaurants.length,20);
});

test('malformed DB values recover visibly; no-review remains null',async()=>{
 assert.equal(mapRestaurantRow(row).averageRating,null);
 const result=await loadRestaurantData({env:valid,local:restaurants,query:async()=>({data:[{...row,representative_price:-1}],error:null})});
 assert.equal(result.source,'local-recovery');assert.match(result.notice,/형식/);
 const invalid=await loadRestaurantData({env:{...valid,RESTAURANT_DATA_SOURCE:'typo'},local:restaurants,query:async()=>{throw new Error('must not call');}});
 assert.equal(invalid.source,'local-recovery'); assert.match(invalid.notice,/모드/);
});

test('an unavailable DB-only ID is not misreported as a missing restaurant',()=>{
 assert.equal(resolveRestaurantDetail({source:'local-recovery',restaurants,notice:'connection failed'},'db-only-id').state,'unavailable');
 assert.equal(resolveRestaurantDetail({source:'supabase',restaurants:[],notice:null},'missing-id').state,'missing');
 assert.equal(resolveRestaurantDetail({source:'local',restaurants,notice:null},'missing-id').state,'missing');
 assert.equal(resolveRestaurantDetail({source:'local-recovery',restaurants,notice:'connection failed'},'sinchon-02').state,'found');
});
