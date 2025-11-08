import { NextResponse } from "next/server";
import { connectDB } from "../db/connect";
import Order from "@/models/Order";
import User from "@/models/User";
import { generateOrderId } from "@/utils/generateOrderId";
import { generateQR } from "@/utils/generateQR";

function hasCustomizationPayload(p: any) {
  if (!p) return false;
  if (p.isCustomized) return true;
  if (p.customization) {
    const c = p.customization;
    const text = c.textData || {};
    const textHas = Object.values(text).some(
      (v: any) => v !== undefined && v !== null && String(v).trim() !== ""
    );
    const photos = Array.isArray(c.photoUrls) && c.photoUrls.length > 0;
    return (
      textHas ||
      photos ||
      !!c.font ||
      !!c.color ||
      !!c.style ||
      !!c.previewImage ||
      !!c.printFile
    );
  }
  return false;
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const data = await req.json();

    if (!data || !Array.isArray(data.products) || data.products.length === 0) {
      return NextResponse.json(
        { success: false, message: "Invalid payload: products required" },
        { status: 400 }
      );
    }

    if (!data.userEmail || !data.userName) {
      return NextResponse.json(
        { success: false, message: "User name and email are required" },
        { status: 400 }
      );
    }

    // 1️⃣ Check if user exists, else create one
    let user = await User.findOne({ email: data.userEmail });
    if (!user) {
      user = await User.create({
        name: data.userName,
        email: data.userEmail,
        password: data.userEmail + "_auto", // auto password for now
        role: "user",
        phone: data.phone || "",
        orders: [],
      });
    }

    // 2️⃣ Create unique order number & QR
    const orderNumber = await generateOrderId();
    const qrCode = await generateQR(
      `${process.env.BASE_URL}/order/track/${orderNumber}`
    );

    // 3️⃣ Format products
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
        ...(includeCustomization && {
          customization: {
            isCustomized: true,
            textData: {
              name: p.customization?.textData?.name || "",
              className: p.customization?.textData?.className || "",
              schoolName: p.customization?.textData?.schoolName || "",
              section: p.customization?.textData?.section || "",
            },
            photoUrls: Array.isArray(p.customization?.photoUrls)
              ? p.customization.photoUrls
              : p.customization?.photoUrls
              ? [p.customization.photoUrls]
              : [],
            font: p.customization?.font || "",
            color: p.customization?.color || "",
            style: p.customization?.style || "",
            isCartoonStyle: !!p.customization?.isCartoonStyle,
            previewImage: p.customization?.previewImage || p.previewImage || "",
            printFile: p.customization?.printFile || "",
          },
        }),
      };
    });

    // 4️⃣ Calculate totals
    const subtotal = products.reduce(
      (acc: number, pr: any) => acc + (Number(pr.totalPrice) || 0),
      0
    );
    const tax = Number(data.tax || 0);
    const shipping = Number(data.shipping || 0);
    const discount = Number(data.discount || 0);
    const total = subtotal + tax + shipping - discount;

    // 5️⃣ Format shipping address
    const addr = data.shippingAddress || {};
    const shippingAddress = {
      userName: addr.userName || data.userName || "",
      phone: addr.phone || data.phone || "",
      alternatePhone: addr.alternatePhone || "",
      postalCode: addr.postalCode || "",
      locality: addr.locality || "",
      street: addr.street || "",
      city: addr.city || "",
      district: addr.district || "",
      state: addr.state || "",
      country: addr.country || "India",
      landmark: addr.landmark || "",
      addressType: addr.addressType || "home",
    };

    if (
      !shippingAddress.postalCode ||
      !shippingAddress.street ||
      !shippingAddress.city
    ) {
      return NextResponse.json(
        { success: false, message: "Incomplete shipping address" },
        { status: 400 }
      );
    }

    // 6️⃣ Create Order document
    const newOrderData = {
      orderNumber,
      qrCode,
      userId: user._id,
      userEmail: data.userEmail,
      userName: data.userName,
      phone: data.phone || "",
      products,
      subtotal,
      tax,
      shipping,
      discount,
      total,
      shippingAddress,
      paymentMethod: data.paymentMethod || "cod",
      paymentStatus: data.paymentStatus || "pending",
      status: "pending",
      printFileUrl: "",
      driveFolder: "",
      previewImage: data.previewImage || "",
    };

    const newOrder = await Order.create(newOrderData);

    // 7️⃣ Link order to user
    await User.findByIdAndUpdate(user._id, {
      $push: { orders: newOrder._id },
    });

    // After const newOrder = await Order.create(newOrderData);
    if (data.paymentTransactionId) {
      await Order.findByIdAndUpdate(newOrder._id, {
        paymentTransactionId: data.paymentTransactionId,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      order: newOrder,
      userId: user._id,
    });
  } catch (error: any) {
    console.error("❌ Order Creation Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to create order" },
      { status: 500 }
    );
  }
}
