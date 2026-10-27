import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReview, parseFavorite, communityError } from '../src/lib/community/validation.ts';
import { saveReview, deleteReview, setFavorite } from '../src/lib/community/operations.ts';
const id='11111111-1111-4111-8111-111111111111';
const input={id,restaurantId:'sinchon-01',rating:'5',body:'실제 작성 내용',tagIds:['1','2'],creating:true};
test('review validation requires known input shapes,1..5 integer,trimmed1..5000,UUID and tag IDs',()=>{
 assert.equal(parseReview(input).ok,true);
 for(const patch of [{rating:'0'},{rating:'6'},{rating:'1.5'},{body:' '},{body:'x'.repeat(5001)},{id:'no'},{tagIds:['NaN']},{tagIds:Array.from({length:11},(_,i)=>String(i+1))}]) assert.equal(parseReview({...input,...patch}).ok,false);
 assert.equal(parseReview({...input,tagIds:['1','1']}).ok,false);
 assert.equal(parseReview({...input,body:'<script>alert(1)</script>'}).ok,true,'text is escaped by React, not stored as HTML');
});
test('favorite requires explicit desired state and approved-shaped restaurant ID',()=>{
 assert.equal(parseFavorite({restaurantId:'sinchon-20',desired:'on'}).ok,true);
 assert.equal(parseFavorite({restaurantId:'sinchon-01',desired:'off'}).ok,true);
 assert.equal(parseFavorite({restaurantId:'sinchon-01',desired:'toggle'}).ok,false);
 assert.equal(parseFavorite({restaurantId:'../x',desired:'on'}).ok,false);
 assert.equal(parseFavorite({restaurantId:'sinchon-01',desired:['on']}).ok,false);
});
test('all mutation functions block guests without contacting DB',async()=>{
 const client={rpc(){throw Error('unexpected');},from(){throw Error('unexpected');}};
 assert.equal((await saveReview(client,null,input)).status,'error');
 assert.equal((await deleteReview(client,null,id,'sinchon-01')).status,'error');
 assert.equal((await setFavorite(client,null,{restaurantId:'sinchon-01',desired:'on'})).status,'error');
});
test('review saves use atomic RPC without trusting supplied user ID; provider error is safe',async()=>{
 let sent;
 const client={async rpc(name,args){sent={name,args};return {data:id,error:null};}};
 assert.equal((await saveReview(client,'verified-owner',{...input,user_id:'attacker'})).status,'success');
 assert.equal(sent.name,'save_review');assert.equal(sent.args.p_id,id);assert(!('user_id' in sent.args));
 const result=await saveReview({async rpc(){return {data:null,error:{code:'PGRST202',message:'secret'}};}},'verified-owner',input);
 assert.equal(result.status,'error');assert(!result.message.includes('secret'));assert(result.message.includes('DB'));
});
test('delete uses verified owner filter and refuses zero-row success',async()=>{
 const filters=[];
 const client={from(){return {delete(){return {eq(key,value){filters.push([key,value]);return this;},async select(){return {data:[],error:null};}};}};}};
 assert.equal((await deleteReview(client,'verified-owner',id,'sinchon-01')).status,'error');
 assert(filters.some(([key,value])=>key==='user_id'&&value==='verified-owner'));
});
test('favorite addition is idempotent, removal explicit and real state is read after error',async()=>{
 const calls=[];
 const client={from(){return {async upsert(row,options){calls.push([row,options]);return {error:null};},select(){return {eq(){return this;},async maybeSingle(){return {data:{restaurant_id:'sinchon-01'},error:null};}};}};}};
 const result=await setFavorite(client,'verified-owner',{restaurantId:'sinchon-01',desired:'on'});
 assert.equal(result.status,'success');assert.equal(result.favorite,true);
 assert.deepEqual(calls[0],[{user_id:'verified-owner',restaurant_id:'sinchon-01'},{onConflict:'user_id,restaurant_id',ignoreDuplicates:true}]);
 client.from=()=>({async upsert(){return {error:{message:'secret'}};},select(){return {eq(){return this;},async maybeSingle(){return {data:null,error:null};}};}});
 const failed=await setFavorite(client,'verified-owner',{restaurantId:'sinchon-01',desired:'on'});
 assert.equal(failed.status,'error');assert.equal(failed.favorite,false);assert(!failed.message.includes('secret'));
});
test('errors do not leak raw database details',()=>{
 for(const code of ['42501','23503','23514','PGRST202','unexpected']) assert(!communityError({code,message:'secret-key-email'}).includes('secret-key-email'));
});
