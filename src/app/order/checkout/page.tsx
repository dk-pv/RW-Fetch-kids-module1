"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrder } from "@/context/OrderContext";

type ProductType = {
  name: string;
  price: number | string;
  quantity: number | string;
  previewUrl?: string;
  isCustomized?: boolean;
  customization?: any;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { orderData, clearOrder } = useOrder();
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!orderData?.user?.name || !orderData?.products?.length) {
      router.push("/order");
    }
  }, [orderData, router]);

  const subtotal =
    orderData.products?.reduce(
      (
        sum: number,
        p: { price: number | string; quantity: number | string }
      ) => sum + Number(p.price || 0) * Number(p.quantity || 0),
      0
    ) || 0;

  const handlePlaceOrder = async () => {
    if (!orderData.shippingAddress) {
      alert("Shipping address missing!");
      router.push("/order/location");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        userName: orderData.user.name,
        userEmail: orderData.user.email,
        phone: orderData.user.phone,
        products: orderData.products,
        subtotal,
        tax: 0,
        shipping: 0,
        total: subtotal,
        shippingAddress: orderData.shippingAddress,
        paymentMethod: "cod",
      };

      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setLoading(false);

      if (data?.success) {
        setShowSuccess(true); 
        setTimeout(() => {
          clearOrder();
          router.push(`/order}`);
        }, 2000);
      } else {
        alert(data?.message || "Order creation failed.");
      }
    } catch (err) {
      setLoading(false);
      alert("Network error creating order.");
    }
  };

  const address = orderData.shippingAddress || {};

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-center text-blue-700">
        Checkout Summary
      </h1>

      <div className="bg-white shadow rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold mb-4 border-b pb-2">Products</h2>
        {orderData.products?.map(
          (
            p: ProductType,
            i: number
          ) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center justify-between border-b py-3"
            >
              <div className="flex items-start gap-3">
                {p.previewUrl && (
                  <img
                    src={p.previewUrl}
                    alt={p.name}
                    className="w-20 h-20 object-cover rounded shadow-sm"
                  />
                )}
                <div>
                  <p className="font-medium">{p.name}</p>
                  <p className="text-sm text-gray-600">
                    Qty: {p.quantity} × ₹{p.price}
                  </p>

                  {p.isCustomized && p.customization && (
                    <div className="text-sm text-gray-700 mt-1">
                      {p.customization.textData?.name && (
                        <p>👦 {p.customization.textData.name}</p>
                      )}
                      {p.customization.textData?.className && (
                        <p>🏫 {p.customization.textData.className}</p>
                      )}
                      {p.customization.textData?.schoolName && (
                        <p>🏫 {p.customization.textData.schoolName}</p>
                      )}
                      {p.customization.font && (
                        <p>🖋 {p.customization.font}</p>
                      )}
                      {p.customization.color && (
                        <p>
                          🎨{" "}
                          <span
                            className="inline-block w-4 h-4 rounded"
                            style={{
                              backgroundColor: p.customization.color,
                            }}
                          />
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <p className="font-semibold mt-2 sm:mt-0">
                ₹{Number(p.price) * Number(p.quantity)}
              </p>
            </div>
          )
        )}

        <div className="text-right font-semibold mt-3">
          <p>Subtotal: ₹{subtotal}</p>
          <p>Shipping: ₹0</p>
          <p>Total: ₹{subtotal}</p>
        </div>
      </div>

      {/* 🚚 Shipping Address */}
      <div className="bg-white shadow rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold mb-3 border-b pb-2">
          Shipping Address
        </h2>
        <div className="text-gray-700 leading-relaxed">
          <p className="font-medium">{address.userName}</p>
          <p>{address.street}</p>
          <p>
            {address.locality}, {address.city}, {address.district},{" "}
            {address.state} - {address.postalCode}
          </p>
          <p>{address.country}</p>
          <p className="text-sm mt-1">
            📞 {address.phone}{" "}
            {address.alternatePhone && ` / ${address.alternatePhone}`}
          </p>
          {address.landmark && (
            <p className="text-sm text-gray-600">
              📍 Landmark: {address.landmark}
            </p>
          )}
          <p className="text-sm capitalize mt-1">
            Type: {address.addressType}
          </p>
        </div>
      </div>

      {/* 💳 Payment Section */}
      <div className="bg-white shadow rounded-lg p-5 mb-6">
        <h2 className="text-lg font-semibold mb-3 border-b pb-2">Payment</h2>
        <p className="text-gray-700 mb-2">
          Method: <span className="font-medium">Cash on Delivery</span>
        </p>
        <p className="text-gray-700">Status: Pending</p>
      </div>

      <div className="text-center mt-6">
        <button
          onClick={handlePlaceOrder}
          disabled={loading}
          className={`${
            loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
          } text-white px-8 py-3 rounded-lg font-medium transition`}
        >
          {loading ? "Placing Order..." : "Place Order"}
        </button>
      </div>

      {/* 🎉 Success Popup */}
      {showSuccess && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 text-center max-w-sm">
            <h2 className="text-xl font-semibold mb-2 text-green-600">
              🎉 Order Placed Successfully!
            </h2>
            <p className="text-gray-700">
              Your order has been created. QR code & Order ID generated.
            </p>
            <p className="mt-2 font-medium text-blue-600">Redirecting...</p>
          </div>
        </div>
      )}
    </div>
  );
}
