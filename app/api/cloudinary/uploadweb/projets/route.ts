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
      resource_type: "image",
      format: "webp",
      quality: "auto:good",
      fetch_format: "auto",
    };

    if (existingPublicId) {
      // ✅ CORRECTION: Ne PAS mettre folder car publicId contient déjà le chemin complet
      // Ex: existingPublicId = "projets/abc123" 
      // On l'utilise tel quel sans rajouter folder
      uploadOptions.public_id = existingPublicId;
      uploadOptions.overwrite = true;
      uploadOptions.invalidate = true;
      
      console.log("🔄 Overwrite image:", existingPublicId);
    } else {
      // ✅ Nouvelle image seulement: on spécifie le folder
      uploadOptions.folder = "projets";
      
      console.log("📤 Nouvelle image dans folder: projets");
    }

    const result = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, res) => {
        if (error) {
          console.error("❌ Cloudinary stream error:", error);
          reject(error);
        } else {
          console.log("✅ Upload réussi:", res?.public_id);
          resolve(res);
        }
      });
      stream.end(buffer);
    });

    return NextResponse.json({
      imageUrl: result.secure_url,
      imagePublicId: result.public_id,
    });
  } catch (error: any) {
    console.error("❌ Cloudinary upload error:", error.message || error);
    return NextResponse.json({ error: error.message || "Upload error" }, { status: 500 });
  }
}