import assert from 'node:assert/strict';
import nextEnv from '@next/env';
import { readSupabaseConfig } from '../src/lib/supabase/config.ts';

nextEnv.loadEnvConfig(process.cwd(),true,{info(){},error(){}});
const base=process.env.BASE_URL||'http://127.0.0.1:3000';
for(const route of ['/login','/signup']) {
 const response=await fetch(base+route);
 const html=await response.text();
 assert.equal(response.status,200);
 assert(html.includes(`data-auth-form="${route.slice(1)}"`));
 assert(response.headers.get('cache-control').includes('no-store'));
 assert(!html.includes('sb_secret_'));
}
const protectedResponse=await fetch(base+'/mypage',{redirect:'manual'});
assert.equal(protectedResponse.status,307);
assert.equal(protectedResponse.headers.get('location'),'/login?next=%2Fmypage');
const unsafe=await fetch(base+'/login?next=https%3A%2F%2Fevil.test');
assert((await unsafe.text()).includes('name="next" value="/mypage"'));
const confirm=await fetch(base+'/auth/confirm');
assert((await confirm.text()).includes('인증 링크가 올바르지 않습니다'));
assert.equal(confirm.headers.get('referrer-policy'),'no-referrer');
const config=readSupabaseConfig(process.env);
assert(config.ok,'public config required for forged-session test');
const cookieName=`sb-${new URL(config.config.url).hostname.split('.')[0]}-auth-token`;
const session={access_token:`e30.${Buffer.from(JSON.stringify({sub:'11111111-1111-4111-8111-111111111111',exp:Math.floor(Date.now()/1000)+3600})).toString('base64url')}.invalid`,refresh_token:'forged-fixture',expires_at:Math.floor(Date.now()/1000)+3600,user:{id:'11111111-1111-4111-8111-111111111111',email:'forged@example.invalid'}};
const forged=await fetch(base+'/mypage',{redirect:'manual',headers:{cookie:`${cookieName}=base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`}});
assert.equal(forged.status,307,'forged cookie must not access mypage');
assert.equal(forged.headers.get('location'),'/login?next=%2Fmypage');
console.log('PASS: login/signup, no-store, protected mypage, unsafe redirect fallback, invalid email link and forged-session rejection. No real account created.');
