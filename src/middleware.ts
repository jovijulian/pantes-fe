import { NextRequest, NextResponse } from 'next/server';

const publicRoutes = [
    '/signin',
];

const homeRoutes: Record<string, string> = {
    '1': '/',       
    '2': '/',  
};

const rolePermissions: Record<string, string[]> = {
    '1': [
        '/',
        '/sales-accounts',
        '/customers',
        '/transactions',
        '/master-data',
        '/profile'
    ],
    '2': [
       '/',
       '/customers',
       '/transactions',
       '/profile'
    ],
};


export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const token = request.cookies.get('cookieKey')?.value;
    const role = request.cookies.get('role')?.value || '';

    if (!token) {
        if (!publicRoutes.includes(pathname)) {
            return NextResponse.redirect(new URL('/signin', request.url));
        }
        return NextResponse.next();
    }

    const userHomeRoute = homeRoutes[role] || '/';

    if (publicRoutes.includes(pathname)) {
        return NextResponse.redirect(new URL(userHomeRoute, request.url));
    }

    const allowedRoutes = rolePermissions[role] || [];
    const isAuthorized = allowedRoutes.includes(pathname);

    if (isAuthorized) {
        return NextResponse.next();
    } else {
        return NextResponse.redirect(new URL(userHomeRoute, request.url));
    }
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)'],
};