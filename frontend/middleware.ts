import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Let all requests through
  // Auth is handled client-side via localStorage Bearer tokens
  // This avoids cross-domain cookie issues on Render
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
