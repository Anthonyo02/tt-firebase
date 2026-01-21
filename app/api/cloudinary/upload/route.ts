// app/api/cloudinary/upload/route.ts
import { v2 as cloudinary } from 'cloudinary';
import { NextRequest, NextResponse } from 'next/server';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const existingPublicId = formData.get('publicId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    return new Promise((resolve) => {
      const uploadOptions: Record<string, any> = {
        folder: 'materiels',
        resource_type: 'image',
        format: 'webp',
        quality: 'auto:good',
      };

      // 🔄 OVERWRITE: Si on a un publicId existant, on écrase l'image
      if (existingPublicId) {
        // Enlever le folder du public_id si présent
        const cleanPublicId = existingPublicId.replace('materiels/', '');
        uploadOptions.public_id = cleanPublicId;
        uploadOptions.overwrite = true;
        uploadOptions.invalidate = true; // Invalide le cache CDN
      }

      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('❌ Cloudinary upload error:', error);
            resolve(NextResponse.json({ error: error.message }, { status: 500 }));
          } else {
            console.log('✅ Upload réussi:', result?.public_id);
            resolve(NextResponse.json({
              imageUrl: result?.secure_url,
              imagePublicId: result?.public_id,
            }));
          }
        }
      );

      uploadStream.end(buffer);
    });
  } catch (error: any) {
    console.error('❌ API upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}