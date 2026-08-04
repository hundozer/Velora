import { NextRequest, NextResponse } from "next/server";
import { getPresignedUploadUrl } from "@/lib/storage/r2";

const ALLOWED_MIME_TYPES = [
  // Images
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  // Videos
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-matroska",
  "video/mpeg",
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fileName, fileType, folder } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "fileName and fileType are required" },
        { status: 400 }
      );
    }

    // Validate MIME type
    const isAllowed = ALLOWED_MIME_TYPES.some((type) => fileType.toLowerCase().startsWith(type));
    if (!isAllowed && !fileType.startsWith("image/") && !fileType.startsWith("video/")) {
      return NextResponse.json(
        { error: `File type '${fileType}' is not supported. Please upload a valid image or video file.` },
        { status: 400 }
      );
    }

    const presigned = await getPresignedUploadUrl({
      fileName,
      fileType,
      folder: folder || "general",
    });

    return NextResponse.json({
      success: true,
      uploadUrl: presigned.uploadUrl,
      publicUrl: presigned.publicUrl,
      objectKey: presigned.objectKey,
      isMock: presigned.isMock,
    });
  } catch (error: any) {
    console.error("Presigned URL generation error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate presigned upload URL" },
      { status: 500 }
    );
  }
}
