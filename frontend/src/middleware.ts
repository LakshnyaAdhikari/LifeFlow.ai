import { NextResponse, NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('access_token');
    const { pathname } = request.nextUrl;

    // Define public routes
    const isPublicRoute =
        pathname === '/' ||
        pathname.startsWith('/auth/') ||
        pathname.includes('.') || // Allow static files
        pathname.startsWith('/_next/');

    if (!token && !isPublicRoute) {
        // Redirect unauthenticated users to landing page
        const url = request.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    if (token && isPublicRoute && pathname !== '/') {
        // Already logged in, redirect away from auth pages
        // Exception: landing page remains accessible
        if (pathname.startsWith('/auth/')) {
            const url = request.nextUrl.clone();
            url.pathname = '/home';
            return NextResponse.redirect(url);
        }
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
