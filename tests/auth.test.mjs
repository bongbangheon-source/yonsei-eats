import test from 'node:test';
import assert from 'node:assert/strict';
import { safeNext, validateCredentials, validateNickname, authMessage } from '../src/lib/auth/validation.ts';
import { signUpAccount, signInAccount, signOutAccount } from '../src/lib/auth/operations.ts';
import { ensureProfile, updateNickname } from '../src/lib/auth/profile.ts';
import { createCookieAuthClient } from '../src/lib/supabase/auth-client.ts';

test('safe internal return path preserves query and rejects redirect bypasses',()=>{
 assert.equal(safeNext('/?q=abc&category=x'),'/?q=abc&category=x');
 assert.equal(safeNext('/?q=%EC%98%A4%EC%B2%9C%EC%A7%91%20%EC%8B%A0%EC%B4%8C'),'/?q=%EC%98%A4%EC%B2%9C%EC%A7%91%20%EC%8B%A0%EC%B4%8C');
 for(const input of ['https://evil.test','//evil.test','/\\evil.test','/%2f%2fevil.test','/a/..//evil.test','/login','/signup?next=/login','/auth/confirm','/\n/evil.test','/%252f%252fevil.test']) assert.equal(safeNext(input),'/mypage',input);
});
test('signup validates email password confirmation and nickname; no password trimming',()=>{
 assert.equal(validateCredentials({email:'user@example.com',password:'12345678',confirm:'12345678',nickname:'연세인'},true),null);
 for(const change of [{email:'bad'},{password:'123'},{confirm:'different'},{nickname:'a'},{nickname:'x'.repeat(21)}]) assert(validateCredentials({email:'user@example.com',password:'12345678',confirm:'12345678',nickname:'연세인',...change},true));
 assert(validateNickname('   '));
 assert.equal(validateCredentials({email:'user@example.com',password:'short'},false),null,'legacy login passwords are not rejected by signup rules');
});
test('safe auth messages never include raw provider errors',()=>{
 for(const code of ['invalid_credentials','email_not_confirmed','user_already_exists','over_email_send_rate_limit','unexpected_failure']) {
  const message=authMessage({code,message:'secret-password-token'});
  assert(!message.includes('secret-password-token'));
 }
});
const input={email:'user@example.com',password:'12345678',confirm:'12345678',nickname:'연세인'};
test('signup passes nickname metadata; no session means confirmation notice, not login',async()=>{
 let sent;
 const result=await signUpAccount({signUp:async value=>{sent=value;return {data:{user:{id:'id'},session:null},error:null};}},input);
 assert.equal(sent.options.data.display_name,'연세인');
 assert.equal(result.kind,'confirmation');
 assert(!JSON.stringify(result).includes(input.password));
});
test('signup session, safe duplicate messages, invalid input and network rejection',async()=>{
 const session={access_token:'private-token'};
 assert.equal((await signUpAccount({signUp:async()=>({data:{session},error:null})},input)).kind,'signed-in');
 assert.equal((await signUpAccount({signUp:async()=>({data:{},error:{code:'user_already_exists'}})},input)).kind,'error');
 let called=false;
 assert.equal((await signUpAccount({signUp:async()=>{called=true;}},{...input,confirm:'bad'})).kind,'error');
 assert.equal(called,false);
 const result=await signUpAccount({signUp:async()=>{throw new Error('secret');}},input);
 assert.equal(result.kind,'error');assert(!result.message.includes('secret'));
});
test('login requires an actual session; logout surfaces provider/network failures',async()=>{
 assert.equal((await signInAccount({signInWithPassword:async()=>({data:{session:{}},error:null})},input)).kind,'signed-in');
 assert.equal((await signInAccount({signInWithPassword:async()=>({data:{session:null},error:null})},input)).kind,'error');
 assert.equal((await signInAccount({signInWithPassword:async()=>({data:{},error:{code:'invalid_credentials'}})},input)).kind,'error');
 assert.equal((await signOutAccount({signOut:async()=>({error:null})})).kind,'signed-out');
 assert.equal((await signOutAccount({signOut:async()=>({error:{code:'unexpected'}})})).kind,'error');
});
function profileClient({writeError=null,readError=null,profile={id:'verified-id',display_name:'수정한 이름',avatar_url:null,created_at:'2026-01-01'}}={}) {
 const calls=[];
 return {calls,from(table){calls.push(['table',table]);return {
  async upsert(row,options){calls.push(['insert',row,options]);return {error:writeError};},
  select(){return {eq(key,id){calls.push(['select',key,id]);return {async maybeSingle(){return {data:profile,error:readError};}};}};},
  update(row){calls.push(['update',row]);return {eq(key,id){calls.push(['owner',key,id]);return {select(){return {async single(){return {data:profile,error:writeError};}};}};}};}
 };}};
}
test('profile creation is owner-bound, idempotent and does not overwrite updated nickname',async()=>{
 const client=profileClient();
 const result=await ensureProfile(client,{id:'verified-id',user_metadata:{display_name:'가입 이름'}});
 assert.equal(result.ok,true);assert.equal(result.profile.display_name,'수정한 이름');
 assert.deepEqual(client.calls.find(c=>c[0]==='insert').slice(1),[{id:'verified-id',display_name:'가입 이름'},{onConflict:'id',ignoreDuplicates:true}]);
 assert(client.calls.some(c=>c[0]==='select'&&c[2]==='verified-id'));
});
test('profile errors are recoverable and never disclose raw DB details',async()=>{
 const result=await ensureProfile(profileClient({writeError:{message:'secret'}}),{id:'verified-id',user_metadata:{}});
 assert.equal(result.ok,false);assert(!result.message.includes('secret'));
 const missing=await ensureProfile(profileClient({profile:null}),{id:'verified-id',user_metadata:{}});
 assert.equal(missing.ok,false);
});
test('nickname updates target verified user ID and reject bad names',async()=>{
 const client=profileClient();
 assert.equal((await updateNickname(client,'verified-id','새 이름')).ok,true);
 assert(client.calls.some(c=>c[0]==='owner'&&c[2]==='verified-id'));
 const invalid=profileClient();assert.equal((await updateNickname(invalid,'verified-id','a')).ok,false);assert.equal(invalid.calls.length,0);
});

