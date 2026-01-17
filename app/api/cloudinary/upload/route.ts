import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const existingPublicId = formData.get("publicId") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadOptions: Record<string, any> = {
      folder: "materiels",
      resource_type: "image",
      // ✅ Optimisations
      format: "webp",
      quality: "auto:good",
      fetch_format: "auto",
    };

    if (existingPublicId) {
      const idWithoutFolder = existingPublicId.includes("/")
        ? existingPublicId.split("/").pop()
        : existingPublicId;

      uploadOptions.public_id = idWithoutFolder;
      uploadOptions.overwrite = true;
      uploadOptions.invalidate = true;
    }

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) reject(error);
          else resolve(result);
        })
        .end(buffer);
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    });
  } catch (error) {
    console.error("Cloudinary error:", error);
    return NextResponse.json({ error: "Upload error" }, { status: 500 });
  }
}