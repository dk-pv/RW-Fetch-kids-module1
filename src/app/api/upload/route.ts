// import { NextResponse } from "next/server";
// import cloudinary from "@/utils/cloudinary";

// export async function POST(req: Request) {
//   try {
//     const formData = await req.formData();
//     const file = formData.get("file") as File;

//     if (!file) {
//       return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
//     }

//     const bytes = await file.arrayBuffer();
//     const buffer = Buffer.from(bytes);

//     const upload = await new Promise((resolve, reject) => {
//       const stream = cloudinary.uploader.upload_stream(
//         { folder: "fetchkids/orders" },
//         (error, result) => {
//           if (error) reject(error);
//           else resolve(result);
//         }
//       );
//       stream.end(buffer);
//     });

//     return NextResponse.json({ success: true, result: upload });
//   } catch (error: any) {
//     console.error(error);
//     return NextResponse.json({ success: false, error: error.message });
//   }
// }


import { NextResponse } from "next/server";
import cloudinary from "@/utils/cloudinary";

export async function POST(req: Request) {
  try {
    // 1️⃣ Receive file + folder info
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const folder = (formData.get("folder") as string) || "fetchkids/orders"; // optional folder name
    const fileType = (formData.get("fileType") as string) || "image"; // 'image', 'preview', 'print'

    // 2️⃣ Validation
    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3️⃣ File upload to Cloudinary
    const upload: any = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder, // dynamic folder based on request
          resource_type: "auto", // handles images, pdfs, etc.
          use_filename: true,
          unique_filename: true,
          overwrite: false,
          context: { fileType },
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    // 4️⃣ Response with useful info
    return NextResponse.json({
      success: true,
      url: upload.secure_url,
      publicId: upload.public_id,
      format: upload.format,
      bytes: upload.bytes,
      folder: upload.folder,
      createdAt: upload.created_at,
      fileType,
    });
  } catch (error: any) {
    console.error("Cloudinary upload error:", error);
    return NextResponse.json({ success: false, error: error.message || "Upload failed" }, { status: 500 });
  }
}
