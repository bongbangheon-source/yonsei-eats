import test from 'node:test';
import assert from 'node:assert/strict';
import { createSdkLoader } from '../src/lib/maps/sdk.ts';
import { createMapController } from '../src/lib/maps/controller.ts';

function environment() {
 const elements=[];const host={};
 const doc={createElement(){return {dataset:{},remove(){this.removed=true;}};},head:{appendChild(node){elements.push(node);}}};
 return {elements,host,doc};
}
test('SDK loader rejects missing key; load/error/auth/timeout are distinct and retryable',async()=>{
 const env=environment();const loader=createSdkLoader(env.host,env.doc,20);
 await assert.rejects(loader.load(''),error=>error.code==='missing-key');
 const ready=loader.load('fixture-public');assert.equal(env.elements.length,1);assert.match(env.elements[0].src,/ncpKeyId=fixture-public/);
 env.host.naver={maps:{Map(){}}};env.elements[0].onload();assert.equal(await ready,env.host.naver.maps);
 const e=environment();const failed=createSdkLoader(e.host,e.doc,10);
 const auth=failed.load('fixture');e.host.navermap_authFailure();await assert.rejects(auth,error=>error.code==='auth');
 const retry=failed.load('fixture');e.elements.at(-1).onerror();await assert.rejects(retry,error=>error.code==='network');
 await assert.rejects(failed.load('fixture'),error=>error.code==='timeout');
});
test('late auth failure is surfaced even after script loaded',async()=>{
 const env=environment();const loader=createSdkLoader(env.host,env.doc,20);let failure;
 const unsubscribe=loader.subscribe(error=>failure=error.code);
 const result=loader.load('fixture');env.host.naver={maps:{Map(){}}};env.elements[0].onload();await result;
 env.host.navermap_authFailure();assert.equal(failure,'auth');unsubscribe();
});
test('stale script failure cannot reject a newer retry',async()=>{
 const env=environment();const loader=createSdkLoader(env.host,env.doc,30);
 const first=loader.load('fixture');const old=env.elements[0];old.onerror();await assert.rejects(first);
 const second=loader.load('fixture');old.onerror();env.host.naver={maps:{Map(){}}};env.elements[1].onload();
 assert.equal(await second,env.host.naver.maps);
});
function fakeSdk() {
 const markerRecords=[];const listeners=[];const info=[];const mapRecords=[];let destroyed=false;
 class Map {constructor(){mapRecords.push(this);}panTo(position){this.position=position;}fitBounds(bounds){this.bounds=bounds;}setSize(size){this.size=size;}destroy(){destroyed=true;}}
 class Marker {constructor(options){this.options=options;markerRecords.push(this);}setMap(map){this.map=map;}}
 class InfoWindow {constructor(options){this.options=options;info.push(this);}open(map,marker){this.marker=marker;}close(){this.marker=null;}}
 class LatLng {constructor(latitude,longitude){this.latitude=latitude;this.longitude=longitude;}}
 class LatLngBounds {constructor(sw,ne){this.sw=sw;this.ne=ne;}}
 const Event={addListener(target,name,callback){const listener={target,name,callback};listeners.push(listener);return listener;},removeListener(listener){listener.removed=true;},trigger(){}};
 const doc={createElement(tag){return {tag,style:{},children:[],append(...nodes){this.children.push(...nodes);}};}};
 return {sdk:{Map,Marker,InfoWindow,LatLng,LatLngBounds,Event},markerRecords,mapRecords,listeners,info,doc,destroyed:()=>destroyed};
}
test('resize updates SDK size only for a visible positive-sized container',()=>{
 const f=fakeSdk();const node={clientWidth:375,clientHeight:420};const controller=createMapController(node,f.sdk,()=>{},f.doc);
 controller.resize();assert.deepEqual(f.mapRecords[0].size,{width:375,height:420});
 node.clientHeight=0;controller.resize();assert.deepEqual(f.mapRecords[0].size,{width:375,height:420});controller.destroy();
});
test('controller updates markers/selection, renders text-only info, and cleans SDK resources',()=>{
 const f=fakeSdk();const selected=[];const controller=createMapController({},f.sdk,id=>selected.push(id),f.doc);
 const rows=[{id:'sinchon-05',name:'<img src=x onerror=alert(1)>',category:'일식',address:'fixture only',latitude:37.55,longitude:126.93,averageRating:null,reviewCount:0}];
 controller.render(rows);assert.equal(f.markerRecords.length,1);f.listeners[0].callback();assert.deepEqual(selected,['sinchon-05']);
 controller.select('sinchon-05');assert.equal(f.info.at(-1).options.content.children[0].textContent,rows[0].name);
 assert(f.info.at(-1).options.content.children.some(node=>node.textContent==='아직 리뷰 없음'));
 controller.render([]);assert.equal(f.markerRecords[0].map,null);assert.equal(f.listeners[0].removed,true);
 controller.destroy();assert.equal(f.destroyed(),true);
});
