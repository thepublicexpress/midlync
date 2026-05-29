'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'

export default function BuyerDashboard() {
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profileData)
      
      const { data: grants } = await supabase
        .from('connection_grants')
        .select('manufacturer_id')
        .eq('buyer_id', user.id)
        .eq('status', 'active')
      
      if (grants && grants.length > 0) {
        const manufacturerIds = grants.map(g => g.manufacturer_id)
        const { data: productsData } = await supabase
          .from('products')
          .select('*, manufacturer:profiles!manufacturer_id(company_name)')
          .in('manufacturer_id', manufacturerIds)
          .eq('status', 'active')
        setProducts(productsData || [])
      }
      
      const { data: ordersData } = await supabase
        .from('orders')
        .select('*, products(title, price_per_unit, image_url)')
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5)
      setOrders(ordersData || [])
      
      setLoading(false)
    }
    load()
  }, [])

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))]

  const stageNames = ['', 'Order Placed', 'Approved', 'Production', 'Shipped', 'Delivered']
  const stageColors = ['', 'bg-blue-100 text-blue-700', 'bg-green-100 text-green-700', 'bg-purple-100 text-purple-700', 'bg-orange-100 text-orange-700', 'bg-emerald-100 text-emerald-700']

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="buyer" companyName={profile?.company_name || 'Buyer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Welcome back, {profile?.company_name || 'Buyer'}!</h1>
          <p className="text-slate-500">Discover products, place orders, and track shipments.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border"><div className="text-2xl mb-2">🛒</div><div className="text-2xl font-bold">{products.length}</div><div className="text-xs text-slate-500">Available Products</div></div>
          <div className="bg-white rounded-xl p-5 border"><div className="text-2xl mb-2">📦</div><div className="text-2xl font-bold">{orders.length}</div><div className="text-xs text-slate-500">Total Orders</div></div>
          <div className="bg-white rounded-xl p-5 border"><div className="text-2xl mb-2">⏳</div><div className="text-2xl font-bold">{orders.filter(o => o.stage < 5).length}</div><div className="text-xs text-slate-500">In Progress</div></div>
          <div className="bg-white rounded-xl p-5 border"><div className="text-2xl mb-2">✅</div><div className="text-2xl font-bold">{orders.filter(o => o.stage === 5).length}</div><div className="text-xs text-slate-500">Delivered</div></div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link href="/buyer/browse" className="bg-cyan-600 hover:bg-cyan-700 text-white p-4 rounded-xl text-center transition">
            <div className="text-2xl mb-1">🛍️</div>
            <div className="font-semibold text-sm">Shop</div>
          </Link>
          <Link href="/buyer/orders" className="bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl text-center transition">
            <div className="text-2xl mb-1">📦</div>
            <div className="font-semibold text-sm">My Orders</div>
          </Link>
          <Link href="/buyer/wishlist" className="bg-pink-600 hover:bg-pink-700 text-white p-4 rounded-xl text-center transition">
            <div className="text-2xl mb-1">❤️</div>
            <div className="font-semibold text-sm">Wishlist</div>
          </Link>
          <Link href="/buyer/profile" className="bg-slate-600 hover:bg-slate-700 text-white p-4 rounded-xl text-center transition">
            <div className="text-2xl mb-1">⚙️</div>
            <div className="font-semibold text-sm">Settings</div>
          </Link>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            <input type="text" placeholder="Search products..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500" />
            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="border rounded-lg px-4 py-2">
              {categories.map(c => <option key={c} value={c === 'All' ? '' : c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recommended for You</h2>
            {products.length > 0 && <button onClick={() => router.push('/buyer/browse')} className="text-cyan-600 text-sm">View All ({products.length}) →</button>}
          </div>
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border"><div className="text-6xl mb-4">🔍</div><p className="text-slate-500">No products available yet</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {filteredProducts.slice(0, 4).map((p) => {
                let images = []
                try { images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []) } catch { images = [] }
                const mainImage = images[0] || p.image_url
                return (
                  <div key={p.id} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-lg transition">
                    <div onClick={() => router.push(`/products/${p.id}`)} className="aspect-square bg-slate-50 flex items-center justify-center cursor-pointer">
                      {mainImage ? <img src={mainImage} className="w-full h-full object-contain p-4" /> : <span className="text-5xl">📦</span>}
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-lg truncate">{p.title}</h3>
                      <p className="text-cyan-600 font-bold">${p.price_per_unit || '—'}</p>
                      <p className="text-xs text-slate-500 mt-1">{p.manufacturer?.company_name}</p>
                      <button onClick={() => router.push(`/products/${p.id}`)} className="w-full mt-3 bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded-lg text-sm transition">View Details</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Recent Orders</h2>
            {orders.length > 0 && <button onClick={() => router.push('/buyer/orders')} className="text-cyan-600 text-sm">View All ({orders.length}) →</button>}
          </div>
          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border"><div className="text-4xl mb-2">📦</div><p className="text-slate-500">No orders yet</p></div>
          ) : (
            <div className="space-y-3">
              {orders.slice(0, 3).map((order) => (
                <div key={order.id} className="bg-white rounded-xl border p-4">
                  <div className="flex justify-between items-center">
                    <div><p className="font-mono text-sm">#{order.order_number || order.id.slice(0, 8)}</p><p className="font-medium">{order.products?.title || 'Product Order'}</p><p className="text-sm text-slate-500">Qty: {order.quantity} | ${order.total_amount || order.quantity * (order.unit_price || order.products?.price_per_unit)}</p></div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${stageColors[order.stage] || 'bg-gray-100'}`}>{stageNames[order.stage] || 'Pending'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}