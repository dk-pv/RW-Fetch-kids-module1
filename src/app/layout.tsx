import "./globals.css";
import type { Metadata } from "next";
import { OrderProvider } from "@/context/OrderContext"; 

export const metadata: Metadata = {
  title: "Fetch Kids - Order Flow",
  description: "Customized order management system for kids products",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-800">
        <OrderProvider>
          {children}
        </OrderProvider>
      </body>
    </html>
  );
}
