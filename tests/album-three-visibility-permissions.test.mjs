import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const read = (path) => readFileSync(new URL("../" + path, import.meta.url), "utf8");
const source = read("src/lib/albums/access.ts");
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
new Function("module", "exports", js)(mod, mod.exports);
const { canViewAlbum, canViewLinkedMedia } = mod.exports;
const OWNER = "owner", VIEWER = "viewer";
const a = (id, visibility, moderation_status="APPROVED") =>
  ({id,owner_id:OWNER,visibility,moderation_status});

function fixture({ grants=[], follows=false, friends=false, links=[], albums=[] }={}) {
  const calls=[];
  const db={
    from(table){
      const where={}; const query={
        select(){return this;},
        eq(k,v){where[k]=v;return this;},
        in(k,v){where[k]=v;return this;},
        or(){return this;},
        limit(){return this;},
        async maybeSingle(){
          let row=null;
          if(table==="album_viewer_grants")row=grants.find(g=>g.album_id===where.album_id&&g.viewer_id===where.viewer_id)||null;
          if(table==="connections"&&follows)row={id:"follow"};
          if(table==="friendships"&&friends)row={id:"friendship"};
          calls.push(table);
          return {data:row,error:null};
        },
        then(resolve){
          let rows=[];
          if(table==="media_album_items")rows=links.map(album_id=>({album_id}));
          if(table==="media_albums")rows=albums.filter(album=>where.id.includes(album.id));
          calls.push(table);
          return resolve({data:rows,error:null});
        }
      };return query;
    }
  };
  return {db,calls};
}

test("three display audiences: Community, Private and Only me",async()=>{
  for(const visibility of ["PUBLIC","MEMBERS_ONLY"])assert.equal(await canViewAlbum(fixture().db,a("a",visibility),VIEWER),true);
  assert.equal(await canViewAlbum(fixture().db,a("a","PRIVATE"),VIEWER),false);
  assert.equal(await canViewAlbum(fixture().db,a("a","PRIVATE_APPROVED"),VIEWER),false);
  assert.equal(await canViewAlbum(fixture().db,a("a","BOGUS"),VIEWER),false);
  assert.equal(await canViewAlbum(fixture().db,a("a","MEMBERS_ONLY","PENDING_REVIEW"),VIEWER),false);
  for(const visibility of ["PRIVATE","PRIVATE_APPROVED","MEMBERS_ONLY","FRIENDS_ONLY"])
    assert.equal(await canViewAlbum(fixture().db,a("a",visibility),OWNER),true);
});

test("private grants are album-specific, time-bounded and revoked immediately",async()=>{
  const grant={album_id:"album-a",viewer_id:VIEWER,expires_at:null};
  assert.equal(await canViewAlbum(fixture({grants:[grant]}).db,a("album-a","PRIVATE_APPROVED"),VIEWER),true);
  assert.equal(await canViewAlbum(fixture({grants:[grant]}).db,a("album-b","PRIVATE_APPROVED"),VIEWER),false);
  assert.equal(await canViewAlbum(fixture({grants:[grant]}).db,a("album-b","PRIVATE"),VIEWER),false);
  assert.equal(await canViewAlbum(fixture({grants:[{...grant,expires_at:"2001-01-01T00:00:00Z"}]}).db,a("album-a","PRIVATE_APPROVED"),VIEWER),false);
  assert.equal(await canViewAlbum(fixture({grants:[]}).db,a("album-a","PRIVATE_APPROVED"),VIEWER),false);
});

test("legacy followers/friends stay restricted without implicit audience expansion",async()=>{
  assert.equal(await canViewAlbum(fixture().db,a("old","FOLLOWERS_ONLY"),VIEWER),false);
  assert.equal(await canViewAlbum(fixture({follows:true}).db,a("old","FOLLOWERS_ONLY"),VIEWER),true);
  assert.equal(await canViewAlbum(fixture({follows:true}).db,a("old","FRIENDS_ONLY"),VIEWER),false);
  assert.equal(await canViewAlbum(fixture({friends:true}).db,a("old","FRIENDS_ONLY"),VIEWER),true);
});

