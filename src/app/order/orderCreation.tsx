"use client";
import React, { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

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

export default function OrderPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    userName: "",
    userEmail: "",
    phone: "",
  });

  const [products, setProducts] = useState<ProductType[]>([
    {
      name: "",
      price: "",
      quantity: "",
      isCustomized: false,
      customization: {
        textData: { name: "", className: "", schoolName: "", section: "" },
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

  const handleFileUpload = useCallback(
    async (
      file: File,
      folder = "fetchkids/orders/photos",
      fileType = "photo"
    ) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", folder);
      formData.append("fileType", fileType);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      return data.url || "";
    },
    []
  );

  const addProduct = useCallback(() => {
    setProducts((prev) => [
      ...prev,
      {
        name: "",
        price: "",
        quantity: "",
        isCustomized: false,
        customization: {
          textData: { name: "", className: "", schoolName: "", section: "" },
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

  const handleProductChange = useCallback(
    (index: number, field: string, value: any) => {
      setProducts((prev) =>
        prev.map((p, i) => (i === index ? { ...p, [field]: value } : p))
      );
    },
    []
  );

  const handleCustomizationChange = useCallback(
    (index: number, field: string, value: any) => {
      setProducts((prev) =>
        prev.map((p, i) =>
          i === index
            ? { ...p, customization: { ...p.customization, [field]: value } }
            : p
        )
      );
    },
    []
  );

  const handleTextDataChange = useCallback(
    (index: number, key: string, value: any) => {
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
        const cloudUrl = await handleFileUpload(
          file,
          "fetchkids/orders/photos",
          "photo"
        );

        setProducts((prev) =>
          prev.map((p, i) => {
            if (i !== index) return p;

            if (
              p.previewUrl &&
              p.previewUrl.startsWith("blob:") &&
              p.previewUrl !== cloudUrl
            ) {
              try {
                URL.revokeObjectURL(p.previewUrl);
              } catch (e) {}
            }
            return {
              ...p,
              previewUrl: cloudUrl,
              photoFile: null,
              customization: { ...p.customization, photoUrls: [cloudUrl] },
            };
          })
        );
      } catch (err) {}
    },
    [handleFileUpload]
  );

  const ensureUploadsComplete = useCallback(
    async (items: ProductType[]) => {
      return Promise.all(
        items.map(async (p) => {
          if (p.customization.photoUrls && p.customization.photoUrls.length > 0)
            return p;

          if (p.photoFile) {
            try {
              const cloudUrl = await handleFileUpload(
                p.photoFile,
                "fetchkids/orders/photos",
                "photo"
              );
              if (
                p.previewUrl &&
                p.previewUrl.startsWith("blob:") &&
                p.previewUrl !== cloudUrl
              ) {
                try {
                  URL.revokeObjectURL(p.previewUrl);
                } catch {}
              }
              return {
                ...p,
                previewUrl: cloudUrl,
                photoFile: null,
                customization: { ...p.customization, photoUrls: [cloudUrl] },
              };
            } catch {
              return p;
            }
          }

          return p;
        })
      );
    },
    [handleFileUpload]
  );

  const handleSubmit = useCallback(
    async (e: any) => {
      e.preventDefault();
      startTransition(async () => {
        setLoading(true);

        const uploadedProducts = await ensureUploadsComplete(products);

        const subtotal = uploadedProducts.reduce(
          (sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 0),
          0
        );

        const orderProducts = uploadedProducts.map((p) => {
          const hasCustomization =
            p.isCustomized ||
            Object.values(p.customization.textData).some((v) => !!v) ||
            (p.customization.photoUrls &&
              p.customization.photoUrls.length > 0) ||
            !!p.customization.font ||
            !!p.customization.style;

          return {
            name: p.name,
            price: Number(p.price || 0),
            quantity: Number(p.quantity || 0),
            isCustomized: hasCustomization,
            imageUrl: p.previewUrl || "",
            customization: hasCustomization
              ? {
                  isCustomized: true,
                  textData: p.customization.textData,
                  photoUrls: p.customization.photoUrls || [],
                  font: p.customization.font,
                  color: p.customization.color,
                  style: p.customization.style,
                  isCartoonStyle: p.customization.isCartoonStyle,
                  previewImage: p.previewUrl || "",
                  printFile: "",
                }
              : {},
          };
        });

        const orderData = {
          userName: form.userName,
          userEmail: form.userEmail,
          phone: form.phone,
          products: orderProducts,
          subtotal,
          tax: 0,
          shipping: 0,
          total: subtotal,
          shippingAddress: {
            firstName: form.userName.split(" ")[0] || "",
            lastName: form.userName.split(" ")[1] || "",
            street: "N/A",
            city: "N/A",
            state: "Kerala",
            postalCode: "000000",
            phone: form.phone,
          },
          paymentMethod: "cod",
        };

        try {
          const res = await fetch("/api/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(orderData),
          });
          const data = await res.json();
          setLoading(false);

          if (data?.success) {
            router.push(`/order/success?orderId=${data.order.orderNumber}`);
          } else {
            alert(
              "Order creation failed: " + (data?.message || "Server error")
            );
          }
        } catch (err) {
          setLoading(false);
          alert("Network error creating order");
        }
      });
    },
    [ensureUploadsComplete, form, products, router]
  );

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        Create New Order
      </h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Customer Info</h2>
        <input
          placeholder="Full Name"
          value={form.userName}
          onChange={(e) => setForm((f) => ({ ...f, userName: e.target.value }))}
          className="border p-2 rounded"
          required
        />
        <input
          placeholder="Email"
          value={form.userEmail}
          onChange={(e) =>
            setForm((f) => ({ ...f, userEmail: e.target.value }))
          }
          className="border p-2 rounded"
          required
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          className="border p-2 rounded"
        />

        <h2 className="text-lg font-medium mt-6">Products</h2>

        {products.map((p, index) => (
          <div key={index} className="border rounded p-4 mb-4">
            <div className="flex flex-col gap-2">
              <input
                placeholder="Product Name"
                value={p.name}
                onChange={(e) =>
                  handleProductChange(index, "name", e.target.value)
                }
                className="border p-2 rounded"
                required
              />
              <input
                placeholder="Price"
                inputMode="numeric"
                value={String(p.price)}
                onChange={(e) =>
                  handleProductChange(index, "price", e.target.value)
                }
                className="border p-2 rounded"
                required
              />
              <input
                placeholder="Quantity"
                inputMode="numeric"
                value={String(p.quantity)}
                onChange={(e) =>
                  handleProductChange(index, "quantity", e.target.value)
                }
                className="border p-2 rounded"
                required
              />

              <div className="flex items-center gap-2 mt-2">
                <input
                  id={`customize-${index}`}
                  type="checkbox"
                  checked={p.isCustomized}
                  onChange={(e) =>
                    handleProductChange(index, "isCustomized", e.target.checked)
                  }
                />
                <label htmlFor={`customize-${index}`}>
                  Customize this product?
                </label>
              </div>

              {p.isCustomized && (
                <div className="border-t pt-3 mt-3">
                  <h3 className="font-medium mb-2">Customization Details</h3>

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
                    placeholder="Section"
                    value={p.customization.textData.section}
                    onChange={(e) =>
                      handleTextDataChange(index, "section", e.target.value)
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

                  <div className="flex items-center gap-3 mb-2">
                    <label>Font:</label>
                    <input
                      placeholder="Font"
                      value={p.customization.font}
                      onChange={(e) =>
                        handleCustomizationChange(index, "font", e.target.value)
                      }
                      className="border p-2 rounded flex-1"
                    />
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <label>Color:</label>
                    <input
                      type="color"
                      value={p.customization.color}
                      onChange={(e) =>
                        handleCustomizationChange(
                          index,
                          "color",
                          e.target.value
                        )
                      }
                      className="border p-1 rounded w-16"
                    />
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <label>Style:</label>
                    <input
                      placeholder="Style (optional)"
                      value={p.customization.style}
                      onChange={(e) =>
                        handleCustomizationChange(
                          index,
                          "style",
                          e.target.value
                        )
                      }
                      className="border p-2 rounded flex-1"
                    />
                  </div>

                  <h4 className="text-sm font-medium mt-2">Upload Photo</h4>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) =>
                      handleImageChange(index, e.target.files?.[0] || null)
                    }
                    className="border p-2 rounded"
                  />

                  {p.previewUrl && (
                    <div className="mt-2 text-center">
                      <img
                        src={p.previewUrl}
                        alt={`${p.name || "product"} preview`}
                        className="rounded shadow-md mx-auto max-h-40"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={addProduct}
            className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition"
          >
            + Add Another Product
          </button>

          <button
            type="submit"
            disabled={loading || isPending}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded mt-0 transition disabled:opacity-50"
          >
            {loading || isPending ? "Processing..." : "Submit Order"}
          </button>
        </div>
      </form>
    </div>
  );
}
