'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [selectedInspection, setSelectedInspection] = useState<any>(null)
  const [form, setForm] = useState({
    inspector_name: '',
    inspection_date: '',
    result: 'pending',
    notes: '',
    photos: []
  })
  const [reportForm, setReportForm] = useState({
    title: '',
    description: '',
    findings: '',
    recommendations: '',
    status: 'draft'
  })
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
    
    const { data: ordersData } = await supabase
      .from('orders')
      .select('*, products(title)')
      .eq('manufacturer_id', user.id)
      .eq('stage', 3)
    setOrders(ordersData || [])
    
    const { data: inspectionsData } = await supabase
      .from('inspections')
      .select('*, orders(order_number, products(title))')
      .eq('manufacturer_id', user.id)
      .order('created_at', { ascending: false })
    setInspections(inspectionsData || [])
    
    setLoading(false)
  }

  async function scheduleInspection(e) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('inspections').insert({
      order_id: selectedOrder.id,
      manufacturer_id: user.id,
      inspector_name: form.inspector_name,
      inspection_date: form.inspection_date,
      status: 'scheduled',
      result: 'pending',
      notes: form.notes
    })
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Inspection scheduled successfully!')
      setShowModal(false)
      setForm({ inspector_name: '', inspection_date: '', result: 'pending', notes: '', photos: [] })
      loadData()
    }
  }

  async function updateInspectionResult(id: string, result: string) {
    const { error } = await supabase
      .from('inspections')
      .update({ result: result, status: 'completed' })
      .eq('id', id)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert(`Inspection marked as ${result.toUpperCase()}`)
      loadData()
    }
  }

  async function addReport(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedInspection) return

    const { error } = await supabase
      .from('inspection_reports')
      .insert({
        inspection_id: selectedInspection.id,
        title: reportForm.title,
        description: reportForm.description,
        findings: reportForm.findings,
        recommendations: reportForm.recommendations,
        status: reportForm.status,
        created_at: new Date().toISOString()
      })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('✅ Report added successfully!')
      setShowReportModal(false)
      setReportForm({ title: '', description: '', findings: '', recommendations: '', status: 'draft' })
      loadData()
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Quality Inspections</h1>
            <p className="text-slate-500 text-sm">Schedule and manage product inspections</p>
          </div>
          <button onClick={() => router.push('/manufacturer/dashboard')} className="text-slate-600 hover:text-slate-800">← Back</button>
        </div>

        {/* Pending Inspections */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Ready for Inspection</h2>
          {orders.filter(o => !inspections.some(i => i.order_id === o.id)).length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border">
              <p className="text-slate-500">No orders ready for inspection</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.filter(o => !inspections.some(i => i.order_id === o.id)).map(order => (
                <div key={order.id} className="bg-white rounded-xl border p-4 shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-mono text-sm">#{order.order_number || order.id.slice(0, 8)}</p>
                      <p className="font-medium">{order.products?.title}</p>
                      <p className="text-sm text-slate-500">Qty: {order.quantity}</p>
                    </div>
                    <button
                      onClick={() => { setSelectedOrder(order); setShowModal(true) }}
                      className="bg-cyan-600 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Schedule Inspection
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inspection History */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Inspection History</h2>
          {inspections.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center border">
              <p className="text-slate-500">No inspections yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {inspections.map(inspection => (
                <div key={inspection.id} className="bg-white rounded-xl border p-4 shadow-sm">
                  <div className="flex justify-between items-center flex-wrap gap-3">
                    <div>
                      <p className="font-mono text-sm">Order: #{inspection.orders?.order_number}</p>
                      <p className="font-medium">{inspection.orders?.products?.title}</p>
                      <p className="text-sm text-slate-500">Inspector: {inspection.inspector_name}</p>
                      <p className="text-sm text-slate-500">Date: {new Date(inspection.inspection_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        inspection.result === 'pass' ? 'bg-green-100 text-green-700' :
                        inspection.result === 'fail' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {inspection.result === 'pass' ? '✅ Pass' : inspection.result === 'fail' ? '❌ Fail' : '⏳ Pending'}
                      </span>
                      <div className="mt-3 flex flex-col gap-2">
                        {inspection.result === 'pending' && (
                          <div className="flex gap-2">
                            <button onClick={() => updateInspectionResult(inspection.id, 'pass')} className="bg-green-600 text-white px-3 py-1 rounded text-xs">Pass</button>
                            <button onClick={() => updateInspectionResult(inspection.id, 'fail')} className="bg-red-600 text-white px-3 py-1 rounded text-xs">Fail</button>
                          </div>
                        )}
                        <button 
                          onClick={() => { setSelectedInspection(inspection); setShowReportModal(true) }}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                        >
                          📄 Add Report
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Inspection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Schedule Inspection</h2>
            <form onSubmit={scheduleInspection} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Inspector Name</label>
                <input type="text" required value={form.inspector_name} onChange={e => setForm({...form, inspector_name: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Inspection Date</label>
                <input type="date" required value={form.inspection_date} onChange={e => setForm({...form, inspection_date: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Notes</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-cyan-600 text-white py-2 rounded-lg">Schedule</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Report Modal */}
      {showReportModal && selectedInspection && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowReportModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-2">📄 Add Inspection Report</h2>
            <p className="text-sm text-slate-500 mb-6">For: {selectedInspection.orders?.products?.title} (Order: #{selectedInspection.orders?.order_number})</p>
            
            <form onSubmit={addReport} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Report Title</label>
                <input 
                  type="text" 
                  required 
                  value={reportForm.title} 
                  onChange={e => setReportForm({...reportForm, title: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2" 
                  placeholder="e.g., Quality Inspection Report"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Description</label>
                <textarea 
                  rows={3}
                  value={reportForm.description} 
                  onChange={e => setReportForm({...reportForm, description: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2" 
                  placeholder="Brief overview of the inspection"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Findings</label>
                <textarea 
                  rows={3}
                  value={reportForm.findings} 
                  onChange={e => setReportForm({...reportForm, findings: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2" 
                  placeholder="Detailed findings from the inspection"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Recommendations</label>
                <textarea 
                  rows={3}
                  value={reportForm.recommendations} 
                  onChange={e => setReportForm({...reportForm, recommendations: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2" 
                  placeholder="Recommendations or action items"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Status</label>
                <select 
                  value={reportForm.status} 
                  onChange={e => setReportForm({...reportForm, status: e.target.value})}
                  className="w-full border rounded-lg px-4 py-2"
                >
                  <option value="draft">📝 Draft</option>
                  <option value="submitted">📤 Submitted</option>
                  <option value="approved">✅ Approved</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold">Save Report</button>
                <button type="button" onClick={() => setShowReportModal(false)} className="flex-1 border py-2 rounded-lg font-semibold">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}