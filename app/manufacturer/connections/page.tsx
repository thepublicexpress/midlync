'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function ConnectionsPage() {
  const [buyers, setBuyers] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('connected')
  const [showShareModal, setShowShareModal] = useState(false)
  const [selectedBuyer, setSelectedBuyer] = useState(null)
  const [products, setProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
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
    
    // Get connected buyers
    const { data: grants } = await supabase
      .from('connection_grants')
      .select('buyer_id, status, created_at')
      .eq('manufacturer_id', user.id)
    
    if (grants && grants.length > 0) {
      const buyerIds = grants.filter(g => g.status === 'active').map(g => g.buyer_id)
      const pendingIds = grants.filter(g => g.status === 'pending').map(g => g.buyer_id)
      
      if (buyerIds.length > 0) {
        const { data: buyerData } = await supabase.from('profiles').select('*').in('id', buyerIds)
        setBuyers(buyerData || [])
      }
      
      if (pendingIds.length > 0) {
        const { data: pendingData } = await supabase.from('profiles').select('*').in('id', pendingIds)
        setPendingRequests(pendingData || [])
      }
    }
    
    // Get products for sharing
    const { data: productsData } = await supabase.from('products').select('*').eq('manufacturer_id', user.id)
    setProducts(productsData || [])
    
    setLoading(false)
  }

  async function approveRequest(buyerId) {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('connection_grants')
      .update({ status: 'active' })
      .eq('manufacturer_id', user.id)
      .eq('buyer_id', buyerId)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Connection approved!')
      loadData()
    }
  }

  async function rejectRequest(buyerId) {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase
      .from('connection_grants')
      .delete()
      .eq('manufacturer_id', user.id)
      .eq('buyer_id', buyerId)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Request rejected')
      loadData()
    }
  }

  async function shareProducts() {
    if (!selectedBuyer || selectedProducts.length === 0) return
    
    // In a real app, you would create product shares
    alert(`Products shared with ${selectedBuyer.company_name}`)
    setShowShareModal(false)
    setSelectedProducts([])
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Connections</h1>
        
        {/* Tabs */}
        <div className="flex gap-4 border-b mb-6">
          <button onClick={() => setActiveTab('connected')} className={`pb-2 px-4 ${activeTab === 'connected' ? 'border-b-2 border-cyan-600 text-cyan-600 font-semibold' : 'text-slate-500'}`}>
            Connected Buyers ({buyers.length})
          </button>
          <button onClick={() => setActiveTab('requests')} className={`pb-2 px-4 ${activeTab === 'requests' ? 'border-b-2 border-cyan-600 text-cyan-600 font-semibold' : 'text-slate-500'}`}>
            Pending Requests ({pendingRequests.length})
          </button>
        </div>

        {/* Connected Buyers */}
        {activeTab === 'connected' && (
          <>
            {buyers.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border">
                <div className="text-6xl mb-4">🤝</div>
                <p className="text-slate-500 mb-4">No connected buyers yet</p>
                <p className="text-sm text-slate-400">Buyers will connect with you through the agency</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {buyers.map((buyer) => (
                  <div key={buyer.id} className="bg-white rounded-xl border shadow-sm p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{buyer.company_name}</h3>
                        <p className="text-slate-500 text-sm">{buyer.country || 'Location not set'}</p>
                        <p className="text-slate-400 text-xs mt-1">{buyer.email}</p>
                      </div>
                      <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Connected</div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => { setSelectedBuyer(buyer); setShowShareModal(true) }} className="flex-1 bg-cyan-600 text-white py-2 rounded-lg text-sm hover:bg-cyan-700">
                        Share Products
                      </button>
                      <button className="flex-1 border border-slate-200 py-2 rounded-lg text-sm hover:bg-slate-50">
                        Message
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Pending Requests */}
        {activeTab === 'requests' && (
          <>
            {pendingRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border">
                <div className="text-6xl mb-4">📬</div>
                <p className="text-slate-500 mb-4">No pending connection requests</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {pendingRequests.map((buyer) => (
                  <div key={buyer.id} className="bg-white rounded-xl border shadow-sm p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg">{buyer.company_name}</h3>
                        <p className="text-slate-500 text-sm">{buyer.country || 'Location not set'}</p>
                        <p className="text-slate-400 text-xs mt-1">{buyer.email}</p>
                      </div>
                      <div className="bg-yellow-100 text-yellow-700 text-xs px-2 py-1 rounded-full">Pending</div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button onClick={() => approveRequest(buyer.id)} className="flex-1 bg-green-600 text-white py-2 rounded-lg text-sm hover:bg-green-700">
                        Approve
                      </button>
                      <button onClick={() => rejectRequest(buyer.id)} className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm hover:bg-red-700">
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Share Products Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2">Share Products with {selectedBuyer?.company_name}</h2>
            <p className="text-slate-500 text-sm mb-4">Select products to share</p>
            
            <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-3">
              {products.map(p => (
                <label key={p.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={selectedProducts.includes(p.id)} onChange={() => {
                    if (selectedProducts.includes(p.id)) {
                      setSelectedProducts(selectedProducts.filter(id => id !== p.id))
                    } else {
                      setSelectedProducts([...selectedProducts, p.id])
                    }
                  }} />
                  {p.title} - ${p.price_per_unit}
                </label>
              ))}
              {products.length === 0 && <p className="text-slate-400 text-sm">No products to share</p>}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button onClick={shareProducts} disabled={selectedProducts.length === 0} className="flex-1 bg-cyan-600 text-white py-2 rounded-lg disabled:opacity-50">
                Share ({selectedProducts.length})
              </button>
              <button onClick={() => setShowShareModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}