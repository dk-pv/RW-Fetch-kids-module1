import { NextResponse } from "next/server";
import { connectDB } from "../../db/connect";
import Order from "@/models/Order";

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

    const orderData = order.toObject();

    if (userRole === "user") {
      delete orderData.qrCode;
    }

    orderData.products = orderData.products.map((p: any) => ({
      ...p,
      customization: p.customization || {},
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
