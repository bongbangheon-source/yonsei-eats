import nextEnv from '@next/env';
import { readSupabaseConfig } from '../src/lib/supabase/config.ts';
import { queryRestaurantCatalog } from '../src/lib/supabase/catalog.ts';
import { mapRestaurantRow } from '../src/lib/restaurant-repository.ts';
import { isVerifiedLocation, locationEvidence } from '../src/lib/maps/locations.ts';

nextEnv.loadEnvConfig(process.cwd(),true,{info(){},error(){}});
try {
 const config=readSupabaseConfig(process.env);
 if(!config.ok)throw Error('configuration');
 const {data,error}=await queryRestaurantCatalog(config.config);
 if(error||!data)throw Error('query');
 const rows=data.map(mapRestaurantRow);
 const expected=locationEvidence.filter(row=>row.status==='verified');
 const matched=rows.filter(row=>isVerifiedLocation(row));
 const pending=expected.filter(e=>!matched.some(row=>row.id===e.id)).map(e=>e.id);
 console.log(JSON.stringify({restaurants:rows.length,verifiedLocationRecords:expected.length,dbMatches:matched.length,unlocated:rows.length-matched.length,pendingLocationIds:pending}));
 if(rows.length!==20||pending.length)throw Error('location mismatch');
 console.log('PASS: official location registry matches actual Supabase rows. GET only; no updates. SDK loading is a separate browser check.');
}catch{console.error('FAIL: location readiness check failed. Verify configuration, network and approved location migration; conflicting data must be reviewed. No credentials printed.');process.exitCode=1;}
