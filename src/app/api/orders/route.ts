// import { NextResponse } from "next/server";
// import { connectDB } from "../db/connect";
// import Order from "@/models/Order";
// import { generateOrderId } from "@/utils/generateOrderId";
// import { generateQR } from "@/utils/generateQR";

// export async function POST(req: Request) {
//   try {
//     await connectDB();
//     const data = await req.json();

//     const orderNumber = await generateOrderId();
//     const qrCode = await generateQR(
//       `${process.env.BASE_URL}/order/track/${orderNumber}`
//     );

//     const newOrder = await Order.create({
//       ...data,
//       orderNumber,
//       qrCode,
//     });

//     return NextResponse.json({ success: true, order: newOrder });
//   } catch (error: any) {
//     console.error(error);
//     return NextResponse.json({ success: false, message: error.message });
//   }
// }

import { NextResponse } from "next/server";
import { connectDB } from "../db/connect";
import Order from "@/models/Order";
import { generateOrderId } from "@/utils/generateOrderId";
import { generateQR } from "@/utils/generateQR";

function hasCustomizationPayload(p: any) {
  if (!p) return false;
  if (p.isCustomized) return true;
  if (p.customization) {
    const c = p.customization;
    const text = c.textData || {};
    const textHas = Object.values(text).some((v: any) => v !== undefined && v !== null && String(v).trim() !== "");
    const photos = Array.isArray(c.photoUrls) && c.photoUrls.length > 0;
    return textHas || photos || !!c.font || !!c.color || !!c.style || !!c.previewImage || !!c.printFile;
  }
  return false;
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();

    if (!data || !Array.isArray(data.products) || data.products.length === 0) {
      return NextResponse.json({ success: false, message: "Invalid payload: products required" }, { status: 400 });
    }

    // 1️⃣ Generate Order ID & QR
    const orderNumber = await generateOrderId();
    const qrCode = await generateQR(`${process.env.BASE_URL}/order/track/${orderNumber}`);

    // 2️⃣ Format all products (including customization when present)
    const products = data.products.map((p: any) => {
      const price = Number(p.price || 0);
      const qty = Number(p.quantity || 0);
      const totalPrice = price * qty;

      const includeCustomization = hasCustomizationPayload(p);

      return {
        productId: p.productId || null,
        name: p.name || "",
        price,
        quantity: qty,
        totalPrice,
        imageUrl: p.imageUrl || "",
        isCustomized: !!includeCustomization,
        // only attach customization when there is meaningful customization data
        ...(includeCustomization && {
          customization: {
            isCustomized: true,
            textData: {
              name: p.customization?.textData?.name || "",
              className: p.customization?.textData?.className || "",
              schoolName: p.customization?.textData?.schoolName || "",
              section: p.customization?.textData?.section || "",
            },
            photoUrls: Array.isArray(p.customization?.photoUrls) ? p.customization.photoUrls : (p.customization?.photoUrls ? [p.customization.photoUrls] : []),
            font: p.customization?.font || "",
            color: p.customization?.color || "",
            style: p.customization?.style || "",
            isCartoonStyle: !!p.customization?.isCartoonStyle,
            previewImage: p.customization?.previewImage || p.previewImage || "",
            printFile: p.customization?.printFile || "",
          }
        })
      };
    });

    // 3️⃣ Totals
    const subtotal = products.reduce((acc: number, pr: any) => acc + (Number(pr.totalPrice) || 0), 0);
    const tax = Number(data.tax || 0);
    const shipping = Number(data.shipping || 0);
    const discount = Number(data.discount || 0);
    const total = subtotal + tax + shipping - discount;

    // 4️⃣ Construct new order object
    const newOrderData: any = {
      orderNumber,
      qrCode,
      userId: data.userId || null,
      userEmail: data.userEmail || "",
      userName: data.userName || "",
      phone: data.phone || "",
      products,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      shippingAddress: {
        firstName: data.shippingAddress?.firstName || "",
        lastName: data.shippingAddress?.lastName || "",
        street: data.shippingAddress?.street || "",
        city: data.shippingAddress?.city || "",
        state: data.shippingAddress?.state || "",
        postalCode: data.shippingAddress?.postalCode || "",
        country: data.shippingAddress?.country || "India",
        phone: data.shippingAddress?.phone || "",
      },
      paymentMethod: data.paymentMethod || "cod",
      paymentStatus: data.paymentStatus || "pending",
      status: "pending",
      printFileUrl: "",
      driveFolder: "",
      previewImage: data.previewImage || "",
    };

    // 5️⃣ Save to DB
    const newOrder = await Order.create(newOrderData);

    // 6️⃣ Return Response
    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      order: newOrder,
    });
  } catch (error: any) {
    console.error("❌ Order Creation Error:", error);
    return NextResponse.json({
      success: false,
      message: error.message || "Failed to create order",
    }, { status: 500 });
  }
}
