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

type AddressType = {
  userName: string;
  phone: string;
  alternatePhone: string;
  postalCode: string;
  locality: string;
  street: string;
  city: string;
  state: string;
  country: string;
  landmark: string;
  addressType: string;
};

export default function OrderPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isFetchingPincode, setIsFetchingPincode] = useState(false);
  const [pincodeError, setPincodeError] = useState("");

  const [form, setForm] = useState({
    userName: "",
    userEmail: "",
    phone: "",
  });

  const [address, setAddress] = useState<AddressType>({
    userName: "",
    phone: "",
    alternatePhone: "",
    postalCode: "",
    locality: "",
    street: "",
    city: "",
    state: "",
    country: "India",
    landmark: "",
    addressType: "home",
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

  const handleFileUpload = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "fetchkids/orders/photos");
    formData.append("fileType", "photo");

    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const data = await res.json();
    return data.url || "";
  }, []);

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
        const cloudUrl = await handleFileUpload(file);
        setProducts((prev) =>
          prev.map((p, i) =>
            i === index
              ? {
                  ...p,
                  previewUrl: cloudUrl,
                  photoFile: null,
                  customization: { ...p.customization, photoUrls: [cloudUrl] },
                }
              : p
          )
        );
      } catch {}
    },
    [handleFileUpload]
  );

  const handleSubmit = (e: any) => {
    e.preventDefault();
    setAddress((a) => ({
      ...a,
      userName: form.userName,
      phone: form.phone,
    }));
    setShowAddressModal(true);
  };

  const handlePincodeChange = async (value: string) => {
    setAddress((a) => ({ ...a, postalCode: value }));
    setPincodeError("");
    if (value.length === 6) {
      setIsFetchingPincode(true);
      try {
        const res = await fetch(
          `https://api.postalpincode.in/pincode/${value}`
        );
        const data = await res.json();
        if (Array.isArray(data) && data[0]?.Status === "Success") {
          const postOffice = data[0].PostOffice?.[0];
          setAddress((a) => ({
            ...a,
            city: postOffice?.District || "",
            state: postOffice?.State || "",
          }));
        } else {
          setPincodeError("Invalid Pincode or not found");
        }
      } catch {
        setPincodeError("Failed to fetch location");
      } finally {
        setIsFetchingPincode(false);
      }
    }
  };

  const handleConfirmCheckout = async () => {
    setLoading(true);
    setShowAddressModal(false);

    const subtotal = products.reduce(
      (sum, p) => sum + Number(p.price || 0) * Number(p.quantity || 0),
      0
    );

    const orderProducts = products.map((p) => {
      const hasCustomization =
        p.isCustomized ||
        Object.values(p.customization.textData).some((v) => !!v) ||
        (p.customization.photoUrls?.length ?? 0) > 0 ||
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
      shippingAddress: address,
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
        router.push(`/order/checkout/${data.order.orderNumber}`);
      } else {
        alert("Order creation failed: " + (data?.message || "Server error"));
      }
    } catch {
      setLoading(false);
      alert("Network error");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6 text-center">
        Create New Order
      </h1>

      {/* Order Form */}
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
            {loading ? "Processing..." : "Submit Order"}
          </button>
        </div>
      </form>

      {showAddressModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4 text-center">
              Enter Shipping Address
            </h2>

            <div className="grid gap-3">
              <input
                placeholder="Full Name"
                value={address.userName}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, userName: e.target.value }))
                }
                className="border p-2 rounded"
              />
              <input
                placeholder="Mobile Number"
                value={address.phone}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, phone: e.target.value }))
                }
                className="border p-2 rounded"
              />
              <input
                placeholder="Alternate Phone"
                value={address.alternatePhone}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, alternatePhone: e.target.value }))
                }
                className="border p-2 rounded"
              />
              <input
                placeholder="Pincode"
                value={address.postalCode}
                onChange={(e) => handlePincodeChange(e.target.value)}
                className="border p-2 rounded"
                maxLength={6}
              />
              {isFetchingPincode && (
                <p className="text-sm text-gray-500">Fetching location...</p>
              )}
              {pincodeError && (
                <p className="text-sm text-red-600">{pincodeError}</p>
              )}
              <input
                placeholder="Locality / Area"
                value={address.locality}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, locality: e.target.value }))
                }
                className="border p-2 rounded"
              />
              <input
                placeholder="Address (House No / Building)"
                value={address.street}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, street: e.target.value }))
                }
                className="border p-2 rounded"
              />
              <input
                placeholder="City"
                value={address.city}
                readOnly
                className="border p-2 rounded bg-gray-100"
              />
              <input
                placeholder="State"
                value={address.state}
                readOnly
                className="border p-2 rounded bg-gray-100"
              />
              <input
                placeholder="Country"
                value={address.country}
                readOnly
                className="border p-2 rounded bg-gray-100"
              />
              <input
                placeholder="Landmark (Optional)"
                value={address.landmark}
                onChange={(e) =>
                  setAddress((a) => ({ ...a, landmark: e.target.value }))
                }
                className="border p-2 rounded"
              />

              <div className="flex items-center gap-4 mt-2">
                <label>
                  <input
                    type="radio"
                    name="addressType"
                    value="home"
                    checked={address.addressType === "home"}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, addressType: e.target.value }))
                    }
                  />{" "}
                  Home
                </label>
                <label>
                  <input
                    type="radio"
                    name="addressType"
                    value="work"
                    checked={address.addressType === "work"}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, addressType: e.target.value }))
                    }
                  />{" "}
                  Work
                </label>
                <label>
                  <input
                    type="radio"
                    name="addressType"
                    value="other"
                    checked={address.addressType === "other"}
                    onChange={(e) =>
                      setAddress((a) => ({ ...a, addressType: e.target.value }))
                    }
                  />{" "}
                  Other
                </label>
              </div>

              <div className="flex justify-between mt-4">
                <button
                  onClick={() => setShowAddressModal(false)}
                  className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmCheckout}
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Continue to Checkout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
