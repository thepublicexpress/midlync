'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'

export default function ManufacturerDashboard() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [inquiries, setInquiries] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        setProfile(profileData)

        const { data: productsData } = await supabase
          .from('products')
          .select('*')
          .eq('manufacturer_id', user.id)

        setProducts(productsData || [])

        const { data: ordersData } = await supabase
          .from('orders')
          .select('*')
          .eq('manufacturer_id', user.id)

        setOrders(ordersData || [])

        const { data: inquiriesData } = await supabase
          .from('product_inquiries')
          .select('*')
          .eq('manufacturer_id', user.id)

        setInquiries(inquiriesData || [])

      } catch (err) {
        console.error('Load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  const pendingOrders = orders.filter(o => o.stage < 5).length

  // 16 Menu Buttons for Manufacturer
  const menuItems = [
    // Row 1 - Main Modules
    { name: 'Dashboard', href: '/manufacturer/dashboard', icon: '📊', color: 'bg-slate-600' },
    { name: 'Products', href: '/manufacturer/products', icon: '📦', color: 'bg-blue-500', count: products.length },
    { name: 'Orders', href: '/manufacturer/orders', icon: '📋', color: 'bg-green-500', count: pendingOrders },
    { name: 'Inquiries', href: '/manufacturer/inquiries', icon: '📩', color: 'bg-purple-500', count: inquiries.length },
    
    // Row 2 - Sales & Catalogue
    { name: 'Catalogue', href: '/manufacturer/catalogue', icon: '📁', color: 'bg-orange-500' },
    { name: 'Invoices', href: '/manufacturer/invoices', icon: '🧾', color: 'bg-amber-500' },
    { name: 'Quotations', href: '/manufacturer/quotations', icon: '📝', color: 'bg-yellow-500' },
    { name: 'Trade Fair', href: '/manufacturer/trade-fair-report', icon: '🎪', color: 'bg-pink-500' },
    
    // Row 3 - Tools & Management
    { name: 'Inventory', href: '/manufacturer/inventory', icon: '📦', color: 'bg-teal-500' },
    { name: 'Inspections', href: '/manufacturer/inspections', icon: '🔍', color: 'bg-indigo-500' },
    { name: 'Analytics', href: '/manufacturer/analytics', icon: '📊', color: 'bg-red-500' },
    { name: 'Connections', href: '/manufacturer/connections', icon: '🤝', color: 'bg-cyan-500' },
    
    // Row 4 - Assets & Settings
    { name: 'Assets', href: '/manufacturer/assets', icon: '🖼️', color: 'bg-emerald-500' },
    { name: 'QR Labels', href: '/manufacturer/qr-labels', icon: '🏷️', color: 'bg-fuchsia-500' },
    { name: 'AI Tools', href: '/manufacturer/ai-catalogue', icon: '🤖', color: 'bg-sky-500' },
    { name: 'Settings', href: '/manufacturer/profile', icon: '⚙️', color: 'bg-gray-500' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {profile?.company_name || 'Manufacturer'}!
          </h1>
          <p className="text-slate-500">Manage your products, track orders, and grow your business.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="text-2xl mb-2">📦</div>
            <div className="text-2xl font-bold">{products.length}</div>
            <div className="text-xs text-slate-500">Total Products</div>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-2xl font-bold">{products.filter(p => p.status === 'active').length}</div>
            <div className="text-xs text-slate-500">Active Products</div>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="text-2xl mb-2">📩</div>
            <div className="text-2xl font-bold">{inquiries.length}</div>
            <div className="text-xs text-slate-500">Total Inquiries</div>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="text-2xl mb-2">📋</div>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <div className="text-xs text-slate-500">Pending Orders</div>
          </div>
        </div>

        {/* 16 Menu Buttons - 4x4 Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="bg-white rounded-xl p-4 text-center border shadow-sm hover:shadow-lg transition-all duration-200 group hover:-translate-y-1"
            >
              <div className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-white text-2xl shadow-md group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <div className="text-sm font-semibold text-slate-700">{item.name}</div>
              {item.count !== undefined && (
                <div className="text-xs text-slate-400 mt-1">{item.count}</div>
              )}
            </Link>
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* Recent Inquiries */}
          {inquiries.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">📩 Recent Inquiries</h3>
                <Link href="/manufacturer/inquiries" className="text-cyan-600 text-xs">View All</Link>
              </div>
              <div className="space-y-2">
                {inquiries.slice(0, 3).map((inq) => (
                  <div key={inq.id} className="text-sm border-b pb-2">
                    <p className="font-medium">{inq.products?.title || 'Product'}</p>
                    <p className="text-xs text-slate-500">{inq.message?.substring(0, 60)}...</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          {orders.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">📋 Recent Orders</h3>
                <Link href="/manufacturer/orders" className="text-cyan-600 text-xs">View All</Link>
              </div>
              <div className="space-y-2">
                {orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="text-sm border-b pb-2">
                    <p className="font-medium">Order #{order.order_number?.slice(0, 8)}</p>
                    <p className="text-xs text-slate-500">Amount: ₹{order.total_amount}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}