'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInquiries()
  }, [])

  async function fetchInquiries() {
    const { data, error } = await supabase
      .from('product_inquiries')
      .select(`
        *,
        product:products(title, sku),
        buyer:profiles!buyer_id(company_name, email, buyer_code),
        manufacturer:profiles!manufacturer_id(company_name, email, manufacturer_code)
      `)
      .order('created_at', { ascending: false })

    if (data) setInquiries(data)
    if (error) console.error(error)
    setLoading(false)
  }

  async function handleApprove(inquiryId: string, status: 'approved' | 'rejected') {
    const res = await fetch(`/api/inquiries/${inquiryId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: status === 'approved' ? 'approve_connection' : 'reject_connection' }),
    })
    if (res.ok) {
      alert(`Inquiry ${status}`)
      fetchInquiries()
    } else {
      alert('Failed to update inquiry')
    }
  }

  if (loading) return <div className="p-6">Loading inquiries...</div>

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">📋 Inquiries (Admin Control)</h1>
      <div className="overflow-x-auto shadow rounded-lg">
        <table className="min-w-full bg-white border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 border text-left">Product</th>
              <th className="p-3 border text-left">Buyer</th>
              <th className="p-3 border text-left">Manufacturer</th>
              <th className="p-3 border text-left">Message</th>
              <th className="p-3 border text-center">Status</th>
              <th className="p-3 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.map((inq) => (
              <tr key={inq.id} className="border-t hover:bg-gray-50">
                <td className="p-3">{inq.product?.title || 'N/A'}</td>
                <td className="p-3">
                  <div className="font-semibold">{inq.buyer?.company_name}</div>
                  <div className="text-xs text-gray-500">Code: {inq.buyer?.buyer_code}</div>
                  <div className="text-xs text-gray-400">{inq.buyer?.email}</div>
                </td>
                <td className="p-3">
                  <div className="font-semibold">{inq.manufacturer?.company_name}</div>
                  <div className="text-xs text-gray-500">Code: {inq.manufacturer?.manufacturer_code}</div>
                  <div className="text-xs text-gray-400">{inq.manufacturer?.email}</div>
                </td>
                <td className="p-3 max-w-xs truncate">{inq.message}</td>
                <td className="p-3 text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    inq.status === 'pending_admin'
                      ? 'bg-yellow-100 text-yellow-800'
                      : inq.status === 'connected'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {inq.status}
                  </span>
                </td>
                <td className="p-3 text-center">
                  {inq.status === 'pending_admin' && (
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => handleApprove(inq.id, 'approved')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleApprove(inq.id, 'rejected')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded text-sm"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                  {inq.status !== 'pending_admin' && (
                    <span className="text-gray-400 text-sm">Resolved</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}