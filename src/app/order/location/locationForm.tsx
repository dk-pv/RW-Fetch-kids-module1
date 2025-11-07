"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useOrder } from "@/context/OrderContext";

export default function LocationPage() {
  const router = useRouter();
  const { orderData, setOrderData } = useOrder();

  const [address, setAddress] = useState({
    userName: orderData.user?.name || "",
    phone: orderData.user?.phone || "",
    alternatePhone: "",
    postalCode: "",
    locality: "",
    street: "",
    city: "",
    district: "",
    state: "",
    country: "India",
    landmark: "",
    addressType: "home",
  });

  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (orderData.user) {
      setAddress((a) => ({
        ...a,
        userName: orderData.user?.name || "",
        phone: orderData.user?.phone || "",
      }));
    }
  }, [orderData.user]);

  const handlePincodeChange = async (value: string) => {
    setAddress((a) => ({ ...a, postalCode: value }));
    setError("");
    if (value.length === 6) {
      setIsFetching(true);
      try {
        const res = await fetch(
          `https://api.postalpincode.in/pincode/${value}`
        );
        const data = await res.json();
        if (Array.isArray(data) && data[0]?.Status === "Success") {
          const postOffice = data[0].PostOffice?.[0];
          setAddress((a) => ({
            ...a,
            city: postOffice?.Name || postOffice?.District || "",
            district: postOffice?.District || "",
            state: postOffice?.State || "",
            country: postOffice?.Country || "India",
          }));
        } else {
          setError("Invalid Pincode or not found");
        }
      } catch {
        setError("Failed to fetch location");
      } finally {
        setIsFetching(false);
      }
    }
  };

  const handleContinue = () => {
    if (!address.userName || !address.phone || !address.street) {
      alert("Please fill all required fields");
      return;
    }

    setOrderData({
      ...orderData,
      shippingAddress: address,
    });

    router.push("/order/checkout");
  };

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h2 className="text-xl font-semibold mb-4 text-center">
        Enter Shipping Address
      </h2>

      <div className="grid gap-3">
        <input
          placeholder="Full Name"
          value={address.userName}
          onChange={(e) => setAddress({ ...address, userName: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          placeholder="Mobile Number"
          value={address.phone}
          onChange={(e) => setAddress({ ...address, phone: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          placeholder="Alternate Phone"
          value={address.alternatePhone}
          onChange={(e) =>
            setAddress({ ...address, alternatePhone: e.target.value })
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

        {isFetching && (
          <p className="text-sm text-gray-500">Fetching location...</p>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}

        <input
          placeholder="Locality / Area"
          value={address.locality}
          onChange={(e) => setAddress({ ...address, locality: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          placeholder="House No / Street / Building"
          value={address.street}
          onChange={(e) => setAddress({ ...address, street: e.target.value })}
          className="border p-2 rounded"
        />

        {/* ✅ City, District, State, Country Auto-fill */}
        <input
          placeholder="City / Local Post Office"
          value={address.city}
          readOnly
          className="border p-2 rounded bg-gray-100"
        />
        <input
          placeholder="District"
          value={address.district}
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
          onChange={(e) => setAddress({ ...address, landmark: e.target.value })}
          className="border p-2 rounded"
        />

        {/* Address Type */}
        <div className="flex gap-4 mt-3">
          <label>
            <input
              type="radio"
              name="addressType"
              value="home"
              checked={address.addressType === "home"}
              onChange={(e) =>
                setAddress({ ...address, addressType: e.target.value })
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
                setAddress({ ...address, addressType: e.target.value })
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
                setAddress({ ...address, addressType: e.target.value })
              }
            />{" "}
            Other
          </label>
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700 mt-5"
        >
          Continue to Checkout
        </button>
      </div>
    </div>
  );
}
