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
        '/follow-ups',
        '/master-data',
        '/profile',
        '/purchasing',
        '/admin-panel',
        '/customer-categories',
        '/forms',
    ],
    '2': [
        '/dashboard',
        '/customers',
        '/transactions',
        '/follow-ups',
        '/profile'
    ],
    '3': [
        '/purchasing/dashboard',
        // '/purchasing/master',
        '/purchasing/deposits',
        '/purchasing/work-orders',
        '/purchasing/orders',
        '/purchasing/scrap-golds',
        '/purchasing/reports',
        '/purchasing/stock-global',
        '/purchasing/stock-global-lm',
        '/purchasing/report-directors',
        '/purchasing/invoices',
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
        '/purchasing/dashboard',
        '/purchasing/master',
        '/purchasing/deposits',
        '/purchasing/work-orders',
        '/purchasing/orders',
        '/purchasing/scrap-golds',
        '/purchasing/reports',
        '/purchasing/report-directors',
        '/purchasing/stock-global',
        '/purchasing/stock-global-lm',
        '/purchasing/invoices',
    ],
    '6': [
        '/dashboard',
        '/area-manager',
        '/profile',
        '/transactions'
    ],
    '7': [
        '/dashboard',
        '/general-manager',
        '/profile',
        '/transactions'
    ],
    '8': [
        '/dashboard',
        '/sales-accounts',
        '/customers',
        '/transactions',
        '/profile',
        '/admin-panel',
    ],
    
};

const homeRoutes: Record<string, string> = {
    '1': '/menus',
    '2': '/dashboard',
    '3': '/purchasing/dashboard',
    '4': '/dashboard',
    '5': '/purchasing/dashboard',
    '6': '/dashboard',
    '7': '/dashboard',
    '8': '/menus',
};

const roleExceptions: Record<string, string[]> = {
    '3': [
        '/purchasing/orders/create',
        '/purchasing/orders-lm/create',
        '/purchasing/work-orders/create',
        '/purchasing/work-orders-lm/create',
        '/purchasing/deposits/create',
        '/purchasing/scrap-golds/create',
        '/purchasing/scrap-golds/sends/create',
        '/purchasing/invoices/create',
    ]
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
        if (userRole !== '1' && userRole !== '8') {
            return NextResponse.redirect(new URL(userHomeRoute, request.url));
        }
        return NextResponse.next();
    }

    if (!publicRoutes.includes(pathname)) {
        const blockedRoutes = roleExceptions[userRole] || [];
        const isBlocked = blockedRoutes.some(route => pathname === route || pathname.startsWith(`${route}/`));

        if (isBlocked) {
            return NextResponse.redirect(new URL(userHomeRoute, request.url));
        }

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