import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // --- HỖ TRỢ TEST LOCAL: Gán thẻ qua URL ---
  const urlToken = request.nextUrl.searchParams.get('setToken');
  if (urlToken) {
    // Xóa chữ setToken ra khỏi URL cho đẹp và nạp thẻ vào Cookie
    const response = NextResponse.redirect(new URL(request.nextUrl.pathname, request.url));
    response.cookies.set('accessToken', urlToken, { path: '/' });
    return response;
  }

  // Lấy token từ cookie
  const token = request.cookies.get('accessToken')?.value;

  // Nếu không có token và không phải đang ở trang public (như /login)
  if (!token && !request.nextUrl.pathname.startsWith('/login')) {
    // Chuyển hướng người dùng về trang HRM login
    const authUrl = process.env.NEXT_PUBLIC_FRONTEND_ROOT_URL || 'https://hrm.dkpharma.io.vn';
    const redirectUrl = encodeURIComponent(request.url);
    
    return NextResponse.redirect(`${authUrl}/login?redirect=${redirectUrl}`);
  }

  return NextResponse.next();
}

// Cấu hình áp dụng middleware cho các route cần bảo vệ
export const config = {
  matcher: [
    /*
     * Khớp với tất cả các request paths trừ:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (trang public)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
};
