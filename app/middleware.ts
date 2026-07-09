import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const pathname = request.nextUrl.pathname

  const publicPaths = ['/', '/login', '/register', '/forgot-password', '/reset-password', '/admin/login']
  const isPublicPath = publicPaths.includes(pathname)
  const isProductPath = pathname.startsWith('/products/')

  if (user && (pathname === '/login' || pathname === '/register')) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url))
    if (profile?.role === 'manufacturer') return NextResponse.redirect(new URL('/manufacturer/dashboard', request.url))
    if (profile?.role === 'buyer') return NextResponse.redirect(new URL('/buyer/dashboard', request.url))
  }

  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    if (!user) return NextResponse.redirect(new URL('/admin/login', request.url))
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'admin') return NextResponse.redirect(new URL('/', request.url))
  }

  if (pathname.startsWith('/manufacturer') && !isPublicPath) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
  }

  if (pathname.startsWith('/buyer') && !isPublicPath) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}