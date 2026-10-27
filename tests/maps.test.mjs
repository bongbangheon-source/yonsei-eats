import test from 'node:test';
import assert from 'node:assert/strict';
import { restaurants } from '../src/lib/restaurants.ts';
import { isVerifiedLocation, splitMapResults } from '../src/lib/maps/locations.ts';
import { mapUrl, readMapState } from '../src/lib/maps/state.ts';

const row={...restaurants[4],address:'서울 서대문구 명물길 50-9',latitude:37.5587750739815,longitude:126.939459409798};
const evidence={id:row.id,name:row.name,status:'verified',address:row.address,latitude:row.latitude,longitude:row.longitude,sourceUrl:'https://korean.visitseoul.net/area/SobaLabSinchon/KOP1kjvs6',checkedAt:'2026-10-28'};
test('markers require field-level evidence plus exact DB identity/address/coordinate match',()=>{
 assert.equal(isVerifiedLocation(row,[evidence]),true);
 for(const patch of [{latitude:null},{longitude:0},{latitude:NaN},{address:null},{name:'other branch'}]) assert.equal(isVerifiedLocation({...row,...patch},[evidence]),false);
 for(const patch of [{status:'pending'},{status:'conflict'},{sourceUrl:null},{checkedAt:null},{latitude:90.1}]) assert.equal(isVerifiedLocation(row,[{...evidence,...patch}]),false);
 assert.equal(isVerifiedLocation(row,[]),false);
});
test('all 20 remain searchable; unverified locations never produce markers',()=>{
 const all=restaurants.map(r=>r.id===row.id?row:r);
 const result=splitMapResults(all,'','',[evidence]);
 assert.equal(result.results.length,20);assert.equal(result.markers.length,1);assert.equal(result.unlocated.length,19);
 const query=splitMapResults(all,row.name,row.category,[evidence]);assert.equal(query.markers.length,1);
 assert.equal(splitMapResults(all,row.name,'한식',[evidence]).results.length,0);
 assert.equal(splitMapResults(restaurants,'','',[evidence]).markers.length,0,'NULL DB is not silently enriched from a registry');
});
test('map URL preserves filters and valid selected, mobile view; strips unknown selection',()=>{
 const url=mapUrl('/map',{q:'오천집 신촌',category:'한식·국밥',selected:'sinchon-02',view:'list'});
 const params=new URL(url,'https://internal.invalid').searchParams;
 const state=readMapState(params,restaurants);
 assert.equal(state.q,'오천집 신촌');assert.equal(state.category,'한식·국밥');assert.equal(state.selected,'sinchon-02');assert.equal(state.view,'list');
 assert.equal(readMapState(new URLSearchParams('category=bad&selected=bad&view=bad'),restaurants).selected,null);
 assert.equal(readMapState(new URLSearchParams('q=없음&selected=sinchon-02'),restaurants).selected,null);
 assert.equal(new URL(mapUrl('/',state),'https://internal.invalid').pathname,'/');
});
