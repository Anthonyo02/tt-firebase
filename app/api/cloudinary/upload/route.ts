// app/api/cloudinary/upload/route.ts
export const runtime = "nodejs";

import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const existingPublicId = formData.get("publicId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    return new Promise<Response>((resolve) => {
      const uploadOptions: any = {
        folder: "materiels",
        resource_type: "image",
        format: "webp",
        quality: "auto:good",
      };

      if (existingPublicId) {
        uploadOptions.public_id = existingPublicId.replace("materiels/", "");
        uploadOptions.overwrite = true;
        uploadOptions.invalidate = true;
      }

      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            console.error("❌ Cloudinary error:", error);
            resolve(
              NextResponse.json({ error: error.message }, { status: 500 })
            );
          } else {
            resolve(
              NextResponse.json({
                imageUrl: result?.secure_url,
                imagePublicId: result?.public_id,
              })
            );
          }
        })
        .end(buffer);
    });
  } catch (error: any) {
    console.error("❌ API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
