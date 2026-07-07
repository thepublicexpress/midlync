"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { generateBuyerCode, generateManufacturerCode } from '@/lib/code-generator'

export default function AdminDashboard() {
  const [users, setUsers] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [manufacturers, setManufacturers] = useState<any[]>([])
  const [buyers, setBuyers] = useState<any[]>([])
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [showUserDetailModal, setShowUserDetailModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [form, setForm] = useState({ email: '', password: '', role: 'manufacturer', company_name: '' })
  const [submitting, setSubmitting] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [currentSection, setCurrentSection] = useState('users') // 'users' or 'orders'
  const [notifyingOrderId, setNotifyingOrderId] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  async function checkAdminAndLoad() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
      if (profile?.role !== 'admin') { router.push('/'); return }
      await loadAllData()
    } catch (err) {
      console.error(err)
    }
  }

  async function loadAllData() {
    setLoading(true)
    const { data: usersData } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(usersData || [])
    setManufacturers(usersData?.filter((u: any) => u.role === 'manufacturer') || [])
    setBuyers(usersData?.filter((u: any) => u.role === 'buyer') || [])
    setPendingApprovals(usersData?.filter((u: any) => u.approval_status === 'pending' && u.role !== 'admin') || [])
    const { data: productsData } = await supabase.from('products').select('*, manufacturer:profiles!manufacturer_id(id, company_name, email)').order('created_at', { ascending: false })
    setProducts(productsData || [])
    const { data: ordersData } = await supabase.from('orders').select('*, products(title), buyer:profiles!buyer_id(id, company_name)').order('created_at', { ascending: false })
    setOrders(ordersData || [])
    setLoading(false)
  }

  async function approveUser(userId: string) {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('profiles').update({ 
      is_approved: true, 
      approval_status: 'approved', 
      approved_at: new Date().toISOString(),
      approved_by: user?.id,
      rejected_reason: null
    }).eq('id', userId)
    if (error) { 
      alert('Error: ' + error.message) 
    } else { 
      alert('✅ User approved!')
      loadAllData() 
    }
  }

  async function rejectUser() {
    const { error } = await supabase.from('profiles').update({ 
      is_approved: false, 
      approval_status: 'rejected', 
      rejected_reason: rejectReason 
    }).eq('id', selectedUser?.id)
    if (error) { 
      alert('Error: ' + error.message) 
    } else { 
      alert('❌ User rejected!'); 
      setShowRejectModal(false); 
      setRejectReason(''); 
      loadAllData() 
    }
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    const { error } = await supabase.auth.signUp({ 
      email: form.email, 
      password: form.password, 
      options: { 
        data: { 
          role: form.role, 
          company_name: form.company_name,
          approval_status: 'pending',
          is_approved: false
        } 
      } 
    })
    if (error) { 
      alert('Error: ' + error.message) 
    } else { 
      alert('User created! Pending admin approval.'); 
      setShowModal(false); 
      loadAllData(); 
      setForm({ email: '', password: '', role: 'manufacturer', company_name: '' }) 
    }
    setSubmitting(false)
  }

  async function updateUserRole(userId: string, newRole: string) {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (error) { alert('Error: ' + error.message) } else { alert('Role updated'); loadAllData() }
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Delete user ${email}?`)) return
    const { error } = await supabase.from('profiles').delete().eq('id', userId)
    if (error) { alert('Error: ' + error.message) } else { alert('User deleted'); loadAllData() }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  async function notifyManufacturer(order: any) {
    try {
      setNotifyingOrderId(order.id)
      
      // Get buyer code
      const { data: buyer } = await supabase
        .from('profiles')
        .select('buyer_code')
        .eq('id', order.buyer_id)
        .single()

      // Get manufacturer code
      const { data: manufacturer } = await supabase
        .from('profiles')
        .select('manufacturer_code')
        .eq('id', order.manufacturer_id)
        .single()

      const response = await fetch('/api/notify-manufacturer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.order_number,
          manufacturerId: order.manufacturer_id,
          buyerCode: buyer?.buyer_code || 'BYR-CODE',
          productTitle: order.products?.title || 'Product',
          quantity: order.quantity,
          amount: order.total_amount
        })
      })

      if (response.ok) {
        alert('✅ Manufacturer notified successfully!')
        loadAllData()
      } else {
        alert('❌ Error notifying manufacturer')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error notifying manufacturer')
    } finally {
      setNotifyingOrderId(null)
    }
  }

  const getRoleBadgeClass = (role: string) => {
    if (role === 'admin') return 'bg-red-100 text-red-700'
    if (role === 'manufacturer') return 'bg-blue-100 text-blue-700'
    if (role === 'buyer') return 'bg-green-100 text-green-700'
    return 'bg-gray-100 text-gray-700'
  }

  const getStatusBadge = (user: any) => {
    if (user.approval_status === 'approved') {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">✅ Approved</span>
    }
    if (user.approval_status === 'rejected') {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">❌ Rejected</span>
    }
    return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">⏳ Pending</span>
  }

  const getFilteredUsers = () => {
    let filtered = users.filter((u: any) => u.role !== 'admin')
    if (activeTab === 'pending') {
      filtered = filtered.filter((u: any) => u.approval_status === 'pending')
    } else if (activeTab === 'approved') {
      filtered = filtered.filter((u: any) => u.approval_status === 'approved')
    } else if (activeTab === 'rejected') {
      filtered = filtered.filter((u: any) => u.approval_status === 'rejected')
    }
    if (filterRole !== 'all') {
      filtered = filtered.filter((u: any) => u.role === filterRole)
    }
    if (searchTerm) {
      filtered = filtered.filter((u: any) => 
        u.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    return filtered
  }

  const filteredUsers = getFilteredUsers()

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-red-700 px-4 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-xl font-bold text-white">Midlync Admin</Link>
          <span className="bg-white text-red-700 text-xs px-2 py-1 rounded-full font-bold">ADMIN</span>
        </div>
        <div className="flex items-center gap-2">
          <Link 
            href="/admin/connect" 
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition flex items-center gap-1"
          >
            🔗 Connect
          </Link>
          <Link 
            href="/admin/notifications" 
            className="bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded text-sm transition flex items-center gap-1"
          >
            🔔 Notifications
          </Link>
          {pendingApprovals.length > 0 && (
            <button onClick={async () => {
              for (const user of pendingApprovals) {
                await approveUser(user.id)
              }
              alert(`✅ ${pendingApprovals.length} users approved!`)
              loadAllData()
            }} className="bg-green-600 text-white px-2 py-1 rounded text-xs">
              Bulk ({pendingApprovals.length})
            </button>
          )}
          <button onClick={handleLogout} className="bg-white/20 text-white px-3 py-1 rounded text-sm">Logout</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
            <p className="text-slate-500 text-xs">Manage users, approvals & orders</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm">+ Create User</button>
        </div>

        {/* Section Tabs */}
        <div className="flex gap-2 mb-6">
          <button 
            onClick={() => setCurrentSection('users')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${currentSection === 'users' ? 'bg-red-600 text-white' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}
          >
            👥 Users
          </button>
          <button 
            onClick={() => setCurrentSection('orders')}
            className={`px-4 py-2 rounded-lg font-semibold transition ${currentSection === 'orders' ? 'bg-red-600 text-white' : 'bg-white border text-slate-700 hover:bg-slate-50'}`}
          >
            📦 Orders ({orders.length})
          </button>
        </div>

        {currentSection === 'users' ? (
          <>
        {/* Stats Cards - Grid responsive - Clickable */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-4">
          <button onClick={() => { setActiveTab('all'); setFilterRole('all') }} className="bg-white rounded-lg p-3 border hover:border-red-600 hover:shadow-md transition cursor-pointer"><div className="text-lg">👥</div><div className="text-xl font-bold">{users.filter((u: any) => u.role !== 'admin').length}</div><div className="text-xs text-slate-500">Total</div></button>
          <button onClick={() => { setActiveTab('pending'); setFilterRole('all') }} className="bg-white rounded-lg p-3 border hover:border-yellow-600 hover:shadow-md transition cursor-pointer"><div className="text-lg">⏳</div><div className="text-xl font-bold text-yellow-600">{pendingApprovals.length}</div><div className="text-xs text-slate-500">Pending</div></button>
          <button onClick={() => { setActiveTab('approved'); setFilterRole('all') }} className="bg-white rounded-lg p-3 border hover:border-green-600 hover:shadow-md transition cursor-pointer"><div className="text-lg">✅</div><div className="text-xl font-bold text-green-600">{users.filter((u: any) => u.approval_status === 'approved' && u.role !== 'admin').length}</div><div className="text-xs text-slate-500">Approved</div></button>
          <button onClick={() => { setActiveTab('rejected'); setFilterRole('all') }} className="bg-white rounded-lg p-3 border hover:border-red-600 hover:shadow-md transition cursor-pointer"><div className="text-lg">❌</div><div className="text-xl font-bold text-red-600">{users.filter((u: any) => u.approval_status === 'rejected' && u.role !== 'admin').length}</div><div className="text-xs text-slate-500">Rejected</div></button>
          <button onClick={() => { setActiveTab('all'); setFilterRole('manufacturer') }} className="bg-white rounded-lg p-3 border hover:border-purple-600 hover:shadow-md transition cursor-pointer"><div className="text-lg">🏭</div><div className="text-xl font-bold">{manufacturers.length}</div><div className="text-xs text-slate-500">Mfrs</div></button>
          <button onClick={() => { setActiveTab('all'); setFilterRole('buyer') }} className="bg-white rounded-lg p-3 border hover:border-blue-600 hover:shadow-md transition cursor-pointer"><div className="text-lg">🛒</div><div className="text-xl font-bold">{buyers.length}</div><div className="text-xs text-slate-500">Buyers</div></button>
        </div>
          </> 
        ) : (
          <div className="bg-white rounded-lg p-4 border mb-4">
            <h3 className="font-semibold mb-2">📦 Orders ({orders.length})</h3>
            <p className="text-xs text-slate-500">Admin can notify manufacturers here. Manufacturers will receive buyer codes only.</p>
          </div>
        )}

        {currentSection === 'users' && (
        <>
        {/* Filters - Stack on mobile */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="flex-1"><input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full border rounded-lg px-3 py-1.5 text-sm" /></div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm w-full sm:w-auto">
            <option value="all">All Roles</option>
            <option value="manufacturer">Manufacturer</option>
            <option value="buyer">Buyer</option>
          </select>
        </div>

        {/* Users Table - Horizontal scroll on mobile */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-3 text-left">Company</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Role</th>
                  <th className="p-3 text-left">Code</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user: any) => (
                  <tr key={user.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium text-sm">{user.company_name || '-'}</td>
                    <td className="p-3 text-xs">{user.email}</td>
                    <td className="p-3">
                      <select value={user.role} onChange={(e) => updateUserRole(user.id, e.target.value)} className={`px-1 py-0.5 rounded-full text-xs font-semibold border ${getRoleBadgeClass(user.role)}`}>
                        <option value="admin">Admin</option>
                        <option value="manufacturer">Manufacturer</option>
                        <option value="buyer">Buyer</option>
                      </select>
                    </td>
                    <td className="p-3 font-mono text-xs font-bold text-blue-600">
                      {user.role === 'manufacturer' ? (user.manufacturer_code || 'MFR-CODE') : 
                       user.role === 'buyer' ? (user.buyer_code || 'BYR-CODE') : '-'}
                    </td>
                    <td className="p-3">{getStatusBadge(user)}</td>
                    <td className="p-3">
                      <div className="flex gap-1 flex-wrap">
                        <button 
                          onClick={() => { 
                            setSelectedUser(user)
                            setShowUserDetailModal(true) 
                          }} 
                          className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs hover:bg-blue-700"
                        >
                          👁️ View
                        </button>
                        {user.approval_status === 'pending' && (
                          <>
                            <button onClick={() => approveUser(user.id)} className="bg-green-600 text-white px-1.5 py-0.5 rounded text-xs">✅ Approve</button>
                            <button onClick={() => { setSelectedUser(user); setShowRejectModal(true) }} className="bg-red-600 text-white px-1.5 py-0.5 rounded text-xs">❌ Reject</button>
                          </>
                        )}
                        <button onClick={() => { setSelectedUser(user); setShowUserDetailModal(true) }} className="bg-blue-600 text-white px-1.5 py-0.5 rounded text-xs">View</button>
                        <button onClick={() => deleteUser(user.id, user.email)} className="bg-gray-600 text-white px-1.5 py-0.5 rounded text-xs">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && <div className="text-center py-8 text-slate-500">No users found</div>}
        </>
        )}

        {currentSection === 'orders' && (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[1000px]">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="p-3 text-left">Order #</th>
                  <th className="p-3 text-left">Buyer Code</th>
                  <th className="p-3 text-left">Product</th>
                  <th className="p-3 text-left">Qty</th>
                  <th className="p-3 text-left">Amount</th>
                  <th className="p-3 text-left">Status</th>
                  <th className="p-3 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {orders && orders.length > 0 ? orders.map((order: any) => (
                  <tr key={order.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-mono text-xs">{order.order_number}</td>
                    <td className="p-3 font-bold text-blue-600">{order.buyer?.id ? generateBuyerCode(order.buyer.id) : 'BYR-CODE'}</td>
                    <td className="p-3 text-sm">{order.products?.title || 'Product'}</td>
                    <td className="p-3">{order.quantity}</td>
                    <td className="p-3 font-semibold">${order.total_amount?.toFixed(2)}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : order.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                        {order.status || 'pending'}
                      </span>
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={() => notifyManufacturer(order)}
                        disabled={notifyingOrderId === order.id}
                        className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs font-semibold disabled:opacity-50 transition"
                      >
                        {notifyingOrderId === order.id ? '⏳ Notifying...' : '📨 Notify Mfr'}
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={7} className="p-4 text-center text-slate-500">No orders found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      {/* Modals - same as before */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-5" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-3">Create User</h2>
            <form onSubmit={createUser} className="space-y-3">
              <input type="text" placeholder="Company Name" required value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <input type="password" placeholder="Password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="manufacturer">Manufacturer</option><option value="buyer">Buyer</option><option value="admin">Admin</option>
              </select>
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={submitting} className="flex-1 bg-red-600 text-white py-1.5 rounded-lg text-sm">{submitting ? 'Creating...' : 'Create'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border py-1.5 rounded-lg text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-5" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-3">Reject User</h2>
            <p className="text-sm text-slate-500 mb-3">User: {selectedUser?.email}</p>
            <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mb-3" placeholder="Reason..." />
            <div className="flex gap-2">
              <button onClick={rejectUser} className="flex-1 bg-red-600 text-white py-1.5 rounded-lg text-sm">Reject</button>
              <button onClick={() => setShowRejectModal(false)} className="flex-1 border py-1.5 rounded-lg text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showUserDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto" onClick={() => setShowUserDetailModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 my-8" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">👁️ Full User Details (Admin View)</h2>
              <button onClick={() => setShowUserDetailModal(false)} className="text-gray-500 text-xl">✕</button>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              {/* Left Column */}
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded">
                  <label className="text-xs text-slate-600 font-semibold">Company Name</label>
                  <p className="text-lg font-bold text-slate-900">{selectedUser.company_name || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <label className="text-xs text-slate-600 font-semibold">Email</label>
                  <p className="font-medium text-slate-700">{selectedUser.email}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <label className="text-xs text-slate-600 font-semibold">Contact Person</label>
                  <p className="text-slate-700">{selectedUser.contact_person || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <label className="text-xs text-slate-600 font-semibold">Phone</label>
                  <p className="text-slate-700">{selectedUser.phone || 'N/A'}</p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded">
                  <label className="text-xs text-slate-600 font-semibold">Role</label>
                  <p className="text-lg font-bold capitalize text-slate-900">{selectedUser.role}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <label className="text-xs text-slate-600 font-semibold">Status</label>
                  <div>{getStatusBadge(selectedUser)}</div>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <label className="text-xs text-slate-600 font-semibold">Country</label>
                  <p className="text-slate-700">{selectedUser.country || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Unique Code Section */}
            {selectedUser.role !== 'admin' && (
              <div className={`p-4 rounded-lg border-2 mb-4 ${
                selectedUser.role === 'manufacturer' 
                  ? 'bg-purple-50 border-purple-200' 
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <label className="text-xs font-semibold mb-2 block">🔐 Unique Code</label>
                <p className={`font-mono text-xl font-bold ${
                  selectedUser.role === 'manufacturer' 
                    ? 'text-purple-600' 
                    : 'text-blue-600'
                }`}>
                  {selectedUser.role === 'manufacturer' 
                    ? (selectedUser.manufacturer_code || 'MFR-CODE') 
                    : (selectedUser.buyer_code || 'BYR-CODE')}
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  {selectedUser.role === 'manufacturer' 
                    ? 'Buyers see this code instead of your details' 
                    : 'Manufacturers see this code instead of your details'}
                </p>
              </div>
            )}

            {/* Additional Info */}
            {selectedUser.role !== 'admin' && (
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="p-3 bg-slate-50 rounded">
                  <label className="text-xs text-slate-600 font-semibold">Business Nature</label>
                  <p className="text-slate-700">{selectedUser.business_nature || 'N/A'}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded">
                  <label className="text-xs text-slate-600 font-semibold">Registered Address</label>
                  <p className="text-slate-700">{selectedUser.registered_address || 'N/A'}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-4 border-t">
              <button onClick={() => setShowUserDetailModal(false)} className="flex-1 border py-2 rounded-lg font-semibold hover:bg-slate-50">
                Close
              </button>
              {selectedUser.approval_status === 'pending' && (
                <>
                  <button onClick={() => { approveUser(selectedUser.id); setShowUserDetailModal(false) }} className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700">
                    ✅ Approve
                  </button>
                  <button onClick={() => { setShowUserDetailModal(false); setShowRejectModal(true) }} className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700">
                    ❌ Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  )
}