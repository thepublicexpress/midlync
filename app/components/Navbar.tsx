'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useState, useEffect, useRef } from 'react'
import NotificationBell from './NotificationBell'

interface NavbarProps {
  role: 'manufacturer' | 'buyer' | 'agency' | 'admin'
  companyName: string
  cartCount?: number
}

export default function Navbar({ role, companyName, cartCount = 0 }: NavbarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()
  const [localCartCount, setLocalCartCount] = useState(cartCount)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateCartCount = () => {
      const cart = JSON.parse(localStorage.getItem('midlync_cart') || '[]')
      setLocalCartCount(cart.length)
    }
    updateCartCount()
    window.addEventListener('storage', updateCartCount)
    return () => window.removeEventListener('storage', updateCartCount)
  }, [])



  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Navigation links based on role
  const getNavLinks = () => {
    if (role === 'manufacturer') {
      return {
        main: [
          { name: 'Dashboard', href: '/manufacturer/dashboard', icon: '📊' },
          { name: 'Products', href: '/manufacturer/products', icon: '📦' },
        ],
        dropdowns: [
          {
            name: 'Sales',
            icon: '💰',
            items: [
              { name: 'Orders', href: '/manufacturer/orders', icon: '📋' },
              { name: 'Invoices', href: '/manufacturer/invoices', icon: '🧾' },
              { name: 'Quotations', href: '/manufacturer/quotations', icon: '📝' },
            ]
          },
          {
            name: 'Catalogue',
            icon: '📚',
            items: [
              { name: 'Catalogue', href: '/manufacturer/catalogue', icon: '📄' },
              { name: 'QR Labels', href: '/manufacturer/qr-labels', icon: '🏷️' },
              { name: 'Trade Fair', href: '/manufacturer/trade-fair-report', icon: '🎪' },
            ]
          },
          {
            name: 'Tools',
            icon: '🛠️',
            items: [
              { name: 'AI Text', href: '/manufacturer/ai-catalogue', icon: '🤖' },
              { name: 'Product Match', href: '/manufacturer/products?match=true', icon: '🔍' },
              { name: 'Assets', href: '/manufacturer/assets', icon: '🖼️' },
              { name: 'Connections', href: '/manufacturer/connections', icon: '🤝' },
              { name: 'Inventory', href: '/manufacturer/inventory', icon: '📦' },
              { name: 'Inspections', href: '/manufacturer/inspections', icon: '🔍' },
              { name: 'Analytics', href: '/manufacturer/analytics', icon: '📊' },
            ]
          },
          {
            name: 'Settings',
            icon: '⚙️',
            items: [
              { name: 'Profile', href: '/manufacturer/profile', icon: '👤' },
            ]
          }
        ]
      }
    }
    
    if (role === 'buyer') {
      return {
        main: [
          { name: 'Dashboard', href: '/buyer/dashboard', icon: '📊' },
          { name: 'Marketplace', href: '/buyer/browse', icon: '🛍️' },
          { name: 'Orders', href: '/buyer/orders', icon: '📦' },
          { name: 'Sample Request', href: '/buyer/sample-request', icon: '🧪' },
          { name: 'Wishlist', href: '/buyer/wishlist', icon: '❤️' },
        ],
        dropdowns: [
          {
            name: 'Settings',
            icon: '⚙️',
            items: [
              { name: 'Profile', href: '/buyer/profile', icon: '👤' },
            ]
          }
        ]
      }
    }
    
    if (role === 'agency') {
      return {
        main: [
          { name: 'Dashboard', href: '/agency/dashboard', icon: '📊' },
          { name: 'Vendors', href: '/agency/manufacturers', icon: '🏭' },
          { name: 'Buyers', href: '/agency/buyers', icon: '🛒' },
        ],
        dropdowns: [
          {
            name: 'Settings',
            icon: '⚙️',
            items: [
              { name: 'Profile', href: '/agency/profile', icon: '👤' },
            ]
          }
        ]
      }
    }
    
    if (role === 'admin') {
      return {
        main: [
          { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
          { name: 'Users', href: '/admin/users', icon: '👥' },
          { name: 'Settings', href: '/admin/settings', icon: '⚙️' },
        ],
        dropdowns: []
      }
    }
    
    return { main: [], dropdowns: [] }
  }

  const { main, dropdowns } = getNavLinks()
  const showBackButton = !pathname.includes('/dashboard') && pathname !== `/${role}/dashboard`

  const toggleDropdown = (name: string) => {
    setOpenDropdown(openDropdown === name ? null : name)
  }

  return (
    <nav className="bg-slate-900 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            {showBackButton && (
              <button onClick={() => router.back()} className="text-white hover:text-cyan-400 transition">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            <Link href="/" className="text-2xl font-bold hover:opacity-80 transition">
              <span className="text-white">Mid</span>
              <span className="text-cyan-400">lync</span>
            </Link>
            <span className={`text-white text-xs font-bold px-2 py-1 rounded-full uppercase ${
              role === 'manufacturer' ? 'bg-cyan-600' :
              role === 'buyer' ? 'bg-green-600' :
              role === 'agency' ? 'bg-purple-600' : 'bg-red-600'
            }`}>
              {role}
            </span>
          </div>
          
          {/* Navigation Links with Dropdowns */}
          <div className="hidden md:flex items-center gap-2 lg:gap-4" ref={dropdownRef}>
            {main.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition ${
                  pathname === link.href ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.name}</span>
              </Link>
            ))}
            
            {dropdowns.map((dropdown) => (
              <div key={dropdown.name} className="relative">
                <button
                  onClick={() => toggleDropdown(dropdown.name)}
                  className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition ${
                    openDropdown === dropdown.name ? 'bg-cyan-600 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  <span>{dropdown.icon}</span>
                  <span>{dropdown.name}</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {openDropdown === dropdown.name && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border z-50 overflow-hidden">
                    {dropdown.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setOpenDropdown(null)}
                        className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition"
                      >
                        <span className="text-xl">{item.icon}</span>
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-4">
            
            {role === 'buyer' && (
              <Link href="/buyer/cart" className="relative">
                <span className="text-xl text-white">🛒</span>
                {localCartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {localCartCount > 9 ? '9+' : localCartCount}
                  </span>
                )}
              </Link>
            )}
            
            <NotificationBell />
            
            <span className="text-slate-400 text-sm hidden md:block max-w-[150px] truncate">{companyName}</span>
            
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}