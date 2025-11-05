"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function OrderSuccess() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      try {
        const res = await fetch(`/api/orders/${orderId}`, {
          headers: { "x-user-role": "user" },
        });
        const data = await res.json();
        setOrder(data.order);
      } catch (error) {
        console.error("Error fetching order:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [orderId]);

  if (loading)
    return <div className="p-8 text-center text-gray-500">Loading...</div>;

  if (!order)
    return (
      <div className="p-8 text-center text-red-600">
        Failed to load order details.
      </div>
    );

  return (
    <div className="p-8 max-w-3xl mx-auto text-center">
      <h1 className="text-3xl font-bold mb-4 text-green-600">
        Order Placed Successfully 🎉
      </h1>

      <p className="text-lg text-gray-700 mb-2">
        Thank you <span className="font-medium">{order.userName}</span>! Your
        order has been placed successfully.
      </p>
      <p className="text-xl font-semibold mb-6">
        Order Number: <span className="text-blue-600">{order.orderNumber}</span>
      </p>

      {/* 🛍️ Products Summary */}
      <div className="border rounded-lg p-4 mb-6 bg-gray-50 text-left">
        <h2 className="text-lg font-semibold mb-2">Order Summary</h2>

        {order.products.map((product: any, index: number) => (
          <div
            key={index}
            className="border-b border-gray-200 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-start"
          >
            <div className="sm:w-3/4">
              <p className="font-semibold text-gray-800">{product.name}</p>
              <p className="text-sm text-gray-600 mb-1">
                Qty: {product.quantity} × ₹{product.price}
              </p>

              {product.isCustomized && product.customization && (
                <div className="mt-3 bg-white border rounded-md p-3">
                  <h4 className="font-medium mb-2 text-blue-700">
                    Customization Details
                  </h4>

                  <div className="text-sm text-gray-700 space-y-1">
                    {product.customization.textData?.name && (
                      <p>👶 Name: {product.customization.textData.name}</p>
                    )}
                    {product.customization.textData?.className && (
                      <p>
                        📚 Class: {product.customization.textData.className}
                      </p>
                    )}
                    {product.customization.textData?.section && (
                      <p>
                        📂 Section: {product.customization.textData.section}
                      </p>
                    )}
                    {product.customization.textData?.schoolName && (
                      <p>
                        🏫 School: {product.customization.textData.schoolName}
                      </p>
                    )}
                  </div>

                  <div className="mt-2 text-sm text-gray-700 space-y-1">
                    {product.customization.font && (
                      <p>🖋️ Font: {product.customization.font}</p>
                    )}
                    {product.customization.color && (
                      <p className="flex items-center gap-2">
                        🎨 Color:
                        <span
                          className="inline-block w-4 h-4 rounded"
                          style={{
                            backgroundColor: product.customization.color,
                          }}
                        ></span>
                        <span className="text-xs text-gray-500">
                          {product.customization.color}
                        </span>
                      </p>
                    )}
                    {product.customization.style && (
                      <p>✨ Style: {product.customization.style}</p>
                    )}
                    {product.customization.isCartoonStyle && (
                      <p>🧩 Type: Cartoon Style</p>
                    )}
                  </div>

                  {product.customization.photoUrls?.length > 0 && (
                    <div className="mt-3">
                      <p className="font-medium text-sm mb-1">
                        Uploaded Photos:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {product.customization.photoUrls.map(
                          (url: string, i: number) => (
                            <img
                              key={i}
                              src={url}
                              alt={`Customization ${i + 1}`}
                              className="rounded shadow w-20 h-20 object-cover border"
                            />
                          )
                        )}
                      </div>
                    </div>
                  )}

                  {product.customization.previewImage && (
                    <div className="mt-3">
                      <p className="font-medium text-sm mb-1">Preview Image:</p>
                      <img
                        src={product.customization.previewImage}
                        alt="Preview"
                        className="rounded shadow-md mx-auto max-h-40"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="mt-4 sm:mt-0 rounded-md shadow w-28 h-28 object-cover"
              />
            )}
          </div>
        ))}

        <div className="text-right mt-5 font-semibold text-lg">
          Total: ₹{order.total}
        </div>
      </div>

      <div className="mt-6">
        <p className="text-gray-700 mb-3">
          You can track your order status anytime using the link below:
        </p>
        <a
          href={`/order/track/${order.orderNumber}`}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition"
        >
          Track My Order
        </a>
      </div>

      <p className="mt-6 text-gray-500 text-sm">
        A confirmation email will be sent to{" "}
        <span className="font-medium">{order.userEmail}</span>.
      </p>
    </div>
  );
}
