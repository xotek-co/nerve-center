import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "nc_session";

export async function middleware(request: NextRequest) {
  try {
    const path = request.nextUrl.pathname;
    if (path === "/ceo-command-center") {
      const token = request.cookies.get(COOKIE_NAME)?.value;
      if (!token) return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.next();
  }
}

export const config = {
  matcher: ["/ceo-command-center"],
};
