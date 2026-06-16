import { NextResponse, type NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (
    request.nextUrl.pathname === "/business-lead-generator" ||
    request.nextUrl.pathname === "/business-data-generator"
  ) {
    return NextResponse.redirect(new URL("/leads", request.url), 301);
  }

  if (request.nextUrl.pathname === "/contact" && request.nextUrl.search) {
    return NextResponse.redirect(new URL("/contact", request.url), 308);
  }

  if (request.nextUrl.pathname === "/euphoria-character-arcs") {
    return new NextResponse("Gone", {
      status: 410,
      headers: {
        "X-Robots-Tag": "noindex, nofollow, noarchive"
      }
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/business-lead-generator",
    "/business-data-generator",
    "/contact",
    "/euphoria-character-arcs"
  ]
};
