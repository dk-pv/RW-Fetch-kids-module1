import OrderCreation from "./orderCreation";

export const metadata = {
  title: "Order Creation | FetchKids",
  description: "Create and customize your order easily.",
};

export default async function OrderPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold text-center mb-6 text-blue-700">
        Order Creation Page
      </h1>
      <OrderCreation />
    </div>
  );
}
