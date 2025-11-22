import { NextRequest, NextResponse } from 'next/server';

const publicRoutes = [
    '/signin',
];

const rolePermissions: Record<string, string[]> = {
    '1': [
        '/dashboard',
        '/sales-accounts',
        '/customers',
        '/transactions',
        '/master-data',
        '/profile',
        '/purchasing',
        '/admin-panel',
        '/customer-categories',
    ],
    '2': [
       '/dashboard',
       '/customers',
       '/transactions',
       '/profile'
    ],
    '3': [
        '/purchasing/dashboard',
        '/purchasing/master',
        '/purchasing/deposits',
        '/purchasing/work-orders',
        '/purchasing/orders',
     ],
     '4': [
        '/dashboard',
        '/sales-accounts',
        '/customers',
        '/transactions',
        '/master-data',
        '/profile',
    ],
    '5': [
        '/profile',
        '/purchasing',
    ],
    
};

const homeRoutes: Record<string, string> = {
    '1': '/menus',
    '2': '/dashboard',
    '3': '/purchasing/dashboard',
    '4': '/dashboard',
    '5': '/purchasing/dashboard',
};


export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const tokenCookie = request.cookies.get('cookieKey');
    const token = tokenCookie?.value;

    if (!token) {
        if (!publicRoutes.includes(pathname)) {
            return NextResponse.redirect(new URL('/signin', request.url));
        }
        return NextResponse.next();
    }

   
    const userRole = request.cookies.get('role')?.value || '3';

    const userHomeRoute = homeRoutes[userRole] || '/signin';

    if (pathname === '/signin' || pathname === '/') {
        return NextResponse.redirect(new URL(userHomeRoute, request.url));
    }

    if (pathname.startsWith('/menus')) {
        if (userRole !== '1') {
            return NextResponse.redirect(new URL(userHomeRoute, request.url));
        }
        return NextResponse.next();
    }

    if (!publicRoutes.includes(pathname)) {
        const allowedRoutes = rolePermissions[userRole] || [];
        const isAuthorized = allowedRoutes.some(route => pathname.startsWith(route));
        
        if (isAuthorized) {
            return NextResponse.next();
        } else {
            return NextResponse.redirect(new URL(userHomeRoute, request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)'],
};