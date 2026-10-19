/** Incident recovery for known synthetic acceptance files, 2026-10-19 only. */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { S3Client, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
assert.equal(process.env.VERCEL_ENV,'preview');
assert.equal(process.env.CLOUDFLARE_R2_BUCKET_NAME,'intimo-staging-media');
assert.equal(process.env.CLOUDFLARE_R2_ACCOUNT_ID,'e9dfc810ae6979dcf5599cedc3e3baf0');
assert.equal(new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,'fuczjjcwtxzzvoxilrme.supabase.co');
const bucket=process.env.CLOUDFLARE_R2_BUCKET_NAME;
const client=new S3Client({region:'auto',endpoint:`https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,credentials:{accessKeyId:process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,secretAccessKey:process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY},requestChecksumCalculation:'WHEN_REQUIRED',responseChecksumValidation:'WHEN_REQUIRED'});
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmkwkpAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAEUlEQVR4nGP4z8AARwgWXg4ArpMP8aaUSCMAAAAASUVORK5CYII=','base64');
const tiny=await sharp(png).rotate().resize({width:4,withoutEnlargement:true}).webp({quality:78}).toBuffer();
const known=new Set([png,tiny].map(bytes=>createHash('sha256').update(bytes).digest('hex')));
try {
 const listing=await client.send(new ListObjectsV2Command({Bucket:bucket,MaxKeys:1000}));
 assert.ok(!listing.IsTruncated,'Refuse partial inventory');
 for(const item of listing.Contents??[]){
  const when=new Date(item.LastModified).getTime();
  const testName=/^photos\/\d+_[a-z0-9]+_acceptance\.png$/.test(item.Key??'')||/^variants\/[0-9a-f-]{36}\/4\.webp$/.test(item.Key??'');
  if(!testName||when<1792437800000||when>1792438702000||item.Size>4096){console.log('STAGING_RECOVERY retained unmatched object metadata',{size:item.Size,modified:item.LastModified});continue;}
  const object=await client.send(new GetObjectCommand({Bucket:bucket,Key:item.Key}));
  const bytes=Buffer.from(await object.Body.transformToByteArray());
  const hash=createHash('sha256').update(bytes).digest('hex');
  if(!known.has(hash)){console.log('STAGING_RECOVERY retained unrecognised bytes',{size:item.Size,hash});continue;}
  await client.send(new DeleteObjectCommand({Bucket:bucket,Key:item.Key}));
  let absent=false;try{await client.send(new HeadObjectCommand({Bucket:bucket,Key:item.Key}));}catch(error){if(error?.$metadata?.httpStatusCode===404)absent=true;else throw error;}
  assert.ok(absent,'Known fixture file remains after deletion');
  console.log('STAGING_RECOVERY verified synthetic file removed',item.Key);
 }
 const after=await client.send(new ListObjectsV2Command({Bucket:bucket,MaxKeys:1}));
 assert.equal(after.Contents?.length??0,0,'Unresolved object retained; inspect before acceptance');
 console.log('STAGING_RECOVERY independently verified staging bucket empty PASS');
} finally {client.destroy();}
