import { NextResponse } from "next/server";
import crypto from "crypto";
import PaymentTransaction from "@/models/PaymentTransaction";
import Order from "@/models/Order";
import { connectDB } from "../../db/connect";

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = await req.text();
    const signature = req.headers.get("x-razorpay-signature");
    const expected = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (signature !== expected) {
      return NextResponse.json({ success: false, message: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);
    const { order_id, payment_id, status } = event.payload.payment.entity;

    const payment = await PaymentTransaction.findOne({ transactionId: order_id });
    if (!payment) {
      return NextResponse.json({ success: false, message: "Transaction not found" });
    }

    payment.status = status === "captured" ? "completed" : "failed";
    payment.gatewayResponse = event;
    await payment.save();

    if (status === "captured") {
      await Order.findByIdAndUpdate(payment.orderId, {
        paymentStatus: "paid",
        status: "confirmed",
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return NextResponse.json({ success: false, message: err.message });
  }
}
