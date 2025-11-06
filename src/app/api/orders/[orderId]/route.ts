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

    const role =
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

    if (role === "user") delete orderData.qrCode;

    return NextResponse.json({ success: true, order: orderData });
  } catch (err: any) {
    console.error("❌ GET order error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ orderId: string }> }
) {
  try {
    await connectDB();
    const { orderId } = await context.params;
    const payload = await req.json();

    const allowedFields = [
      "paymentStatus",
      "paymentMethod",
      "status",
      "trackingNumber",
      "carrier",
      "notes",
    ];
    const updateData: any = {};

    for (const key of allowedFields) {
      if (payload[key] !== undefined) updateData[key] = payload[key];
    }

    const updatedOrder = await Order.findOneAndUpdate(
      { orderNumber: orderId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedOrder) {
      return NextResponse.json(
        { success: false, message: "Order not found or update failed" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder,
    });
  } catch (err: any) {
    console.error("❌ PATCH order error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Update failed" },
      { status: 500 }
    );
  }
}
