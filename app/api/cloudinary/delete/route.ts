// app/api/cloudinary/delete/route.ts
import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function POST(req: Request) {
  try {
    const { publicId } = await req.json();

    if (!publicId) {
      return NextResponse.json(
        { error: "publicId is required" },
        { status: 400 }
      );
    }

    console.log("🗑️ Deleting from Cloudinary:", publicId);

    // ✅ Suppression avec invalidation du cache
    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
    });

    console.log("🗑️ Delete result:", result);

    if (result.result === "ok" || result.result === "not found") {
      return NextResponse.json({ success: true, result: result.result });
    } else {
      return NextResponse.json(
        { error: "Delete failed", result },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("❌ Cloudinary delete error:", error);
    return NextResponse.json({ error: "Delete error" }, { status: 500 });
  }
}