'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function BuyerOrdersPage() {
  const [orders, setOrders] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  const stages = [
    { id: 1, name: 'Order Placed', icon: '🛒', color: 'bg-blue-100 text-blue-700' },
    { id: 2, name: 'Approved', icon: '✅', color: 'bg-green-100 text-green-700' },
    { id: 3, name: 'Production', icon: '🏭', color: 'bg-purple-100 text-purple-700' },
    { id: 4, name: 'Shipped', icon: '🚢', color: 'bg-orange-100 text-orange-700' },
    { id: 5, name: 'Delivered', icon: '🎯', color: 'bg-emerald-100 text-emerald-700' }
  ]

  useEffect(() => {
    loadOrders()
  }, [])

  async function loadOrders() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(profileData)
    
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*, products(title, price_per_unit, image_url)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
    
    setOrders(ordersData || [])
    setLoading(false)
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="buyer" companyName={profile?.company_name || 'Buyer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Orders</h1>
            <p className="text-slate-500 text-sm">Track your order status</p>
          </div>
          <button onClick={() => router.push('/buyer/dashboard')} className="text-slate-600 hover:text-slate-800">← Back</button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-slate-500 mb-4">No orders yet</p>
            <button onClick={() => router.push('/buyer/browse')} className="bg-cyan-600 text-white px-6 py-3 rounded-xl">
              Browse Products →
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const currentStage = stages.find(s => s.id === order.stage)
              return (
                <div key={order.id} className="bg-white rounded-xl border p-5 shadow-sm">
                  <div className="flex justify-between items-start flex-wrap gap-3">
                    <div>
                      <p className="font-mono text-sm text-slate-500">#{order.order_number || order.id.slice(0, 8)}</p>
                      <p className="font-semibold">{order.products?.title || 'Product'}</p>
                      <p className="text-sm text-slate-500">Qty: {order.quantity} | ${order.total_amount || order.quantity * (order.unit_price || order.products?.price_per_unit)}</p>
                      <p className="text-xs text-slate-400 mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${currentStage?.color || 'bg-gray-100'}`}>
                        {currentStage?.icon} {currentStage?.name || 'Processing'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}