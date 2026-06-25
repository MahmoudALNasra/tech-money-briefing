import { NextResponse, type NextRequest } from "next/server";

import { isAdsenseReviewNoindexPath } from "@/lib/adsense-readiness";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname === "/business-lead-generator" ||
    pathname === "/business-data-generator"
  ) {
    return NextResponse.redirect(new URL("/leads", request.url), 301);
  }

  if (pathname === "/contact" && request.nextUrl.search) {
    return NextResponse.redirect(new URL("/contact", request.url), 308);
  }

  if (pathname === "/euphoria-character-arcs") {
    return new NextResponse("Gone", {
      status: 410,
      headers: {
        "X-Robots-Tag": "noindex, nofollow, noarchive"
      }
    });
  }

  if (pathname === "/aseel") {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
    return response;
  }

  if (isAdsenseReviewNoindexPath(pathname)) {
    const response = NextResponse.next();
    response.headers.set("X-Robots-Tag", "noindex, follow");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|og-default-v3.png|logo.svg|ads.txt|llms.txt|sitemap.xml|robots.txt).*)"
  ]
};
