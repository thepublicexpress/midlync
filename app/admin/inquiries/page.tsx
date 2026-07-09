'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client' // ✅ Correct import
import { useRouter } from 'next/navigation'

export default function AdminInquiries() {
  const [inquiries, setInquiries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  async function checkAdminAndLoad() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin/login'); return }
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profile?.role !== 'admin') { router.push('/'); return }
      
      await fetchInquiries()
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchInquiries() {
    setLoading(true)
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
    if (error) console.error('Error fetching inquiries:', error)
    setLoading(false)
  }

  async function handleInquiryAction(inquiryId: string, action: 'approve_connection' | 'reject_connection') {
    try {
      const res = await fetch(`/api/inquiries/${inquiryId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        alert(`✅ Inquiry ${action === 'approve_connection' ? 'approved' : 'rejected'}!`)
        fetchInquiries()
      } else {
        const err = await res.json()
        alert('❌ Error: ' + err.error)
      }
    } catch (error) {
      console.error(error)
      alert('Error updating inquiry')
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
              <th className="p-3 border text-left">Buyer Code</th>
              <th className="p-3 border text-left">Manufacturer Code</th>
              <th className="p-3 border text-left">Message</th>
              <th className="p-3 border text-center">Status</th>
              <th className="p-3 border text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inquiries.length === 0 ? (
              <tr><td colSpan={6} className="p-4 text-center text-slate-500">No inquiries found</td></tr>
            ) : (
              inquiries.map((inq) => (
                <tr key={inq.id} className="border-t hover:bg-gray-50">
                  <td className="p-3">{inq.product?.title || 'N/A'}</td>
                  <td className="p-3 font-mono text-sm font-bold text-blue-600">{inq.buyer?.buyer_code || 'BYR-CODE'}</td>
                  <td className="p-3 font-mono text-sm font-bold text-purple-600">{inq.manufacturer?.manufacturer_code || 'MFR-CODE'}</td>
                  <td className="p-3 max-w-xs truncate">{inq.message}</td>
                  <td className="p-3 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      inq.status === 'pending_admin' ? 'bg-yellow-100 text-yellow-800' :
                      inq.status === 'connected' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {inq.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {inq.status === 'pending_admin' && (
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleInquiryAction(inq.id, 'approve_connection')}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleInquiryAction(inq.id, 'reject_connection')}
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}