// app/api/cloudinary/upload/route.ts
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

    // ✅ CORRECTION: Gestion correcte du publicId pour overwrite
    const uploadOptions: Record<string, any> = {};

    if (existingPublicId) {
      // Si on a un publicId existant → OVERWRITE
      // Le publicId inclut déjà le folder (ex: "materiels/abc123")
      // On doit extraire juste l'ID sans le folder
      const idWithoutFolder = existingPublicId.includes("/")
        ? existingPublicId.split("/").pop()
        : existingPublicId;

      uploadOptions.folder = "materiels";
      uploadOptions.public_id = idWithoutFolder;
      uploadOptions.overwrite = true;
      uploadOptions.invalidate = true; // ✅ Invalider le cache CDN
    } else {
      // Nouvelle image → générer un nouveau publicId
      uploadOptions.folder = "materiels";
    }

    console.log("📤 Upload options:", uploadOptions);

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            console.error("❌ Cloudinary upload error:", error);
            reject(error);
          } else {
            resolve(result);
          }
        })
        .end(buffer);
    });

    console.log("✅ Upload success:", {
      public_id: result.public_id,
      secure_url: result.secure_url,
    });

    return NextResponse.json({
      url: result.secure_url,
      publicId: result.public_id,
    });
  } catch (error) {
    console.error("❌ Cloudinary error:", error);
    return NextResponse.json({ error: "Upload error" }, { status: 500 });
  }
}