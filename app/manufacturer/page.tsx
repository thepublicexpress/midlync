'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'

export default function ManufacturerInquiriesPage() {
  const [inquiries, setInquiries] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadInquiries()
  }, [])

  async function loadInquiries() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(profileData)
    
    const { data } = await supabase
      .from('product_inquiries')
      .select('*, products(title), buyer:profiles!buyer_id(company_name, email, country, contact_person, contact_phone)')
      .eq('manufacturer_id', user.id)
      .order('created_at', { ascending: false })
    
    setInquiries(data || [])
    setLoading(false)
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div><h1 className="text-2xl font-bold">Product Inquiries</h1><p className="text-slate-500 text-sm">View and respond to buyer inquiries</p></div>
          <button onClick={() => router.push('/manufacturer/dashboard')} className="text-slate-600 hover:text-slate-800">← Back</button>
        </div>

        {inquiries.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border"><div className="text-6xl mb-4">📩</div><p className="text-slate-500">No inquiries yet</p></div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div><h3 className="font-semibold text-lg">{inquiry.products?.title}</h3><Link href={`/manufacturer/buyer/${inquiry.buyer_id}`} className="text-cyan-600 text-sm hover:underline">🏢 {inquiry.buyer?.company_name || inquiry.buyer?.email}</Link></div>
                    <span className={`px-2 py-1 rounded-full text-xs ${inquiry.status === 'replied' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{inquiry.status === 'replied' ? 'Replied' : 'Pending'}</span>
                  </div>
                  <div className="grid md:grid-cols-4 gap-3 text-sm mb-3 p-3 bg-gray-50 rounded-lg">
                    <div><span className="text-gray-500">Email:</span> {inquiry.buyer?.email}</div>
                    <div><span className="text-gray-500">Country:</span> {inquiry.buyer?.country || 'N/A'}</div>
                    <div><span className="text-gray-500">Contact:</span> {inquiry.buyer?.contact_person || 'N/A'}</div>
                    <div><span className="text-gray-500">Phone:</span> {inquiry.buyer?.contact_phone || 'N/A'}</div>
                  </div>
                  <div className="mb-3"><p className="text-gray-700 bg-blue-50 p-3 rounded-lg">{inquiry.message}</p></div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs text-gray-400">Received: {new Date(inquiry.created_at).toLocaleString()}</p>
                    <div className="flex gap-2">
                      <button onClick={() => window.location.href = `mailto:${inquiry.buyer?.email}?subject=Inquiry about ${inquiry.products?.title}`} className="bg-cyan-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-cyan-700">📧 Reply</button>
                      <Link href={`/manufacturer/buyer/${inquiry.buyer_id}`} className="bg-gray-600 text-white px-4 py-1.5 rounded-lg text-sm hover:bg-gray-700">View Profile</Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}