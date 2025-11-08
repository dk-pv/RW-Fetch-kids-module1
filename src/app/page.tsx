"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      setLoading(false);

      if (!data.success) {
        setMessage(data.message);
        return;
      }

      // Save user data locally
      localStorage.setItem("fetchkids_user", JSON.stringify(data.user));

      // Redirect by role
      if (data.user.role === "admin") router.push("/admin");
      else router.push("/order");
    } catch (error) {
      console.error(error);
      setLoading(false);
      setMessage("Something went wrong");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-lg rounded-lg p-8 w-full max-w-md"
      >
        <h1 className="text-2xl font-bold text-center mb-4">Welcome to FetchKids</h1>
        <p className="text-gray-600 text-center mb-6">
          Login or Register to continue
        </p>

        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="border p-2 rounded w-full mb-3"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          className="border p-2 rounded w-full mb-3"
        />
        <input
          type="text"
          placeholder="Name (optional)"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="border p-2 rounded w-full mb-4"
        />

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 transition"
        >
          {loading ? "Processing..." : "Continue"}
        </button>

        {message && <p className="text-red-500 text-center mt-3">{message}</p>}
      </form>
    </div>
  );
}
