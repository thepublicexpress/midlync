'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function SampleRequestPage() {
  const [products, setProducts] = useState([])
  const [samples, setSamples] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [form, setForm] = useState({ quantity: 1, specifications: '' })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(profileData)
    
    // Get connected products
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
      setProducts(productsData || [])
    }
    
    const { data: samplesData } = await supabase
      .from('sample_requests')
      .select('*, products(title), manufacturer:profiles!manufacturer_id(company_name)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
    setSamples(samplesData || [])
    
    setLoading(false)
  }

  async function requestSample(e) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('sample_requests').insert({
      buyer_id: user.id,
      manufacturer_id: selectedProduct.manufacturer_id,
      product_id: selectedProduct.id,
      quantity: form.quantity,
      specifications: form.specifications,
      status: 'pending'
    })
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Sample request sent! Agency will review and approve.')
      setShowModal(false)
      setForm({ quantity: 1, specifications: '' })
      loadData()
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="buyer" companyName={profile?.company_name || 'Buyer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Sample Requests</h1>
            <p className="text-slate-500 text-sm">Request product samples from manufacturers</p>
          </div>
          <button onClick={() => router.push('/buyer/dashboard')} className="text-slate-600 hover:text-slate-800">← Back</button>
        </div>

        {/* Request Sample Button */}
        <div className="bg-white rounded-xl p-5 mb-6 shadow-sm">
          <h2 className="font-semibold mb-3">Request New Sample</h2>
          <button onClick={() => setShowModal(true)} className="bg-cyan-600 text-white px-6 py-2 rounded-lg">
            + Request Sample
          </button>
        </div>

        {/* Sample Requests List */}
        <h2 className="text-lg font-semibold mb-4">My Sample Requests</h2>
        {samples.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border">
            <div className="text-6xl mb-4">🧪</div>
            <p className="text-slate-500 mb-4">No sample requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {samples.map(sample => (
              <div key={sample.id} className="bg-white rounded-xl border p-4 shadow-sm">
                <div className="flex justify-between items-center flex-wrap gap-3">
                  <div>
                    <p className="font-medium">{sample.products?.title}</p>
                    <p className="text-sm text-slate-500">Manufacturer: {sample.manufacturer?.company_name}</p>
                    <p className="text-sm text-slate-500">Quantity: {sample.quantity} piece(s)</p>
                  </div>
                  <div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      sample.status === 'approved' ? 'bg-green-100 text-green-700' :
                      sample.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      {sample.status === 'approved' ? '✅ Approved' : sample.status === 'rejected' ? '❌ Rejected' : '⏳ Pending'}
                    </span>
                    {sample.dispatch_date && (
                      <p className="text-xs text-slate-400 mt-1">Dispatched: {new Date(sample.dispatch_date).toLocaleDateString()}</p>
                    )}
                    {sample.tracking_number && (
                      <p className="text-xs text-slate-400">Tracking: {sample.tracking_number}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Request Sample Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Request Product Sample</h2>
            <select
              className="w-full border rounded-lg px-4 py-2 mb-4"
              value={selectedProduct?.id || ''}
              onChange={e => setSelectedProduct(products.find(p => p.id === e.target.value))}
            >
              <option value="">Select Product</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.title} - ${p.price_per_unit}</option>)}
            </select>
            <form onSubmit={requestSample} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Quantity</label>
                <input type="number" min="1" value={form.quantity} onChange={e => setForm({...form, quantity: parseInt(e.target.value)})}
                  className="w-full border rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Specifications / Requirements</label>
                <textarea rows={3} value={form.specifications} onChange={e => setForm({...form, specifications: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2" placeholder="Color, size, material preferences..." />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-cyan-600 text-white py-2 rounded-lg">Submit Request</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}