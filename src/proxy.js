import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((request) => {
  const session = request.auth;
  const pathname = request.nextUrl.pathname;

  const isAuthenticated = Boolean(session?.user?.id && session?.user?.accountStatus === "active");

  const isAdmin = session?.user?.role === "Administrator";
  const isTeacher = session?.user?.role === "Guru";

  if (!isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname.startsWith("/admin") && !isAdmin) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (pathname.startsWith("/guru") && !isTeacher) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/guru/:path*"],
};
