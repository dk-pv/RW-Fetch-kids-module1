"use client";
import { createContext, useContext, useEffect, useState } from "react";

type UserInfo = {
  name: string;
  email: string;
  phone: string;
};

type TextData = {
  name?: string;
  className?: string;
  schoolName?: string;
  section?: string;
};

type Customization = {
  textData?: TextData;
  font?: string;
  color?: string;
  style?: string;
  photoUrls?: string[];
  isCartoonStyle?: boolean;
  previewImage?: string;
  printFile?: string;
};

type Product = {
  name: string;
  price: string | number;
  quantity: string | number;
  isCustomized: boolean;
  customization: Customization;
  previewUrl?: string;
};

type ShippingAddress = {
  userName?: string;
  phone?: string;
  alternatePhone?: string;
  postalCode?: string;
  locality?: string;
  street?: string;
  city?: string;
  district?: string;
  state?: string;
  country?: string;
  landmark?: string;
  addressType?: string;
};

type OrderData = {
  user: UserInfo;
  products: Product[];
  shippingAddress?: ShippingAddress;
};

type OrderContextType = {
  orderData: OrderData;
  setOrderData: React.Dispatch<React.SetStateAction<OrderData>>;
  clearOrder: () => void;
};

const OrderContext = createContext<OrderContextType | null>(null);

export function OrderProvider({ children }: { children: React.ReactNode }) {
  const [orderData, setOrderData] = useState<OrderData>({
    user: { name: "", email: "", phone: "" },
    products: [],
    shippingAddress: undefined,
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("fetchkids_order");
      if (saved) {
        try {
          setOrderData(JSON.parse(saved));
        } catch (err) {
          console.error("Failed to parse saved order:", err);
        }
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("fetchkids_order", JSON.stringify(orderData));
    }
  }, [orderData]);

  const clearOrder = () => {
    setOrderData({
      user: { name: "", email: "", phone: "" },
      products: [],
      shippingAddress: undefined,
    });
    if (typeof window !== "undefined") {
      localStorage.removeItem("fetchkids_order");
    }
  };

  return (
    <OrderContext.Provider value={{ orderData, setOrderData, clearOrder }}>
      {children}
    </OrderContext.Provider>
  );
}

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context)
    throw new Error("useOrder must be used within an OrderProvider");
  return context;
};
