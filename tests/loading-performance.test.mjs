import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
function load(path, mocks) {
  const code = ts.transpileModule(readFileSync(new URL(`../${path}`, import.meta.url), 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const module={exports:{}};
  new Function('require','module','exports',code)(name=>name in mocks?mocks[name]:require(name),module,module.exports);
  return module.exports;
}
const id='12345678-1234-4123-8123-123456789012';
const owner='22345678-1234-4123-8123-123456789012';
function feedFixture({authenticated=true, blocked=false}={}) {
  const executed=[];
  const db={from(table){
    let columns,options;const filters=[];
    const q=new Proxy({}, {get(_,key){
      if(key==='select')return(c,o)=>{columns=c;options=o;return q;};
      if(key==='eq'||key==='in')return(...args)=>{filters.push([key,...args]);return q;};
      if(key==='then')return(resolve)=>{
        executed.push({table,columns,options,filters});
        const data=table==='user_blocks' ? (blocked?[{blocker_id:'viewer',blocked_profile_id:owner}]:[])
          :table==='media_objects'?[{id,owner_id:owner,media_type:'IMAGE',title:'Photo',published_at:'2026-11-01T12:00:00Z'}]
          :table==='profiles'?[{id:owner,display_name:'Member',account_status:'ACTIVE'}]
          :table==='content_reactions'&& !options?.head?[{target_type:'MEDIA',target_id:id}]:[];
        return resolve({data,error:null,count:2});
      };
      return()=>q;
    }});return q;
  }};
  const api=load('src/app/api/feed/route.ts',{
    '@/lib/auth/serverActor':{resolveServerActor:async()=>authenticated?{status:'authenticated',actor:{profileId:'viewer',userId:'viewer'}}:{status:'unauthenticated'},hasAdultAccess:()=>true},
    '@/lib/security/rateLimiter':{checkRateLimit:async()=>({allowed:true})},
    '@/lib/supabase/server':{getServerSupabase:()=>db},
  });
  return{api,executed};
}
test('photos filter executes only media, block, owner and reaction reads; summaries are exact',async()=>{
  const {api,executed}=feedFixture();
  const r=await api.GET({url:'https://example.test/api/feed?type=photos&scope=newest'});
  assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'private, no-store');
  const p=await r.json();assert.equal(p.items.length,1);assert.deepEqual(p.items[0].reactionSummary,{count:2,liked:true});
  assert.deepEqual([...new Set(executed.map(x=>x.table))].sort(),['content_reactions','media_objects','profiles','user_blocks']);
  const media=executed.find(x=>x.table==='media_objects');assert.ok(media.filters.some(x=>x[1]==='media_type'&&x[2]==='IMAGE'));
  assert.equal(executed.filter(x=>x.table==='content_reactions'&&x.options?.head).length,1);
});
test('anonymous feed is rejected without any database query',async()=>{
  const {api,executed}=feedFixture({authenticated:false});assert.equal((await api.GET({url:'https://example.test/api/feed'})).status,401);assert.equal(executed.length,0);
});
test('blocked owners never enter the feed or reaction summary',async()=>{
  const {api,executed}=feedFixture({blocked:true});
  const p=await (await api.GET({url:'https://example.test/api/feed?type=photos'})).json();
  // The real owner query excludes blocked IDs; mirror its empty response here by
  // asserting the authorization query has no owner IDs to resolve.
  assert.equal(p.items.length,0);assert.equal(executed.filter(x=>x.table==='content_reactions').length,0);
});
test('session bootstrap returns only the verified owner profile and is never cacheable',async()=>{
  for(const status of ['authenticated','unauthenticated','unavailable','restricted']){
    let requested;
    const api=load('src/app/api/auth/session/route.ts',{
      '@/lib/auth/serverActor':{resolveServerActor:async(req,opts)=>{requested=opts;return status==='authenticated'||status==='restricted'?{status:'authenticated',actor:{id:'viewer',accountStatus:status==='restricted'?'RESTRICTED':'ACTIVE'},profile:{id:'viewer'}}:{status};}},
      '@/lib/auth/accountState.mjs':{deriveAccountState:({accountStatus})=>accountStatus==='RESTRICTED'?'RESTRICTED':'ACTIVE'},
    });
    const r=await api.GET({});assert.equal(r.headers.get('cache-control'),'private, no-store');
    const p=await r.json();assert.equal(Boolean(p.profile),status==='authenticated');assert.deepEqual(requested,{includeProfile:true});
  }
});
