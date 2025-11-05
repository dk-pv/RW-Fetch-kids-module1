// import mongoose, { Schema } from "mongoose";
// import QRCode from "qrcode";
// import { generateOrderId } from "@/utils/generateOrderId";

// const OrderSchema = new Schema(
//   {
//     orderNumber: { type: String, unique: true, required: true },
//     qrCode: { type: String, unique: true },
//     userEmail: { type: String, required: true },
//     userName: { type: String, required: true },
//     products: [
//       {
//         productId: String,
//         name: String,
//         price: Number,
//         quantity: Number,
//         imageUrl: String,
//         customizationId: String,
//       },
//     ],
//     subtotal: Number,
//     tax: Number,
//     shipping: Number,
//     total: Number,
//     shippingAddress: {
//       firstName: String,
//       lastName: String,
//       street: String,
//       city: String,
//       state: String,
//       postalCode: String,
//       country: { type: String, default: "India" },
//       phone: String,
//     },
//     paymentMethod: String,
//     paymentStatus: { type: String, default: "pending" },
//     status: { type: String, default: "pending" },
//   },
//   { timestamps: true }
// );

// OrderSchema.pre("save", async function (next) {
//   if (!this.orderNumber) {
//     this.orderNumber = await generateOrderId();
//   }
//   if (!this.qrCode) {
//     const qrLink = `${process.env.BASE_URL}/order/track/${this.orderNumber}`;
//     this.qrCode = await QRCode.toDataURL(qrLink);
//   }
//   next();
// });

// export default mongoose.models.Order || mongoose.model("Order", OrderSchema);


import mongoose, { Schema } from "mongoose";
import QRCode from "qrcode";
import { generateOrderId } from "@/utils/generateOrderId";

const CustomizationSchema = new Schema({
  isCustomized: { type: Boolean, default: false }, // whether product is customized
  textData: {
    name: String,
    className: String,
    schoolName: String,
    section: String,
  },
  photoUrls: [String], // uploaded images (Cloudinary URLs)
  font: String,
  color: String,
  style: String,
  isCartoonStyle: { type: Boolean, default: false },
  previewImage: String, // design preview (image shown to customer)
  printFile: String, // print-ready PDF (generated later)
});

const ProductSchema = new Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  totalPrice: { type: Number }, // price * quantity
  imageUrl: String,
  isCustomized: { type: Boolean, default: false },
  customization: { type: CustomizationSchema, default: () => ({}) },
});

const OrderSchema = new Schema(
  {
    // Basic Order Info
    orderNumber: { type: String, unique: true, required: true },
    qrCode: { type: String, unique: true },

    // User Info
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    phone: String,

    // Ordered Products (array)
    products: [ProductSchema],

    // Totals
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, required: true },

    // Shipping Address
    shippingAddress: {
      firstName: String,
      lastName: String,
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: "India" },
      phone: String,
    },

    // Payment Info
    paymentMethod: { type: String, default: "cod" },
    paymentStatus: { type: String, default: "pending" },
    stripeSessionId: String,
    stripePaymentIntentId: String,

    // Order Status
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

    // Admin Notes / Production Info
    notes: String,
    adminNotes: String,
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },

    // Files (for production handoff)
    printFileUrl: String,
    driveFolder: String,
    previewImage: String, // optional: main thumbnail

  },
  { timestamps: true }
);

// Middleware - Auto generate Order ID and QR
OrderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    this.orderNumber = await generateOrderId();
  }
  if (!this.qrCode) {
    const qrLink = `${process.env.BASE_URL}/order/track/${this.orderNumber}`;
    this.qrCode = await QRCode.toDataURL(qrLink);
  }
  next();
});

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
