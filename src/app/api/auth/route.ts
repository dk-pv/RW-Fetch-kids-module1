import { NextResponse } from "next/server";
import { connectDB } from "../db/connect";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  try {
    await connectDB();
    const { email, password, name } = await req.json();

    if (!email || !password)
      return NextResponse.json({ success: false, message: "Email and password required" }, { status: 400 });

    // ✅ Check if user already exists
    let user = await User.findOne({ email });

    if (user) {
      // 🔹 Login flow
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return NextResponse.json({ success: false, message: "Invalid password" }, { status: 401 });

      return NextResponse.json({
        success: true,
        message: "Login successful",
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });
    } else {
      // 🔹 Register flow
      const newUser = await User.create({
        name: name || email.split("@")[0],
        email,
        password,
        role: "user",
      });

      return NextResponse.json({
        success: true,
        message: "Registration successful",
        user: {
          _id: newUser._id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
        },
      });
    }
  } catch (error: any) {
    console.error("Auth Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Server error" },
      { status: 500 }
    );
  }
}
