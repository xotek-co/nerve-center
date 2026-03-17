import { NextRequest, NextResponse } from "next/server";
import { getAuthCookieName, verifySignedToken } from "@/lib/auth";

export async function GET(_request: NextRequest) {
  try {
    const token = _request.cookies.get(getAuthCookieName())?.value;
    if (!token) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    const valid = await verifySignedToken(token);
    if (!valid) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }
    return NextResponse.json({ authenticated: true });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
