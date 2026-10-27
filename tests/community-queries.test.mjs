import test from 'node:test';
import assert from 'node:assert/strict';
import { getReviewPage, getMyFavorites, reviewPageNumber } from '../src/lib/community/queries.ts';
const id='11111111-1111-4111-8111-111111111111';
function client({reviewError=null,authorError=null,tagError=null,favoriteError=null,rows=[]}={}) {
 const calls=[];
 return {calls,from(table){const query={select(...args){calls.push([table,'select',...args]);return this;},eq(...args){calls.push([table,'eq',...args]);return this;},order(...args){calls.push([table,'order',...args]);return this;},range(...args){calls.push([table,'range',...args]);return this;},limit(){return this;},in(){return this;},then(resolve,reject){const result=table==='reviews'?{data:rows,error:reviewError,count:rows.length}:table==='review_author_names'?{data:[{review_id:id,display_name:null}],error:authorError}:table==='review_tags'?{data:[],error:tagError}:{data:[],error:favoriteError};return Promise.resolve(result).then(resolve,reject);}};return query;}};
}
test('public review retrieval maps real body/tags, missing nickname and deterministic pagination',async()=>{
 const db=client({rows:[{id,restaurant_id:'sinchon-01',user_id:'verified-id',rating:4,body:'<script>text only</script>',created_at:'2026-10-28T00:00:00Z',updated_at:'2026-10-28T00:00:00Z',restaurants:{name:'DB 식당명'},review_tag_links:[{review_tags:{id:3,name:'DB 실제 태그'}}]}]});
 const data=await getReviewPage(db,{restaurantId:'sinchon-01',page:2});
 assert.equal(data.error,null);assert.equal(data.reviews[0].author,'익명 사용자');assert.equal(data.reviews[0].body,'<script>text only</script>');assert.equal(data.reviews[0].tags[0].id,3);
 assert(db.calls.some(c=>c[1]==='eq'&&c[2]==='restaurant_id'));
 assert.deepEqual(db.calls.filter(c=>c[1]==='order'&&c[0]==='reviews').map(c=>[c[2],c[3].ascending]),[['created_at',false],['id',false]]);
 assert.deepEqual(db.calls.find(c=>c[1]==='range').slice(2),[20,39]);
});
test('missing migration or unavailable tags disable writing without fabricating reviews',async()=>{
 const missing=await getReviewPage(client({authorError:{code:'PGRST205'}}),{page:1});
 assert.equal(missing.writeReady,false);assert.equal(missing.reviews.length,0);assert(missing.notice.includes('DB'));
 const tags=await getReviewPage(client({tagError:{code:'42501'}}),{page:1});assert.equal(tags.writeReady,false);
 const empty=await getReviewPage(client(),{page:1});assert.equal(empty.writeReady,true);assert.equal(empty.total,0);assert.deepEqual(empty.tags,[]);
 const failed=await getReviewPage(client({reviewError:{message:'secret'}}),{page:1});assert(failed.error);assert(!failed.error.includes('secret'));
});
test('mypage reads explicitly filter the verified owner, guests never query favorites',async()=>{
 const db=client();await getReviewPage(db,{userId:'verified-owner',page:1});await getMyFavorites(db,'verified-owner');
 assert(db.calls.some(c=>c[0]==='reviews'&&c[1]==='eq'&&c[2]==='user_id'&&c[3]==='verified-owner'));
 assert(db.calls.some(c=>c[0]==='favorites'&&c[1]==='eq'&&c[2]==='user_id'&&c[3]==='verified-owner'));
 assert.deepEqual(await getMyFavorites({from(){throw Error('no query');}},null),{restaurants:[],error:null});
 assert((await getMyFavorites(client({favoriteError:{message:'secret'}}),'verified-owner')).error);
 assert.equal(reviewPageNumber('-1'),1);assert.equal(reviewPageNumber('2'),2);assert.equal(reviewPageNumber('999999'),100000);
});
