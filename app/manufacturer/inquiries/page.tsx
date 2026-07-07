'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import { generateBuyerCode, generateManufacturerCode } from '@/lib/code-generator'

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedInquiry, setSelectedInquiry] = useState<any>(null)
  const [showModal, setShowModal] = useState(false)
  const [replyMessage, setReplyMessage] = useState('')
  const [replyingToId, setReplyingToId] = useState<string | null>(null)
  const [replyingLoading, setReplyingLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-700',
    contacted: 'bg-blue-100 text-blue-700',
    interested: 'bg-green-100 text-green-700',
    not_interested: 'bg-gray-100 text-gray-700',
    converted: 'bg-emerald-100 text-emerald-700'
  }

  useEffect(() => {
    loadInquiries()
  }, [])

  async function loadInquiries() {
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

      const { data: inquiriesData } = await supabase
        .from('product_inquiries')
        .select(`
          *,
          products:product_id(title, price_per_unit, images),
          buyer:buyer_id(id, company_name, email)
        `)
        .eq('manufacturer_id', user.id)
        .order('created_at', { ascending: false })

      setInquiries(inquiriesData || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading inquiries:', error)
      setLoading(false)
    }
  }

  async function updateInquiryStatus(inquiry: any, newStatus: string) {
    try {
      const { error } = await supabase
        .from('product_inquiries')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', inquiry.id)

      if (error) throw error

      // Send notification to buyer
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: inquiry.buyer_id,
          title: '📩 Inquiry Update',
          message: `Your inquiry for "${inquiry.products?.title}" has been updated to: ${newStatus.replace(/_/g, ' ')}`,
          type: 'inquiry',
          relatedId: inquiry.id,
          buyerCode: inquiry.buyer?.buyer_code,
          manufacturerCode: profile?.manufacturer_code,
          productTitle: inquiry.products?.title
        })
      })

      // Also notify admin
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'admin',
          title: `📩 Inquiry Status Update - ${inquiry.buyer?.id ? generateBuyerCode(inquiry.buyer.id) : 'BYR-CODE'}`,
          message: `Inquiry status changed to: ${newStatus.replace(/_/g, ' ')}`,
          type: 'inquiry',
          relatedId: inquiry.id,
          buyerCode: inquiry.buyer?.buyer_code,
          manufacturerCode: profile?.manufacturer_code,
          productTitle: inquiry.products?.title
        })
      })

      alert(`✅ Inquiry status updated to ${newStatus.replace(/_/g, ' ')}`)
      loadInquiries()
    } catch (error) {
      console.error('Error:', error)
      alert('Error updating status')
    }
  }

  async function sendReply() {
    if (!replyMessage.trim() || !selectedInquiry) {
      alert('Please enter a message')
      return
    }

    setReplyingLoading(true)
    try {
      // Update inquiry status if pending
      if (selectedInquiry.status === 'pending') {
        await updateInquiryStatus(selectedInquiry, 'contacted')
      }

      // Store reply as a note/update in the inquiry
      const { error } = await supabase
        .from('product_inquiries')
        .update({
          manufacturer_notes: (selectedInquiry.manufacturer_notes || '') + `\n[${new Date().toLocaleString()}]: ${replyMessage}`,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedInquiry.id)

      if (error) throw error

      // Send notification to buyer
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedInquiry.buyer_id,
          title: '💬 New Reply to Your Inquiry',
          message: `${profile?.company_name || 'Manufacturer'} replied to your inquiry for "${selectedInquiry.products?.title}"`,
          type: 'inquiry',
          relatedId: selectedInquiry.id,
          buyerCode: selectedInquiry.buyer?.buyer_code,
          manufacturerCode: profile?.manufacturer_code,
          productTitle: selectedInquiry.products?.title
        })
      })

      // Also notify admin with codes
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'admin',
          title: `💬 Manufacturer Reply - ${selectedInquiry.buyer?.id ? generateBuyerCode(selectedInquiry.buyer.id) : 'BYR-CODE'}`,
          message: `${profile?.manufacturer_code || generateManufacturerCode(profile?.id)} replied to inquiry from ${selectedInquiry.buyer?.id ? generateBuyerCode(selectedInquiry.buyer.id) : 'BYR-CODE'}`,
          type: 'inquiry',
          relatedId: selectedInquiry.id,
          buyerCode: selectedInquiry.buyer?.buyer_code,
          manufacturerCode: profile?.manufacturer_code,
          productTitle: selectedInquiry.products?.title
        })
      })

      alert('✅ Reply sent!')
      setReplyMessage('')
      setShowModal(false)
      loadInquiries()
    } catch (error) {
      console.error('Error:', error)
      alert('Error sending reply')
    } finally {
      setReplyingLoading(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Product Inquiries ({inquiries.length})</h1>
            <p className="text-slate-500 text-sm">Manage buyer inquiries for your products</p>
          </div>
          <button
            onClick={() => router.push('/manufacturer/dashboard')}
            className="text-slate-600 hover:text-slate-800"
          >
            ← Back
          </button>
        </div>

        {inquiries.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border">
            <div className="text-6xl mb-4">💬</div>
            <p className="text-slate-500 mb-4">No inquiries yet</p>
            <p className="text-sm text-slate-400">Buyers will send inquiries for your products here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {inquiries.map((inquiry) => (
              <div
                key={inquiry.id}
                className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{inquiry.products?.title}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusColors[inquiry.status] || 'bg-gray-100'}`}>
                          {inquiry.status?.replace(/_/g, ' ') || 'pending'}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500">
                        {new Date(inquiry.created_at).toLocaleDateString()} at {new Date(inquiry.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2">🔐 Buyer Code</h4>
                      <p className="font-mono text-lg font-bold text-blue-600">{inquiry.buyer?.id ? generateBuyerCode(inquiry.buyer.id) : 'BYR-CODE'}</p>
                      <p className="text-xs text-slate-500 mt-1">Verified Buyer</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Inquiry Details</h4>
                      <p className="text-sm">
                        <strong>Quantity:</strong> {inquiry.quantity || 'Not specified'}
                      </p>
                      <p className="text-sm">
                        <strong>Unit Price:</strong> ${inquiry.products?.price_per_unit || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 p-4 bg-slate-50 rounded-lg border">
                    <h4 className="font-semibold text-sm mb-2">📝 Message</h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{inquiry.message}</p>
                  </div>

                  {inquiry.manufacturer_notes && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-sm mb-2 text-blue-700">💬 Your Notes</h4>
                      <p className="text-sm text-blue-600 whitespace-pre-wrap">{inquiry.manufacturer_notes}</p>
                    </div>
                  )}

                  <div className="flex gap-3 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedInquiry(inquiry)
                        setReplyMessage('')
                        setShowModal(true)
                      }}
                      className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                    >
                      💬 Send Reply
                    </button>
                    <select
                      onChange={(e) => updateInquiryStatus(inquiry, e.target.value)}
                      value={inquiry.status}
                      className="border rounded-lg px-4 py-2 text-sm font-medium bg-white hover:bg-slate-50"
                    >
                      <option value="pending">🟡 Pending</option>
                      <option value="contacted">🔵 Contacted</option>
                      <option value="interested">🟢 Interested</option>
                      <option value="not_interested">⚪ Not Interested</option>
                      <option value="converted">✅ Converted to Order</option>
                    </select>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reply Modal */}
      {showModal && selectedInquiry && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white pb-4 mb-4 border-b">
              <h2 className="text-xl font-bold">💬 Reply to Inquiry</h2>
              <p className="text-slate-500 text-sm">{selectedInquiry.products?.title}</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg">
                <p className="text-sm font-semibold mb-2">Buyer's Message:</p>
                <p className="text-sm text-slate-700 whitespace-pre-wrap">{selectedInquiry.message}</p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">Your Reply</label>
                <textarea
                  rows={5}
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  placeholder="Type your reply message..."
                  className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t sticky bottom-0 bg-white">
              <button
                onClick={sendReply}
                disabled={replyingLoading || !replyMessage.trim()}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-300 text-white py-2 rounded-lg font-medium transition"
              >
                {replyingLoading ? 'Sending...' : 'Send Reply'}
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
