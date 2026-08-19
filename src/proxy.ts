import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth";

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const token = request.cookies.get(
    SESSION_COOKIE_NAME
  )?.value;

  const authenticated = token
    ? await verifySessionToken(token)
    : false;

  const isLoginPage =
    pathname === "/login";

  if (!authenticated && !isLoginPage) {
    const loginUrl =
      request.nextUrl.clone();

    loginUrl.pathname =
      "/login";

    return NextResponse.redirect(
      loginUrl
    );
  }

  if (authenticated && isLoginPage) {
    const homeUrl =
      request.nextUrl.clone();

    homeUrl.pathname = "/";

    return NextResponse.redirect(
      homeUrl
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
};