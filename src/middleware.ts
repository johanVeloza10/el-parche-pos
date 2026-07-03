import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

const publicRoutes = ["/login"]

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isPublicRoute = publicRoutes.includes(req.nextUrl.pathname)

  if (isPublicRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/pos", req.url))
    }
    return null
  }

  if (!isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  const user = req.auth?.user
  const path = req.nextUrl.pathname

  // Protección de rutas por rol
  if (user?.rol === "VENDEDORA") {
    const restrictedPaths = ["/cuentas", "/indicadores", "/liquidaciones", "/configuracion", "/produccion"]
    if (restrictedPaths.some(p => path.startsWith(p))) {
      return NextResponse.redirect(new URL("/pos", req.url))
    }
  }

  if (user?.rol === "CONTADOR") {
    const restrictedPaths = ["/pos", "/recepcion", "/configuracion"]
    if (restrictedPaths.some(p => path.startsWith(p))) {
      return NextResponse.redirect(new URL("/cuentas", req.url))
    }
  }

  // Redirigir la raíz
  if (path === "/" || path === "/dashboard") {
    if (user?.rol === "CONTADOR") return NextResponse.redirect(new URL("/cuentas", req.url))
    return NextResponse.redirect(new URL("/pos", req.url))
  }

  return null
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|brand).*)'],
}
