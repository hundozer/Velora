import { getPresignedUploadUrl, isR2Configured } from "../r2";

async function runR2Tests() {
  console.log("========================================================");
  console.log("CLOUDFLARE R2 PRESIGNED UPLOAD TEST SUITE");
  console.log("========================================================\n");

  try {
    // 1. Presigned Upload URL for Image
    const photoResult = await getPresignedUploadUrl({
      fileName: "exclusive_villa_photo.png",
      fileType: "image/png",
      folder: "photos",
    });

    console.log("✓ [PASS] 1. Photo presigned upload URL generated");
    console.log(`  Upload URL: ${photoResult.uploadUrl.substring(0, 60)}...`);
    console.log(`  Public CDN URL: ${photoResult.publicUrl}`);
    console.log(`  Object Key: ${photoResult.objectKey}`);
    console.log(`  Is Mock Fallback: ${photoResult.isMock}`);

    if (!photoResult.objectKey.startsWith("photos/")) {
      throw new Error(`Expected object key to start with 'photos/', got: ${photoResult.objectKey}`);
    }

    // 2. Presigned Upload URL for Heavy Video
    const videoResult = await getPresignedUploadUrl({
      fileName: "yacht_sunset_4k_teaser.mp4",
      fileType: "video/mp4",
      folder: "videos",
    });

    console.log("\n✓ [PASS] 2. Heavy video presigned upload URL generated");
    console.log(`  Upload URL: ${videoResult.uploadUrl.substring(0, 60)}...`);
    console.log(`  Public CDN URL: ${videoResult.publicUrl}`);
    console.log(`  Object Key: ${videoResult.objectKey}`);

    if (!videoResult.objectKey.startsWith("videos/")) {
      throw new Error(`Expected object key to start with 'videos/', got: ${videoResult.objectKey}`);
    }

    console.log("\n========================================================");
    console.log("ALL CLOUDFLARE R2 TESTS PASSED PERFECTLY!");
    console.log("========================================================\n");
  } catch (err: any) {
    console.error("❌ [FAIL] R2 Presigned Test Failed:", err);
    process.exit(1);
  }
}

runR2Tests();
