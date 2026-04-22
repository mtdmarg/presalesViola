import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl, auth: session } = req
  const isLoggedIn = !!session?.user

  // Rutas públicas: login
  if (nextUrl.pathname.startsWith("/login")) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", nextUrl))
    }
    return NextResponse.next()
  }

  // Rutas protegidas: requieren login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl))
  }

  const isAdmin = session?.user?.role === "admin"

  // Rutas solo admin
  const adminRoutes = [
    "/usuarios",
    "/campanas/nueva",
  ]
  const isAdminRoute =
    adminRoutes.some((r) => nextUrl.pathname.startsWith(r)) ||
    /^\/campanas\/\d+\/editar/.test(nextUrl.pathname)

  if (isAdminRoute && !isAdmin) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!api/auth|_next/static|_next/image|favicon.ico).*)",
  ],
}
