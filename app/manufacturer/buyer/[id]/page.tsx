'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function BuyerDetailPage() {
  const [buyer, setBuyer] = useState(null)
  const [inquiries, setInquiries] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadBuyerDetails()
  }, [])

  async function loadBuyerDetails() {
    if (!params?.id) return

    const { data: buyerData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', params.id)
      .single()
    setBuyer(buyerData)

    const { data: inquiriesData } = await supabase
      .from('product_inquiries')
      .select('*, products(title)')
      .eq('buyer_id', params.id)
      .order('created_at', { ascending: false })
    setInquiries(inquiriesData || [])

    const { data: ordersData } = await supabase
      .from('orders')
      .select('*, products(title)')
      .eq('buyer_id', params.id)
      .order('created_at', { ascending: false })
    setOrders(ordersData || [])

    setLoading(false)
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName="Manufacturer" />

      <div className="max-w-5xl mx-auto px-6 py-8">
        <button onClick={() => router.back()} className="mb-4 text-cyan-600 hover:underline">← Back</button>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center text-2xl">🏢</div>
            <div><h1 className="text-2xl font-bold">{buyer?.company_name || 'Buyer'}</h1><p className="text-gray-500">{buyer?.email}</p></div>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-500">Country</label><p>{buyer?.country || 'N/A'}</p></div>
            <div><label className="text-sm text-gray-500">Contact Person</label><p>{buyer?.contact_person || 'N/A'}</p></div>
            <div><label className="text-sm text-gray-500">Phone</label><p>{buyer?.contact_phone || buyer?.mobile_number || 'N/A'}</p></div>
            <div><label className="text-sm text-gray-500">Member Since</label><p>{new Date(buyer?.created_at).toLocaleDateString()}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">📩 Inquiries ({inquiries.length})</h2>
          {inquiries.length === 0 ? <p className="text-gray-500">No inquiries yet</p> : (
            <div className="space-y-3">
              {inquiries.map((inq) => (
                <div key={inq.id} className="border-b pb-3">
                  <div className="flex justify-between"><p className="font-medium">{inq.products?.title}</p><span className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-full">{inq.status || 'pending'}</span></div>
                  <p className="text-sm text-gray-600 mt-1">{inq.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(inq.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">📦 Orders ({orders.length})</h2>
          {orders.length === 0 ? <p className="text-gray-500">No orders yet</p> : (
            <div className="space-y-3">
              {orders.map((order) => (
                <div key={order.id} className="border-b pb-3">
                  <div className="flex justify-between"><p className="font-medium">{order.products?.title}</p><span className="text-xs text-cyan-600">Qty: {order.quantity}</span></div>
                  <p className="text-sm text-gray-600">Total: ₹{order.total_amount}</p>
                  <p className="text-xs text-gray-400">{new Date(order.created_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}