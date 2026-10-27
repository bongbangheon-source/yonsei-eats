import nextEnv from '@next/env';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
import { readSupabaseConfig } from '../src/lib/supabase/config.ts';

nextEnv.loadEnvConfig(process.cwd(),true,{info(){},error(){}});
try {
 const configuration=readSupabaseConfig(process.env);
 assert(configuration.ok);
 const client=createClient(configuration.config.url,configuration.config.key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,cache:'no-store',signal:AbortSignal.timeout(10000)})}});
 const results=await Promise.all(['reviews','review_tags','review_tag_links','restaurant_catalog','review_author_names'].map(async table=>{
  const {error,count}=await client.from(table).select('*',{head:true,count:'exact'});
  assert.equal(error,null,`${table} must be publicly readable`);
  return {table,count};
 }));
 assert.equal(results.find(r=>r.table==='restaurant_catalog').count,20);
 // The UUID is new and p_creating=false: never create a review, even if a
 // configuration mistake grants EXECUTE. Correct policy rejects before execution.
 const denied=await client.rpc('save_review',{p_id:randomUUID(),p_restaurant_id:'sinchon-01',p_rating:3,p_body:'permission probe - not inserted',p_tag_ids:[],p_creating:false});
 assert.equal(denied.error?.code,'42501','anon must not execute the mutation RPC');
 console.log('PASS: Phase4 public tables/view readable; catalog20; anonymous save_review permission denied. Authenticated writes were NOT tested.');
 console.log(JSON.stringify(results));
} catch {
 console.error('FAIL: Phase4 DB readiness/permission check failed. Confirm approved migration, network and grants. No credentials or raw errors printed.');
 process.exitCode=1;
}
