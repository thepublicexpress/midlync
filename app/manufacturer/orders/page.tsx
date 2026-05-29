'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [updateNote, setUpdateNote] = useState('')
  const [trackingNumber, setTrackingNumber] = useState('')
  const [trackingUrl, setTrackingUrl] = useState('')
  const [estimatedDelivery, setEstimatedDelivery] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const router = useRouter()
  const supabase = createClient()

  const stages = [
    { id: 1, name: 'Order Placed', icon: '🛒', color: 'bg-blue-100 text-blue-700' },
    { id: 2, name: 'Approved', icon: '✅', color: 'bg-green-100 text-green-700' },
    { id: 3, name: 'Production', icon: '🏭', color: 'bg-purple-100 text-purple-700' },
    { id: 4, name: 'Shipped', icon: '🚢', color: 'bg-orange-100 text-orange-700' },
    { id: 5, name: 'Delivered', icon: '🎯', color: 'bg-emerald-100 text-emerald-700' },
    { id: 6, name: 'Rejected', icon: '❌', color: 'bg-red-100 text-red-700' },
    { id: 7, name: 'Cancelled', icon: '🚫', color: 'bg-gray-100 text-gray-700' }
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
      .select('*, products(title, price_per_unit, images), buyer:profiles!buyer_id(company_name, email)')
      .eq('manufacturer_id', user.id)
      .order('created_at', { ascending: false })
    
    setOrders(ordersData || [])
    setLoading(false)
  }

  async function updateOrderStage(order, newStage) {
    const stageInfo = stages.find(s => s.id === newStage)
    if (!stageInfo) return
    
    // Prepare update data
    const updateData: any = { 
      stage: newStage, 
      stage_name: stageInfo.name,
      updated_at: new Date().toISOString()
    }
    
    // Add tracking info if stage is Shipped (4)
    if (newStage === 4 && trackingNumber) {
      updateData.tracking_number = trackingNumber
      if (trackingUrl) updateData.tracking_url = trackingUrl
      if (estimatedDelivery) updateData.estimated_delivery = estimatedDelivery
    }
    
    if (updateNote) {
      updateData.manufacturer_notes = updateNote
    }
    
    // Update order
    const { error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', order.id)
    
    if (error) {
      alert('Error: ' + error.message)
      return
    }
    
    // Add to tracking history
    await supabase.from('order_tracking').insert({
      order_id: order.id,
      status: stageInfo.name,
      note: updateNote || (newStage === 6 ? `Order rejected: ${rejectReason}` : `Order moved to ${stageInfo.name}`),
      updated_by: order.manufacturer_id
    })
    
    // Send notification to buyer
    let notificationTitle = `📦 Order Update: ${stageInfo.name}`
    let notificationMessage = `Your order #${order.order_number?.slice(0, 8)} has been ${stageInfo.name.toLowerCase()}.`
    
    if (newStage === 6) {
      notificationTitle = `❌ Order Rejected`
      notificationMessage = `Your order #${order.order_number?.slice(0, 8)} has been rejected. Reason: ${rejectReason || 'Not specified'}`
    } else if (newStage === 7) {
      notificationTitle = `🚫 Order Cancelled`
      notificationMessage = `Your order #${order.order_number?.slice(0, 8)} has been cancelled.`
    } else if (newStage === 4 && trackingNumber) {
      notificationMessage = `Your order #${order.order_number?.slice(0, 8)} has been shipped. Tracking: ${trackingNumber}`
    }
    
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: order.buyer_id,
        title: notificationTitle,
        message: notificationMessage,
        type: 'order',
        relatedId: order.id
      })
    })
    
    alert(`✅ Order updated to ${stageInfo.name}`)
    setShowModal(false)
    setShowRejectModal(false)
    setUpdateNote('')
    setTrackingNumber('')
    setTrackingUrl('')
    setEstimatedDelivery('')
    setRejectReason('')
    loadOrders()
  }

  async function cancelOrder(order) {
    if (!confirm('Are you sure you want to cancel this order?')) return
    await updateOrderStage(order, 7)
  }

  function getStageStatus(orderStage) {
    return stages.map(stage => ({
      ...stage,
      completed: orderStage >= stage.id && stage.id !== 6 && stage.id !== 7,
      current: orderStage === stage.id,
      rejected: orderStage === 6,
      cancelled: orderStage === 7
    }))
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Order Management</h1>
            <p className="text-slate-500 text-sm">Track and manage customer orders</p>
          </div>
          <button onClick={() => router.push('/manufacturer/dashboard')} className="text-slate-600 hover:text-slate-800">← Back</button>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-slate-500 mb-4">No orders yet</p>
            <p className="text-sm text-slate-400">Orders will appear here when buyers place them</p>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const stageStatus = getStageStatus(order.stage || 1)
              const isRejectedOrCancelled = order.stage === 6 || order.stage === 7
              
              return (
                <div key={order.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  {/* Order Header */}
                  <div className={`px-6 py-4 border-b flex justify-between items-center flex-wrap gap-3 ${order.stage === 6 ? 'bg-red-50' : order.stage === 7 ? 'bg-gray-50' : 'bg-slate-50'}`}>
                    <div>
                      <span className="font-mono text-sm text-slate-500">#{order.order_number || order.id.slice(0, 8)}</span>
                      <span className="ml-3 text-sm text-slate-600">{new Date(order.created_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${stages.find(s => s.id === order.stage)?.color || 'bg-gray-100'}`}>
                        {stages.find(s => s.id === order.stage)?.icon} {order.stage_name || stages.find(s => s.id === order.stage)?.name || 'Pending'}
                      </span>
                      {order.tracking_number && (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                          📦 Tracking: {order.tracking_number}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="p-6">
                    <div className="grid md:grid-cols-2 gap-6 mb-6">
                      <div>
                        <h3 className="font-semibold mb-2">Product Details</h3>
                        <p className="font-medium">{order.products?.title}</p>
                        <p className="text-sm text-slate-500">Quantity: {order.quantity}</p>
                        <p className="text-sm text-slate-500">Unit Price: {order.currency === 'INR' ? '₹' : '$'}{order.unit_price || order.products?.price_per_unit}</p>
                        <p className="text-lg font-bold text-cyan-600 mt-2">Total: {order.currency === 'INR' ? '₹' : '$'}{order.total_amount || (order.quantity * (order.unit_price || order.products?.price_per_unit))}</p>
                      </div>
                      <div>
                        <h3 className="font-semibold mb-2">Buyer Details</h3>
                        <p className="font-medium">{order.buyer?.company_name || order.buyer?.email}</p>
                        <p className="text-sm text-slate-500">{order.buyer?.email}</p>
                      </div>
                    </div>

                    {/* Progress Tracker - Only show if not rejected/cancelled */}
                    {!isRejectedOrCancelled && (
                      <div className="mb-6">
                        <h3 className="font-semibold mb-4">Order Status</h3>
                        <div className="relative">
                          <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-200"></div>
                          <div className="relative flex justify-between">
                            {stageStatus.slice(0, 5).map((stage) => (
                              <div key={stage.id} className="text-center z-10">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${stage.completed ? stage.color : 'bg-slate-100 text-slate-400'}`}>
                                  <span className="text-lg">{stage.icon}</span>
                                </div>
                                <p className={`text-xs font-medium ${stage.completed ? 'text-slate-700' : 'text-slate-400'}`}>{stage.name}</p>
                                {stage.current && (
                                  <span className="text-xs text-cyan-600 mt-1 block">Current</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Rejected/Cancelled Message */}
                    {order.stage === 6 && (
                      <div className="mb-6 p-4 bg-red-50 rounded-lg border border-red-200">
                        <p className="text-red-600 font-semibold">❌ Order Rejected</p>
                        <p className="text-sm text-red-500 mt-1">{order.manufacturer_notes || 'No reason provided'}</p>
                      </div>
                    )}
                    
                    {order.stage === 7 && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <p className="text-gray-600 font-semibold">🚫 Order Cancelled</p>
                        <p className="text-sm text-gray-500 mt-1">{order.manufacturer_notes || 'Order cancelled by manufacturer'}</p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {!isRejectedOrCancelled && order.stage < 5 && (
                      <div className="flex gap-3 justify-end">
                        <button
                          onClick={() => { setSelectedOrder(order); setShowRejectModal(true); setUpdateNote(''); setRejectReason('') }}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
                        >
                          ❌ Reject Order
                        </button>
                        <button
                          onClick={() => cancelOrder(order)}
                          className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition"
                        >
                          🚫 Cancel Order
                        </button>
                        <button
                          onClick={() => { setSelectedOrder(order); setShowModal(true); setUpdateNote(''); setTrackingNumber(''); setTrackingUrl(''); setEstimatedDelivery('') }}
                          className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm transition"
                        >
                          Update to Next Stage →
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Update Stage Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Update Order Status</h2>
            <p className="text-slate-500 text-sm mb-4">Order: {selectedOrder.order_number || selectedOrder.id.slice(0, 8)}</p>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Next Stage</label>
              <select
                className="w-full border rounded-lg px-4 py-2"
                onChange={(e) => setSelectedOrder({ ...selectedOrder, newStage: parseInt(e.target.value) })}
                defaultValue={selectedOrder.stage + 1}
              >
                {stages.filter(s => s.id > (selectedOrder.stage || 1) && s.id <= 5).map(stage => (
                  <option key={stage.id} value={stage.id}>{stage.icon} {stage.name}</option>
                ))}
              </select>
            </div>
            
            {/* Tracking Info - Show only when stage is Shipped */}
            {(selectedOrder.newStage === 4 || (selectedOrder.stage + 1 === 4)) && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Tracking Number</label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={e => setTrackingNumber(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Enter tracking number"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Tracking URL (Optional)</label>
                  <input
                    type="url"
                    value={trackingUrl}
                    onChange={e => setTrackingUrl(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="https://tracking.courier.com/..."
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-2">Estimated Delivery Date</label>
                  <input
                    type="date"
                    value={estimatedDelivery}
                    onChange={e => setEstimatedDelivery(e.target.value)}
                    className="w-full border rounded-lg px-4 py-2"
                  />
                </div>
              </>
            )}
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Notes (Optional)</label>
              <textarea
                rows={3}
                value={updateNote}
                onChange={e => setUpdateNote(e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
                placeholder="Add any notes about this update..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => updateOrderStage(selectedOrder, selectedOrder.newStage || (selectedOrder.stage + 1))}
                className="flex-1 bg-cyan-600 text-white py-2 rounded-lg hover:bg-cyan-700 transition"
              >
                Update Order
              </button>
              <button onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Order Modal */}
      {showRejectModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4 text-red-600">❌ Reject Order</h2>
            <p className="text-slate-500 text-sm mb-4">Order: {selectedOrder.order_number || selectedOrder.id.slice(0, 8)}</p>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Reason for Rejection</label>
              <textarea
                rows={4}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
                placeholder="Please provide reason for rejecting this order..."
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">Additional Notes (Optional)</label>
              <textarea
                rows={2}
                value={updateNote}
                onChange={e => setUpdateNote(e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
                placeholder="Any additional notes..."
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (!rejectReason) {
                    alert('Please provide a reason for rejection')
                    return
                  }
                  updateOrderStage(selectedOrder, 6)
                }}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition"
              >
                Confirm Reject
              </button>
              <button onClick={() => setShowRejectModal(false)} className="flex-1 border py-2 rounded-lg hover:bg-gray-50 transition">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}