import { NextResponse } from "next/server";
import cloudinary from "@/utils/cloudinary";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folderRaw = (formData.get("folder") as string) || "fetchkids/orders";
    const fileType = (formData.get("fileType") as string) || "image";
    const folder = folderRaw.replace(/[^a-zA-Z0-9/_-]/g, "");

    if (!file) {
      return NextResponse.json(
        { success: false, error: "No file uploaded" },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "File too large (max 10MB)" },
        { status: 400 }
      );
    }

    const mimeType = file.type || "application/octet-stream";

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "auto",
          use_filename: true,
          unique_filename: true,
          overwrite: false,
          context: { fileType, mimeType },
        },
        (error, uploadResult) => {
          if (error) reject(error);
          else resolve(uploadResult);
        }
      );
      stream.end(buffer);
    });

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully",
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      folder: result.folder,
      createdAt: result.created_at,
      fileType,
      mimeType,
    });
  } catch (error: any) {
    console.error("❌ Cloudinary upload error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Upload failed",
        error: error.message || "Unknown error",
      },
      { status: 500 }
    );
  }
}
