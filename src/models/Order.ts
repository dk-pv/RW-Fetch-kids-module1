import mongoose, { Schema } from "mongoose";
import QRCode from "qrcode";
import { generateOrderId } from "@/utils/generateOrderId";

const CustomizationSchema = new Schema({
  isCustomized: { type: Boolean, default: false },
  textData: {
    name: String,
    className: String,
    schoolName: String,
    section: String,
  },
  photoUrls: [String],
  font: String,
  color: String,
  style: String,
  isCartoonStyle: { type: Boolean, default: false },
  previewImage: String,
  printFile: String,
});

const ProductSchema = new Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number },
  imageUrl: String,
  isCustomized: { type: Boolean, default: false },
  customization: { type: CustomizationSchema, default: () => ({}) },
});

const ShippingAddressSchema = new Schema(
  {
    userName: { type: String, required: true },
    phone: { type: String, required: true },
    alternatePhone: { type: String, required: true },
    postalCode: { type: String, required: true },
    locality: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    district: { type: String, required: true },
    state: { type: String, required: true },
    country: { type: String, default: "India", required: true },
    landmark: { type: String, default: "" },
    addressType: {
      type: String,
      enum: ["home", "work", "other"],
      default: "home",
      required: true,
    },
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderNumber: { type: String, unique: true, required: true },
    qrCode: { type: String, unique: true },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    phone: { type: String, required: true },

    products: [ProductSchema],

    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    shippingAddress: { type: ShippingAddressSchema, required: true },

    paymentMethod: { type: String, default: "cod", required: true },
    paymentStatus: { type: String, default: "pending" },
    stripeSessionId: String,
    stripePaymentIntentId: String,

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "in_production",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },
    trackingNumber: String,
    carrier: String,
    shippedAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,

    notes: String,
    adminNotes: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

    printFileUrl: String,
    driveFolder: String,
    previewImage: String,
  },
  { timestamps: true }
);

OrderSchema.pre("save", async function (next) {
  if (!this.orderNumber) this.orderNumber = await generateOrderId();
  if (!this.qrCode) {
    const qrLink = `${process.env.BASE_URL}/order/track/${this.orderNumber}`;
    this.qrCode = await QRCode.toDataURL(qrLink);
  }
  next();
});

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
