import { NextRequest, NextResponse } from "next/server";

const publicRoutes = ["/signin"];
const mechanicOnlyRoutes = ["/mechanic-transaction", "/profile"];
const exceptSuperAdminRoutes = ["/mechanic-transaction"];
const superAdminOnlyRoutes = ["/", "/transaction", "/customer", "/feature", "/mechanic", "/feature-field", "/feature-field/create", "/profile"];
const adminOnlyRoutes = ["/", "/transaction", "/customer",  "/profile"];
const exceptAdminRoutes = ["/mechanic-transaction", "/mechanic", "/feature-field", "/feature-field/create", "/feature"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get("cookieKey")?.value || "";
  const role = request.cookies.get("role")?.value || "";

  const isPublic = publicRoutes.includes(path);
  const isMechanicRoute = mechanicOnlyRoutes.some((route) => path.startsWith(route));
  const isAdminRoute = superAdminOnlyRoutes.some((route) => path.startsWith(route));
  const isExceptSuperAdminRoute = exceptSuperAdminRoutes.some((route) => path.startsWith(route));
  const isExceptAdminRoute = exceptAdminRoutes.some((route) => path.startsWith(route));



  if (isPublic) {
    if (token) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!token) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  // ✅ Allow if route sesuai role
  // if (role == "1" && isAdminRoute) return NextResponse.next();
  if (role == "2" && isMechanicRoute) return NextResponse.next();

  // ❌ Block: role akses route yang salah
  if (role == "1") {
    if (isExceptSuperAdminRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }
  if (role == "2") return NextResponse.redirect(new URL("/mechanic-transaction", request.url));
  if (role == "3") {
    if (isExceptAdminRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    return NextResponse.next();
  }

  // Default allow
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
