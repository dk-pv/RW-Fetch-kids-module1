// import { NextResponse } from "next/server";
// import { connectDB } from "../../db/connect";
// import Order from "@/models/Order";

// export async function GET(
//   req: Request,
//   context: { params: Promise<{ orderId: string }> }
// ) {
//   try {
//     await connectDB();

//     const { orderId } = await context.params;

//     const order =
//       (await Order.findOne({ orderNumber: orderId })) ||
//       (await Order.findById(orderId));

//     if (!order) {
//       return NextResponse.json(
//         { success: false, message: "Order not found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({ success: true, order });
//   } catch (err: any) {
//     console.error("Order fetch error:", err);
//     return NextResponse.json(
//       { success: false, message: err.message },
//       { status: 500 }
//     );
//   }
// }

import { NextResponse } from "next/server";
import { connectDB } from "../../db/connect";
import Order from "@/models/Order";

/**
 * GET /api/orders/[orderId]
 * Fetch single order by orderNumber or ObjectId.
 * Hide QR for user.
 */

export async function GET(
  req: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    await connectDB();

    const { orderId } = await context.params;

    const userRole =
      req.headers.get("x-user-role") || req.headers.get("role") || "user";

    const order =
      (await Order.findOne({ orderNumber: orderId })) ||
      (await Order.findById(orderId));

    if (!order) {
      return NextResponse.json(
        { success: false, message: "Order not found" },
        { status: 404 }
      );
    }

    // Convert to object
    const orderData = order.toObject();

    // 🔹 Hide QR if user
    if (userRole === "user") delete orderData.qrCode;

    // ✅ Include customization inside each product
    orderData.products = orderData.products.map((p: any) => ({
      name: p.name,
      price: p.price,
      quantity: p.quantity,
      imageUrl: p.imageUrl,
      isCustomized: p.isCustomized,
      customization: p.customization || {}, // ensure customization visible
      totalPrice: p.totalPrice,
    }));

    return NextResponse.json({ success: true, order: orderData });
  } catch (err: any) {
    console.error("❌ Order fetch error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}