test('SSR SDK persists cookies across clients, verifies user remotely, refreshes and logs out (fixture)',async()=>{
 const config={url:'https://fixture.supabase.co',key:'sb_publishable_fixture'};
 const user={id:'11111111-1111-4111-8111-111111111111',email:'fixture@example.invalid',aud:'authenticated',created_at:new Date().toISOString(),user_metadata:{}};
 const jwt=(exp)=>`e30.${Buffer.from(JSON.stringify({sub:user.id,exp,iat:1,role:'authenticated'})).toString('base64url')}.fixture`;
 const session={access_token:jwt(Math.floor(Date.now()/1000)+3600),refresh_token:'fixture-refresh',token_type:'bearer',expires_in:3600,user};
 const jar=new Map();const writes=[];const calls=[];
 const cookies={getAll:()=>[...jar].map(([name,value])=>({name,value})),setAll:(values,headers)=>{writes.push({values,headers});for(const item of values){if(item.options.maxAge===0)jar.delete(item.name);else jar.set(item.name,item.value);}}};
 const fetcher=async(input)=>{const url=new URL(String(input));calls.push(url.pathname+url.search);return new Response(JSON.stringify(url.pathname.endsWith('/user')?user:url.pathname.endsWith('/logout')?{}:session),{status:200,headers:{'Content-Type':'application/json'}});};
 const first=createCookieAuthClient(config,cookies,false,fetcher);
 assert.equal((await first.auth.signInWithPassword({email:user.email,password:'fixture-only'})).error,null);
 assert(jar.size>0);assert(writes.some(w=>Object.values(w.headers).some(value=>value.includes('no-store'))));
 assert(writes.flatMap(w=>w.values).every(c=>c.options.httpOnly&&c.options.sameSite==='lax'&&c.options.maxAge>0));
 const reopened=createCookieAuthClient(config,cookies,false,fetcher);
 assert.equal((await reopened.auth.getUser()).data.user.id,user.id);
 assert(calls.some(c=>c.endsWith('/user')),'server validation is a network user request, not cookie-only');
 assert.equal((await reopened.auth.refreshSession()).error,null);
 assert(calls.some(c=>c.includes('grant_type=refresh_token')));
 assert.equal((await reopened.auth.signOut({scope:'local'})).error,null);
 assert.equal(jar.size,0);
});
