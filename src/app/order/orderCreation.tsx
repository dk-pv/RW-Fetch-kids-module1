"use client";
import React, { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useOrder } from "@/context/OrderContext";

// local type for internal handling
type ProductType = {
  name: string;
  price: string | number;
  quantity: string | number;
  isCustomized: boolean;
  customization: {
    textData: {
      name: string;
      className: string;
      schoolName: string;
      section: string;
    };
    font: string;
    color: string;
    style: string;
    photoUrls: string[];
    isCartoonStyle: boolean;
  };
  photoFile: File | null;
  previewUrl: string;
};

export default function OrderCreationPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  // ✅ Access global context
  const { orderData, setOrderData } = useOrder();

  // initialize from context if available
  const [form, setForm] = useState({
    userName: orderData.user?.name || "",
    userEmail: orderData.user?.email || "",
    phone: orderData.user?.phone || "",
  });

  const [products, setProducts] = useState<ProductType[]>(
    (orderData.products as ProductType[])?.length
      ? (orderData.products as ProductType[])
      : [
          {
            name: "",
            price: "",
            quantity: "",
            isCustomized: false,
            customization: {
              textData: {
                name: "",
                className: "",
                schoolName: "",
                section: "",
              },
              font: "",
              color: "#000000",
              style: "",
              photoUrls: [],
              isCartoonStyle: false,
            },
            photoFile: null,
            previewUrl: "",
          },
        ]
  );

  // --- File Upload Function ---
  const handleFileUpload = useCallback(async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "fetchkids/orders/photos");
    formData.append("fileType", "photo");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.url || "";
  }, []);

  // --- Add Product ---
  const addProduct = useCallback(() => {
    setProducts((prev) => [
      ...prev,
      {
        name: "",
        price: "",
        quantity: "",
        isCustomized: false,
        customization: {
          textData: {
            name: "",
            className: "",
            schoolName: "",
            section: "",
          },
          font: "",
          color: "#000000",
          style: "",
          photoUrls: [],
          isCartoonStyle: false,
        },
        photoFile: null,
        previewUrl: "",
      },
    ]);
  }, []);

  // --- Product Change Handler ---
  const handleProductChange = useCallback(
    (index: number, field: keyof ProductType, value: any) => {
      setProducts((prev) =>
        prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
      );
    },
    []
  );

  // --- Customization Text Change ---
  const handleTextDataChange = useCallback(
    (index: number, key: keyof ProductType["customization"]["textData"], value: string) => {
      setProducts((prev) =>
        prev.map((p, i) =>
          i === index
            ? {
                ...p,
                customization: {
                  ...p.customization,
                  textData: { ...p.customization.textData, [key]: value },
                },
              }
            : p
        )
      );
    },
    []
  );

  // --- Image Upload Handler (⚡ keep same behaviour, no change) ---
  const handleImageChange = useCallback(
    async (index: number, file: File | null) => {
      if (!file) return;
      const blobUrl = URL.createObjectURL(file);
      setProducts((prev) =>
        prev.map((p, i) =>
          i === index ? { ...p, previewUrl: blobUrl, photoFile: file } : p
        )
      );
      try {
        const cloudUrl = await handleFileUpload(file);
        setProducts((prev) =>
          prev.map((p, i) =>
            i === index
              ? {
                  ...p,
                  previewUrl: cloudUrl,
                  photoFile: null,
                  customization: {
                    ...p.customization,
                    photoUrls: [cloudUrl],
                  },
                }
              : p
          )
        );
      } catch (err) {
        console.error("Upload failed:", err);
      }
    },
    [handleFileUpload]
  );

  // --- Submit Form Handler ---
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // ✅ Store data in global context + localStorage
    setOrderData({
      ...orderData,
      user: {
        name: form.userName,
        email: form.userEmail,
        phone: form.phone,
      },
      products: products.map((p) => ({
        name: p.name,
        price: p.price,
        quantity: p.quantity,
        isCustomized: p.isCustomized,
        customization: {
          textData: p.customization.textData,
          font: p.customization.font,
          color: p.customization.color,
          style: p.customization.style,
          photoUrls: p.customization.photoUrls,
          isCartoonStyle: p.customization.isCartoonStyle,
        },
        previewUrl: p.previewUrl,
      })),
    });

    startTransition(() => {
      router.push("/order/location");
    });

    setLoading(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        Create New Order
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* 🧍 Customer Info */}
        <h2 className="text-lg font-medium">Customer Info</h2>
        <input
          placeholder="Full Name"
          value={form.userName}
          onChange={(e) =>
            setForm((f) => ({ ...f, userName: e.target.value }))
          }
          className="border p-2 rounded"
          required
        />
        <input
          placeholder="Email"
          type="email"
          value={form.userEmail}
          onChange={(e) =>
            setForm((f) => ({ ...f, userEmail: e.target.value }))
          }
          className="border p-2 rounded"
          required
        />
        <input
          placeholder="Phone"
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="border p-2 rounded"
          required
        />

        {/* 🛍 Products Section */}
        <h2 className="text-lg font-medium mt-6">Products</h2>
        {products.map((p, index) => (
          <div key={index} className="border rounded p-4 mb-4">
            <input
              placeholder="Product Name"
              value={p.name}
              onChange={(e) =>
                handleProductChange(index, "name", e.target.value)
              }
              className="border p-2 rounded mb-2"
              required
            />
            <input
              placeholder="Price"
              value={p.price}
              onChange={(e) =>
                handleProductChange(index, "price", e.target.value)
              }
              className="border p-2 rounded mb-2"
              required
            />
            <input
              placeholder="Quantity"
              value={p.quantity}
              onChange={(e) =>
                handleProductChange(index, "quantity", e.target.value)
              }
              className="border p-2 rounded mb-2"
              required
            />

            {/* Customize toggle */}
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                checked={p.isCustomized}
                onChange={(e) =>
                  handleProductChange(index, "isCustomized", e.target.checked)
                }
              />
              <label>Customize?</label>
            </div>

            {/* 🧩 Customization Details */}
            {p.isCustomized && (
              <div className="border-t pt-3">
                <h3 className="font-medium mb-2">Customization</h3>
                <input
                  placeholder="Student Name"
                  value={p.customization.textData.name}
                  onChange={(e) =>
                    handleTextDataChange(index, "name", e.target.value)
                  }
                  className="border p-2 rounded mb-2"
                />
                <input
                  placeholder="Class"
                  value={p.customization.textData.className}
                  onChange={(e) =>
                    handleTextDataChange(index, "className", e.target.value)
                  }
                  className="border p-2 rounded mb-2"
                />
                <input
                  placeholder="School Name"
                  value={p.customization.textData.schoolName}
                  onChange={(e) =>
                    handleTextDataChange(index, "schoolName", e.target.value)
                  }
                  className="border p-2 rounded mb-2"
                />

                {/* 🖼 Photo Upload (no change) */}
                <h4>Upload Photo</h4>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    handleImageChange(index, e.target.files?.[0] || null)
                  }
                  className="border p-2 rounded"
                />
                {p.previewUrl && (
                  <img
                    src={p.previewUrl}
                    alt="preview"
                    className="mt-2 rounded shadow mx-auto max-h-40"
                  />
                )}
              </div>
            )}
          </div>
        ))}

        {/* Buttons */}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={addProduct}
            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
          >
            + Add Product
          </button>
          <button
            type="submit"
            disabled={loading || isPending}
            className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Processing..." : "Continue to Address"}
          </button>
        </div>
      </form>
    </div>
  );
}
