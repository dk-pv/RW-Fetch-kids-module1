import { NextResponse } from "next/server";
import { razorpay } from "@/utils/razorpay";
import PaymentTransaction from "@/models/PaymentTransaction";
import Order from "@/models/Order";
import { connectDB } from "../../db/connect";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { orderId, amount, userId, paymentMethod } = await req.json();

    if (!orderId || !amount) {
      return NextResponse.json(
        { success: false, message: "Invalid details" },
        { status: 400 }
      );
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paisa
      currency: "INR",
      receipt: `rcpt_${orderId}`,
    };

    const razorpayOrder = await razorpay.orders.create(options);

    // Save to PaymentTransactions
    const transaction = await PaymentTransaction.create({
      orderId,
      userId,
      amount,
      paymentMethod,
      transactionId: razorpayOrder.id,
      status: "pending",
      gatewayResponse: razorpayOrder,
    });

    await Order.findByIdAndUpdate(orderId, {
      paymentTransactionId: transaction._id,
    });

    return NextResponse.json({
      success: true,
      razorpayOrder,
      transactionId: transaction._id,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error: any) {
    console.error("Payment creation failed:", error);
    return NextResponse.json({ success: false, message: error.message });
  }
}
