import { NextResponse, type NextRequest } from "next/server";

import { isAdsenseReviewNoindexPath } from "@/lib/adsense-readiness";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const origin = request.nextUrl.origin;

  // Aryam jewelry microsite — static files in public/aryam/.
  if (pathname === "/aryam" || pathname.startsWith("/aryam/")) {
    if (pathname === "/aryam") {
      return NextResponse.redirect(new URL("/aryam/", origin), 308);
    }

    const lastSegment = pathname.split("/").pop() ?? "";
    const looksLikeFile = lastSegment.includes(".");

    if (!looksLikeFile && !pathname.endsWith("/")) {
      return NextResponse.redirect(new URL(`${pathname}/`, origin), 308);
    }

    if (pathname.endsWith("/")) {
      return NextResponse.rewrite(new URL(`${pathname}index.html`, origin));
    }

    return NextResponse.next();
  }

  // Restore historical no-trailing-slash URLs for the rest of the site.
  if (pathname.length > 1 && pathname.endsWith("/")) {
    const lastSegment = pathname.slice(0, -1).split("/").pop() ?? "";
    if (!lastSegment.includes(".")) {
      return NextResponse.redirect(new URL(pathname.slice(0, -1), origin), 308);
    }
  }

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
