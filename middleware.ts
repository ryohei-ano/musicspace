import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  // 必要なら auth チェックを入れる
  return NextResponse.next();
}
