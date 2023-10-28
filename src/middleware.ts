import {NextResponse} from 'next/server';
import type {NextRequest} from 'next/server';
import pixelconIds from '../archive/pixelconIds.json' assert {type: 'json'};

export function middleware(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const pathname = request.nextUrl.pathname;

  // rewrite to the pixelcon id if the path has an encoded index
  if (pathname.length > 1 && pathname.indexOf('/', 1) === -1) {
    const idx = decodeIdx(pathname.substring(1));
    if (idx !== null) {
      if (idx < pixelconIds.length) {
        //redirect to the known pixelcon
        return NextResponse.redirect(`${origin}/details/${pixelconIds[idx]}`);
      } else {
        //redirect to the general details page
        return NextResponse.redirect(`${origin}/details/index_${idx}`);
      }
    }
  }

  // rewrite to the archive metadata json file if recognized path
  if (pathname.toLowerCase().startsWith('/meta/data')) {
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
  if (pathname.toLowerCase().startsWith('/meta/image')) {
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
  matcher: ['/:path*', '/meta/data/:path*', '/meta/image/:path*'],
};

//Helper function to decode decimals, hex, or base64
function decodeIdx(idx: string): number {
  const decimals = decodeDecimals(idx);
  if (decimals !== null) return decimals;
  const hex = decodeHex(idx);
  if (hex !== null) return hex;
  const base64 = decodeBase64(idx);
  if (base64 !== null) return base64;
  return null;
}

//Helper function to decode decimals
function decodeDecimals(idx: string): number {
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  for (let i = 0; i < idx.length; i++) {
    if (digits.indexOf(idx.charAt(i)) === -1) return null;
  }
  return parseInt(idx);
}

//Helper function to decode hex
function decodeHex(idx: string): number {
  const digits = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'];
  if (idx.charAt(0) !== 'x') return null;
  for (let i = 1; i < idx.length; i++) {
    if (digits.indexOf(idx.charAt(i)) === -1) return null;
  }
  return parseInt(idx.substring(1), 16);
}

//Helper function to decode modified base64
function decodeBase64(idx: string): number {
  const digits = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz+-'.split('');
  if (idx.charAt(0) !== '_') return null;
  let result = 0;
  for (let i = 1; i < idx.length; i++) {
    const val = digits.indexOf(idx.charAt(i));
    if (val === -1) return null;
    result = (result << 6) + val;
  }
  return result;
}