test("album photo bytes require every linked album to authorize the viewer",async()=>{
  const granted={album_id:"private-a",viewer_id:VIEWER,expires_at:null};
  let result=await canViewLinkedMedia(fixture({grants:[granted],links:["private-a"],albums:[a("private-a","PRIVATE_APPROVED")]}).db,"photo",OWNER,VIEWER);
  assert.deepEqual(result,{linked:true,allowed:true});
  result=await canViewLinkedMedia(fixture({grants:[granted],links:["private-a","only-me"],albums:[a("private-a","PRIVATE_APPROVED"),a("only-me","PRIVATE")]}).db,"photo",OWNER,VIEWER);
  assert.deepEqual(result,{linked:true,allowed:false});
  result=await canViewLinkedMedia(fixture({links:["unapproved"],albums:[a("unapproved","MEMBERS_ONLY","PENDING_REVIEW")]}).db,"photo",OWNER,VIEWER);
  assert.deepEqual(result,{linked:true,allowed:false});
  result=await canViewLinkedMedia(fixture({links:[],albums:[]}).db,"photo",OWNER,VIEWER);
  assert.deepEqual(result,{linked:false,allowed:false});
});

test("all photo and interaction routes reject global grant bypass",()=>{
  const media=read("src/app/api/media/[id]/route.ts");
  const privateList=read("src/app/api/private-access/media/route.ts");
  const interaction=read("src/lib/content/targetAccess.ts");
  const publicMedia=read("src/app/api/public/media/[id]/route.ts");
  const search=read("src/app/api/search/route.ts");
  const feed=read("src/app/api/feed/route.ts");
  assert.match(media,/canViewLinkedMedia\(supabase/);
  assert.match(media,/albumAccess.linked && !albumAccess.allowed/);
  assert.doesNotMatch(media,/grantIsActive|album_access_grants/);
  assert.match(publicMedia,/linked\?\.length/);
  assert.match(interaction,/canViewAlbum/);
  assert.match(interaction,/canViewLinkedMedia/);
  assert.match(privateList,/album_viewer_grants/);
  assert.doesNotMatch(privateList,/album_access_grants/);
  assert.match(search,/linkedIds/);
  assert.match(feed,/linkedIds/);
});

test("UI offers exactly three new options and legacy owner confirmation",()=>{
  const ui=read("src/components/media/AlbumManager.tsx");
  const route=read("src/app/api/albums/[id]/route.ts");
  const create=read("src/app/api/albums/route.ts");
  assert.match(ui,/\["MEMBERS_ONLY", "Community"\]/);
  assert.match(ui,/\["PRIVATE_APPROVED", "Private"\]/);
  assert.match(ui,/\["PRIVATE", "Only me"\]/);
  assert.doesNotMatch(ui,/\["FOLLOWERS_ONLY", "Followers"\]/);
  assert.match(ui,/confirmAudienceChange/);
  assert.match(route,/confirmAudienceChange/);
  assert.match(create,/CHOOSABLE_ALBUM_VISIBILITIES/);
});

test("migration narrows public albums, preserves legacy friends/followers, and forbids direct RLS access",()=>{
  const sql=read("supabase/migrations/20261121020000_album_visibility_three_options.sql");
  const revoke=read("supabase/migrations/20261121020100_album_scope_grant_invalidation.sql");
  assert.match(sql,/CREATE TABLE public.album_viewer_grants/);
  assert.match(sql,/REVOKE ALL ON public.album_viewer_grants FROM public, anon, authenticated/);
  assert.match(sql,/ALTER TABLE public.album_viewer_grants ENABLE ROW LEVEL SECURITY/);
  assert.match(sql,/WHERE a.visibility = 'PRIVATE_APPROVED'/);
  assert.match(sql,/WHERE visibility='PUBLIC'/);
  assert.doesNotMatch(sql,/UPDATE public.media_albums SET visibility='MEMBERS_ONLY'.*'FRIENDS_ONLY'/);
  assert.match(revoke,/DELETE FROM public.album_viewer_grants WHERE album_id = NEW.id/);
});
