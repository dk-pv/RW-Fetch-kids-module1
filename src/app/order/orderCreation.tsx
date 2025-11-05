"use client";
import { useState } from "react";

export default function OrderPage() {
  const [form, setForm] = useState({
    userName: "",
    userEmail: "",
    phone: "",
  });

  const [products, setProducts] = useState([
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
        photoUrls: [] as string[],
        isCartoonStyle: false,
      },
      photoFile: null as File | null,
      previewUrl: "",
    },
  ]);

  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (
    file: File,
    folder: string,
    fileType: string
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    formData.append("fileType", fileType);

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.url || "";
  };

  const addProduct = () => {
    setProducts([
      ...products,
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
  };

  const handleProductChange = (index: number, field: string, value: any) => {
    const updated = [...products];
    (updated[index] as any)[field] = value;
    setProducts(updated);
  };

  const handleCustomizationChange = (
    index: number,
    field: string,
    value: any
  ) => {
    const updated = [...products];
    (updated[index].customization as any)[field] = value;
    setProducts(updated);
  };

  const handleTextDataChange = (index: number, key: string, value: any) => {
    const updated = [...products];
    (updated[index].customization.textData as any)[key] = value;
    setProducts(updated);
  };

  const handleImageChange = async (index: number, file: File | null) => {
    if (!file) return;
    const url = await handleFileUpload(
      file,
      "fetchkids/orders/photos",
      "photo"
    );
    const updated = [...products];
    updated[index].photoFile = file;
    updated[index].customization.photoUrls = [url];
    updated[index].previewUrl = url;
    setProducts(updated);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    const uploadedProducts = await Promise.all(
      products.map(async (p) => {
        if (p.photoFile && !p.previewUrl) {
          const url = await handleFileUpload(
            p.photoFile,
            "fetchkids/orders/photos",
            "photo"
          );
          return {
            ...p,
            previewUrl: url,
            customization: {
              ...p.customization,
              photoUrls: [url],
            },
          };
        }
        return p;
      })
    );

    const subtotal = uploadedProducts.reduce(
      (sum, p) => sum + Number(p.price) * Number(p.quantity),
      0
    );

    const orderData = {
      userName: form.userName,
      userEmail: form.userEmail,
      phone: form.phone,
      products: uploadedProducts.map((p) => {
        const hasCustomization =
          p.isCustomized ||
          Object.values(p.customization.textData).some((val) => val) ||
          p.customization.photoUrls.length > 0 ||
          p.customization.font ||
          p.customization.style;

        return {
          name: p.name,
          price: Number(p.price),
          quantity: Number(p.quantity),
          isCustomized: hasCustomization,
          imageUrl: p.previewUrl,
          customization: hasCustomization
            ? {
                isCustomized: true,
                textData: p.customization.textData,
                photoUrls: p.customization.photoUrls,
                font: p.customization.font,
                color: p.customization.color,
                style: p.customization.style,
                isCartoonStyle: p.customization.isCartoonStyle,
                previewImage: p.previewUrl,
                printFile: "",
              }
            : {},
        };
      }),
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

    console.log("🟢 Final Order Payload:", orderData);

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    const data = await res.json();
    setLoading(false);

    if (data.success) {
      window.location.href = `/order/success?orderId=${data.order.orderNumber}`;
    } else {
      alert("Order creation failed: " + data.message);
    }
  };

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
          onChange={(e) => setForm({ ...form, userName: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <input
          placeholder="Email"
          value={form.userEmail}
          onChange={(e) => setForm({ ...form, userEmail: e.target.value })}
          className="border p-2 rounded"
          required
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
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
                value={p.price}
                onChange={(e) =>
                  handleProductChange(index, "price", e.target.value)
                }
                className="border p-2 rounded"
                required
              />
              <input
                placeholder="Quantity"
                value={p.quantity}
                onChange={(e) =>
                  handleProductChange(index, "quantity", e.target.value)
                }
                className="border p-2 rounded"
                required
              />

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={p.isCustomized}
                  onChange={(e) =>
                    handleProductChange(index, "isCustomized", e.target.checked)
                  }
                />
                <label>Customize this product?</label>
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
                        alt="Preview"
                        className="rounded shadow-md mx-auto max-h-40"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addProduct}
          className="bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
        >
          + Add Another Product
        </button>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-4 transition"
        >
          {loading ? "Processing..." : "Submit Order"}
        </button>
      </form>
    </div>
  );
}
