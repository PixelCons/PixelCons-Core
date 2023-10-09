import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import pixelconIds from '../archive/pixelconIds.json' assert {type: 'json'};

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname.toLowerCase();

  // rewrite to the archive metadata json file if recognized path
  if (pathname.startsWith('/meta/data')) {
    for (const pixelconId of pixelconIds) {
      const simpleId = pixelconId.substring(2);
      if (pathname.indexOf(simpleId) > -1) {
        const url = request.nextUrl.clone();
        url.pathname = `/archive/meta/${pixelconId}.json`;
        return NextResponse.rewrite(url);
      }
    }
  }

  // rewrite to the archive image file if recognized path
  if (request.nextUrl.pathname.startsWith('/meta/image')) {
    for (const pixelconId of pixelconIds) {
      const simpleId = pixelconId.substring(2);
      if (pathname.indexOf(simpleId) > -1) {
        const url = request.nextUrl.clone();
        url.pathname = `/archive/image/${pixelconId}.png`;
        return NextResponse.rewrite(url);
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/meta/data/:path*', '/meta/image/:path*'],
};
