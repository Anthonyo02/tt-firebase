import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const existingPublicId = (formData.get("publicId") as string | null) || undefined;

    if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadOptions: Record<string, any> = {
      folder: "website_slides", // 🔹 Dossier spécifique pour le site
      resource_type: "image",
      format: "webp",
      quality: "auto:good",
      fetch_format: "auto",
    };

    // Si on remplace une image existante
    if (existingPublicId) {
       // Extraction de l'ID si nécessaire, ou utilisation directe
      uploadOptions.public_id = existingPublicId;
      uploadOptions.overwrite = true;
      uploadOptions.invalidate = true;
    }

    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, res) => {
        if (error) reject(error);
        else resolve(res);
      });
      stream.end(buffer);
    });

    return NextResponse.json({
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json({ error: "Upload error" }, { status: 500 });
  }
}