'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { generateBuyerCode, generateManufacturerCode } from '@/lib/code-generator'

export default function AdminConnectPage() {
  const [inquiries, setInquiries] = useState<any[]>([])
  const [buyers, setBuyers] = useState<any[]>([])
  const [manufacturers, setManufacturers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [contactMessage, setContactMessage] = useState('')
  const [sending, setSending] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  async function checkAdminAndLoad() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin/login'); return }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profileData?.role !== 'admin') { router.push('/'); return }
      
      await loadAllData()
    } catch (err) {
      console.error(err)
    }
  }

  async function loadAllData() {
    try {
      // Load all inquiries with full buyer and manufacturer details
      const { data: inquiriesData } = await supabase
        .from('product_inquiries')
        .select(`
          *,
          products(id, title, price_per_unit),
          buyer:profiles!buyer_id(id, company_name, email, phone, contact_person, country),
          manufacturer:profiles!manufacturer_id(id, company_name, email, phone, contact_person, country)
        `)
        .order('created_at', { ascending: false })

      setInquiries(inquiriesData || [])

      // Load all buyers and manufacturers for reference
      const { data: usersData } = await supabase
        .from('profiles')
        .select('*')
        .in('role', ['buyer', 'manufacturer'])

      setBuyers(usersData?.filter(u => u.role === 'buyer') || [])
      setManufacturers(usersData?.filter(u => u.role === 'manufacturer') || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading data:', error)
      setLoading(false)
    }
  }

  async function sendContactNotification() {
    if (!selectedInquiry || !contactMessage.trim()) {
      alert('Please select inquiry and enter message')
      return
    }

    setSending(true)
    try {
      // Send to buyer
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedInquiry.buyer_id,
          title: `🔗 Connection Opportunity - ${selectedInquiry.manufacturer?.id ? generateManufacturerCode(selectedInquiry.manufacturer.id) : 'MFR-CODE'}`,
          message: `${contactMessage}\n\nManufacturer Code: ${selectedInquiry.manufacturer?.id ? generateManufacturerCode(selectedInquiry.manufacturer.id) : 'MFR-CODE'}`,
          type: 'connection'
        })
      })

      // Send to manufacturer
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedInquiry.manufacturer_id,
          title: `🔗 Connection Opportunity - ${selectedInquiry.buyer?.buyer_code}`,
          message: `${contactMessage}\n\nBuyer Code: ${selectedInquiry.buyer?.buyer_code}`,
          type: 'connection'
        })
      })

      alert('✅ Connection notification sent to both parties!')
      setShowContactModal(false)
      setContactMessage('')
    } catch (error) {
      console.error('Error:', error)
      alert('Error sending notification')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-slate-500">Loading data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-red-700 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-white hover:text-gray-100">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-white">🔗 Buyer-Manufacturer Connection Hub</h1>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h2 className="font-bold text-blue-900 mb-2">Admin Mediation Center</h2>
          <p className="text-sm text-blue-800">View all buyer-manufacturer inquiries with full details. Facilitate connections while maintaining privacy through unique codes.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-2xl font-bold text-blue-600">{inquiries.length}</div>
            <div className="text-sm text-slate-600">Total Inquiries</div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-2xl font-bold text-green-600">{buyers.length}</div>
            <div className="text-sm text-slate-600">Active Buyers</div>
          </div>
          <div className="bg-white rounded-lg p-4 border">
            <div className="text-2xl font-bold text-purple-600">{manufacturers.length}</div>
            <div className="text-sm text-slate-600">Active Manufacturers</div>
          </div>
        </div>

        {/* Inquiries List */}
        {inquiries.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <div className="text-6xl mb-4">📋</div>
            <p className="text-slate-500 text-lg">No inquiries yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {inquiries.map((inquiry) => (
              <div key={inquiry.id} className="bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-3">
                  {/* Buyer Info */}
                  <div className="border-r pr-4">
                    <p className="text-xs text-slate-500 mb-1">👤 BUYER</p>
                    <p className="font-semibold text-slate-900">{inquiry.buyer?.company_name}</p>
                    <p className="text-xs text-slate-500 mb-2">{inquiry.buyer?.email}</p>
                    <p className="text-sm font-mono font-bold text-blue-600">{inquiry.buyer?.buyer_code}</p>
                  </div>

                  {/* Product Info */}
                  <div className="border-r pr-4">
                    <p className="text-xs text-slate-500 mb-1">📦 PRODUCT</p>
                    <p className="font-semibold text-slate-900">{inquiry.products?.title}</p>
                    <p className="text-xs text-slate-500">Qty: {inquiry.quantity}</p>
                    <p className="text-sm font-bold text-cyan-600 mt-1">₹{inquiry.products?.price_per_unit}</p>
                  </div>

                  {/* Manufacturer Info */}
                  <div className="border-r pr-4">
                    <p className="text-xs text-slate-500 mb-1">🏭 MANUFACTURER</p>
                    <p className="font-semibold text-slate-900">{inquiry.manufacturer?.company_name}</p>
                    <p className="text-xs text-slate-500 mb-2">{inquiry.manufacturer?.email}</p>
                    <p className="text-sm font-mono font-bold text-purple-600">{inquiry.manufacturer?.id ? generateManufacturerCode(inquiry.manufacturer.id) : 'MFR-CODE'}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => {
                        setSelectedInquiry(inquiry)
                        setShowDetailModal(true)
                      }}
                      className="text-sm px-3 py-2 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 font-medium"
                    >
                      📋 View Details
                    </button>
                    <button
                      onClick={() => {
                        setSelectedInquiry(inquiry)
                        setShowContactModal(true)
                      }}
                      className="text-sm px-3 py-2 rounded bg-green-100 text-green-700 hover:bg-green-200 font-medium"
                    >
                      🔗 Connect
                    </button>
                  </div>
                </div>

                {/* Inquiry Message */}
                <div className="bg-slate-50 rounded p-3 text-sm text-slate-700">
                  <p className="font-semibold text-xs text-slate-600 mb-1">Message:</p>
                  <p>{inquiry.message}</p>
                </div>

                {/* Status Badge */}
                <div className="mt-2 flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    inquiry.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    inquiry.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
                    inquiry.status === 'interested' ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {inquiry.status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs text-slate-500">
                    {new Date(inquiry.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8">
            <h2 className="text-xl font-bold mb-4">📋 Full Inquiry Details (Admin View)</h2>
            
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Buyer Full Details */}
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <h3 className="font-bold text-blue-900 mb-3">👤 Buyer (Full Details)</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Company:</span> {selectedInquiry.buyer?.company_name}</p>
                  <p><span className="font-semibold">Contact:</span> {selectedInquiry.buyer?.contact_person}</p>
                  <p><span className="font-semibold">Email:</span> {selectedInquiry.buyer?.email}</p>
                  <p><span className="font-semibold">Phone:</span> {selectedInquiry.buyer?.phone || 'N/A'}</p>
                  <p><span className="font-semibold">Country:</span> {selectedInquiry.buyer?.country || 'N/A'}</p>
                  <p className="mt-3 p-2 bg-white rounded border-l-4 border-blue-600">
                    <span className="font-mono font-bold text-blue-600">Code: {selectedInquiry.buyer?.buyer_code}</span>
                  </p>
                </div>
              </div>

              {/* Manufacturer Full Details */}
              <div className="p-4 bg-purple-50 rounded-lg border-2 border-purple-200">
                <h3 className="font-bold text-purple-900 mb-3">🏭 Manufacturer (Full Details)</h3>
                <div className="space-y-2 text-sm">
                  <p><span className="font-semibold">Company:</span> {selectedInquiry.manufacturer?.company_name}</p>
                  <p><span className="font-semibold">Contact:</span> {selectedInquiry.manufacturer?.contact_person}</p>
                  <p><span className="font-semibold">Email:</span> {selectedInquiry.manufacturer?.email}</p>
                  <p><span className="font-semibold">Phone:</span> {selectedInquiry.manufacturer?.phone || 'N/A'}</p>
                  <p><span className="font-semibold">Country:</span> {selectedInquiry.manufacturer?.country || 'N/A'}</p>
                  <p className="mt-3 p-2 bg-white rounded border-l-4 border-purple-600">
                    <span className="font-mono font-bold text-purple-600">Code: {selectedInquiry.manufacturer?.id ? generateManufacturerCode(selectedInquiry.manufacturer.id) : 'MFR-CODE'}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Product & Inquiry Details */}
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-cyan-50 rounded-lg border-2 border-cyan-200">
                <h3 className="font-bold text-cyan-900 mb-2">📦 Product</h3>
                <p className="font-semibold">{selectedInquiry.products?.title}</p>
                <p className="text-sm text-slate-600">Price: ₹{selectedInquiry.products?.price_per_unit}</p>
                <p className="text-sm text-slate-600">Quantity Inquired: {selectedInquiry.quantity}</p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
                <h3 className="font-bold text-orange-900 mb-2">📅 Timeline</h3>
                <p className="text-sm">Created: {new Date(selectedInquiry.created_at).toLocaleString()}</p>
                <p className="text-sm">Status: <span className="font-semibold capitalize">{selectedInquiry.status}</span></p>
              </div>
            </div>

            {/* Message */}
            <div className="p-4 bg-slate-50 rounded-lg border mb-6">
              <h3 className="font-bold mb-2">💬 Buyer Message</h3>
              <p className="text-sm text-slate-700">{selectedInquiry.message}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 border py-2 rounded-lg font-semibold hover:bg-slate-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowDetailModal(false)
                  setShowContactModal(true)
                }}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700"
              >
                🔗 Send Connection Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && selectedInquiry && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">🔗 Send Connection Notice</h2>
            
            <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200 text-sm">
              <p className="font-semibold mb-1">Privacy Note:</p>
              <p>Both parties will receive notification with codes only:</p>
              <p>• Buyer sees: Manufacturer Code ({selectedInquiry.manufacturer?.id ? generateManufacturerCode(selectedInquiry.manufacturer.id) : 'MFR-CODE'})</p>
              <p>• Manufacturer sees: Buyer Code ({selectedInquiry.buyer?.buyer_code})</p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Message to Both Parties</label>
              <textarea
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                className="w-full border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="e.g., We've identified a potential match for your product inquiry. Please reach out to discuss further details..."
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowContactModal(false)}
                className="flex-1 border py-2 rounded-lg font-semibold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={sendContactNotification}
                disabled={sending}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50"
              >
                {sending ? 'Sending...' : '✅ Send Notice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
