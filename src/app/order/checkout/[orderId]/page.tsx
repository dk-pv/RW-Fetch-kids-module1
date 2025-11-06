import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Customization = {
  textData?: {
    name?: string;
    className?: string;
    schoolName?: string;
    section?: string;
  };
  font?: string;
  color?: string;
  style?: string;
  photoUrls?: string[];
  previewImage?: string;
};

type Product = {
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  isCustomized?: boolean;
  customization?: Customization;
  totalPrice?: number;
};

type ShippingAddress = {
  userName?: string;
  phone?: string;
  alternatePhone?: string;
  postalCode?: string;
  locality?: string;
  street?: string;
  city?: string;
  state?: string;
  country?: string;
  landmark?: string;
  addressType?: string;
};

type Order = {
  orderNumber: string;
  userName: string;
  userEmail: string;
  phone?: string;
  products: Product[];
  subtotal: number;
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  shippingAddress?: ShippingAddress;
};

async function getOrder(orderId: string): Promise<Order | null> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/orders/${orderId}`, {
      cache: "no-store",
      headers: { "x-user-role": "user" },
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data.order || null;
  } catch (error) {
    console.error("❌ Failed to fetch order:", error);
    return null;
  }
}

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrder(orderId);

  if (!order) return notFound();

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-center text-blue-700">
        Checkout — Order #{order.orderNumber}
      </h1>

      <div className="bg-gray-50 rounded-lg p-4 mb-6 shadow">
        <h2 className="text-lg font-semibold mb-3">Order Summary</h2>
        {order.products.map((product, i) => (
          <div
            key={i}
            className="border-b border-gray-200 py-3 flex flex-col sm:flex-row sm:justify-between"
          >
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-gray-600">
                Qty: {product.quantity} × ₹{product.price}
              </p>

              {product.isCustomized && product.customization && (
                <div className="text-sm text-gray-700 mt-1">
                  {product.customization.textData?.name && (
                    <p>👦 Name: {product.customization.textData.name}</p>
                  )}
                  {product.customization.textData?.className && (
                    <p>🏫 Class: {product.customization.textData.className}</p>
                  )}
                  {product.customization.textData?.schoolName && (
                    <p>
                      🏫 School: {product.customization.textData.schoolName}
                    </p>
                  )}
                  {product.customization.font && (
                    <p>🖋 Font: {product.customization.font}</p>
                  )}
                  {product.customization.color && (
                    <p>
                      🎨 Color:
                      <span
                        className="inline-block w-4 h-4 rounded ml-2"
                        style={{ backgroundColor: product.customization.color }}
                      />
                    </p>
                  )}
                </div>
              )}
            </div>

            {product.imageUrl && (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="mt-2 sm:mt-0 w-20 h-20 object-cover rounded shadow"
              />
            )}
          </div>
        ))}

        <div className="text-right font-semibold mt-4">
          <p>Subtotal: ₹{order.subtotal}</p>
          <p>Total: ₹{order.total}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 mb-6 shadow">
        <h2 className="text-lg font-semibold mb-3">Shipping Address</h2>
        <p className="text-gray-700">
          <strong>{order.shippingAddress?.userName || order.userName}</strong>
        </p>
        <p>{order.shippingAddress?.street}</p>
        <p>
          {order.shippingAddress?.locality}, {order.shippingAddress?.city},{" "}
          {order.shippingAddress?.state} - {order.shippingAddress?.postalCode}
        </p>
        <p>{order.shippingAddress?.country}</p>
        <p className="text-sm text-gray-600 mt-2">
          📞 {order.shippingAddress?.phone || order.phone}
          {order.shippingAddress?.alternatePhone
            ? ` / ${order.shippingAddress.alternatePhone}`
            : ""}
        </p>
        {order.shippingAddress?.landmark && (
          <p className="text-sm text-gray-600">
            📍 Landmark: {order.shippingAddress.landmark}
          </p>
        )}
        <p className="text-sm mt-2 capitalize">
          Type: {order.shippingAddress?.addressType || "Home"}
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 shadow">
        <h2 className="text-lg font-semibold mb-3">Payment</h2>
        <p className="text-gray-700">
          Method:{" "}
          <span className="font-medium uppercase">
            {order.paymentMethod === "cod"
              ? "Cash on Delivery"
              : order.paymentMethod}
          </span>
        </p>
        <p className="text-gray-700 mt-1">
          Status: <span className="font-medium capitalize">{order.status}</span>
        </p>

        <div className="text-center mt-6">
          <form
            action={`/order/success?orderId=${order.orderNumber}`}
            method="GET"
          >
            <button
              type="submit"
              className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700 transition"
            >
              Place Order
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
