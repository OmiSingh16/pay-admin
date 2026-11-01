import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const cookieName = process.env.NODE_ENV === "production" ? "__Host-session" : "session";
const sessionCookie = request.cookies.get(cookieName)?.value;
  const { pathname } = request.nextUrl;

  // Static files aur API ko chhod do
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Login page pe ho
  if (pathname === "/login") {
    // Agar cookie hai, toh dashboard bhejo
    if (sessionCookie) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    // Agar cookie nahi hai, toh login page dikhao
    return NextResponse.next();
  }

  // Baaki protected pages ke liye
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};