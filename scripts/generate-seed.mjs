import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const data=JSON.parse(readFileSync('data/restaurants.json','utf8'));
assert.equal(data.restaurants.length,20);
assert.equal(new Set(data.restaurants.map(r=>r.id)).size,20);
const columns={id:'id',name:'name',category:'category',address:'address',latitude:'latitude',longitude:'longitude',representative_menu:'representativeMenu',representative_price:'representativePrice',opening_hours:'openingHours',photo_url:'photoUrl',source_url:'sourceUrl',verified_at:'verifiedAt',verification_status:'verificationStatus',is_franchise:'isFranchise',operating_status:'operatingStatus',verification_notes:'verificationNotes'};
function sql(value) {
 if(value===null||value===undefined)return 'NULL';
 if(typeof value==='number'){assert(Number.isFinite(value));return String(value);}
 if(typeof value==='boolean')return value?'TRUE':'FALSE';
 return "'"+String(value).replaceAll("'","''")+"'";
}
export function generateSeed() {
 return '-- Generated from data/restaurants.json. No fabricated menus or reviews.\n-- Re-running preserves existing verified edits. Apply only after approval.\nBEGIN;\nINSERT INTO public.restaurants ('+Object.keys(columns).join(', ')+') VALUES\n'+data.restaurants.map(r=>'  ('+Object.values(columns).map(field=>sql(r[field])).join(', ')+')').join(',\n')+'\nON CONFLICT (id) DO NOTHING;\nCOMMIT;\n';
}
const output=generateSeed();
if(process.argv.includes('--check')) {
 assert.equal(readFileSync('supabase/seed.sql','utf8'),output,'Seed is stale: npm run seed:generate');
 console.log('PASS: committed seed exactly matches 20 approved JSON rows.');
} else {writeFileSync('supabase/seed.sql',output);console.log('Generated supabase/seed.sql (local file only; no DB connection).');}
