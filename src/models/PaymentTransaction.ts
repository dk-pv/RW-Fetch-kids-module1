import mongoose, { Schema } from "mongoose";

const PaymentTransactionSchema = new Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    amount: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["card", "upi", "netbanking", "wallet", "cod_advance"],
      required: true,
    },
    transactionId: { type: String },
    status: {
      type: String,
      enum: ["pending", "completed", "failed", "refunded"],
      default: "pending",
    },
    gatewayResponse: { type: Object },
  },
  { timestamps: true }
);

export default mongoose.models.PaymentTransaction ||
  mongoose.model("PaymentTransaction", PaymentTransactionSchema);
