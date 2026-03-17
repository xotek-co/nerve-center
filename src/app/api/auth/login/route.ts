import { NextRequest, NextResponse } from "next/server";
import {
  ALLOWED_EMAIL,
  ALLOWED_PASSWORD,
  createSignedToken,
  getAuthCookieName,
  getAuthCookieOptions,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (email !== ALLOWED_EMAIL || password !== ALLOWED_PASSWORD) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await createSignedToken();
    const res = NextResponse.json({ success: true });
    res.cookies.set(getAuthCookieName(), token, getAuthCookieOptions());
    return res;
  } catch (err) {
    const message = err instanceof Error && err.message.includes("AUTH_SECRET")
      ? "Server misconfigured: add AUTH_SECRET to .env.local (min 16 characters)"
      : "Authentication failed";
    console.error("Login error:", err);
    return NextResponse.json(
      { error: message },
      { status: 503 }
    );
  }
}
