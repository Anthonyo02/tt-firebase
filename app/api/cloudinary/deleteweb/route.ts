import { NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { publicId } = await req.json();

    if (!publicId || typeof publicId !== "string") {
      return NextResponse.json({ error: "Missing publicId" }, { status: 400 });
    }

    const result = await cloudinary.uploader.destroy(publicId, {
      invalidate: true,
      resource_type: "image",
    });

    if (result.result === "not found") {
      return NextResponse.json({
        success: true,
        message: "Resource already deleted",
        detail: result,
      });
    }

    if (result.result !== "ok") {
      return NextResponse.json(
        {
          success: false,
          message: "Cloudinary deletion did not return ok",
          detail: result,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Deleted", detail: result });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}