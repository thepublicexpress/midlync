"use client"
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  // ✅ Fixed: Added proper type annotations
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
    const { data: productsData } = await supabase.from('products').select('*, manufacturer:profiles!manufacturer_id(company_name, email)').order('created_at', { ascending: false })
    setProducts(productsData || [])
    const { data: ordersData } = await supabase.from('orders').select('*, products(title), buyer:profiles!buyer_id(company_name)').order('created_at', { ascending: false })
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
      alert('✅ User approved successfully!')
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

  async function bulkApprove() {
    const pendingIds = pendingApprovals.map((u: any) => u.id)
    if (pendingIds.length === 0) return
    if (!confirm(`Approve ${pendingIds.length} users?`)) return
    
    const { data: { user } } = await supabase.auth.getUser()
    for (const id of pendingIds) {
      await supabase.from('profiles').update({ 
        is_approved: true, 
        approval_status: 'approved', 
        approved_at: new Date().toISOString(),
        approved_by: user?.id
      }).eq('id', id)
    }
    alert(`✅ ${pendingIds.length} users approved!`)
    loadAllData()
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
      alert(`User created! Pending admin approval.`); 
      setShowModal(false); 
      loadAllData(); 
      setForm({ email: '', password: '', role: 'manufacturer', company_name: '' }) 
    }
    setSubmitting(false)
  }

  async function updateUserRole(userId: string, newRole: string) {
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', userId)
    if (error) { alert('Error: ' + error.message) } else { alert(`Role updated`); loadAllData() }
  }

  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Delete user ${email}? This action cannot be undone.`)) return
    const { error } = await supabase.from('profiles').delete().eq('id', userId)
    if (error) { alert('Error: ' + error.message) } else { alert('User deleted'); loadAllData() }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/admin/login')
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

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-red-700 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <Link href="/admin" className="text-2xl font-bold text-white">Midlync Admin</Link>
          <span className="bg-white text-red-700 text-xs px-2 py-1 rounded-full font-bold">ADMIN</span>
        </div>
        <div className="flex items-center gap-4">
          {pendingApprovals.length > 0 && (
            <button onClick={bulkApprove} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm">
              Bulk Approve ({pendingApprovals.length})
            </button>
          )}
          <button onClick={handleLogout} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg">Logout</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-slate-500 text-sm">Manage user approvals, roles, and platform settings</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl">+ Create User</button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border shadow-sm"><div className="text-2xl mb-2">👥</div><div className="text-2xl font-bold">{users.filter((u: any) => u.role !== 'admin').length}</div><div className="text-xs text-slate-500">Total Users</div></div>
          <div className="bg-white rounded-xl p-5 border shadow-sm"><div className="text-2xl mb-2">⏳</div><div className="text-2xl font-bold text-yellow-600">{pendingApprovals.length}</div><div className="text-xs text-slate-500">Pending</div></div>
          <div className="bg-white rounded-xl p-5 border shadow-sm"><div className="text-2xl mb-2">✅</div><div className="text-2xl font-bold text-green-600">{users.filter((u: any) => u.approval_status === 'approved' && u.role !== 'admin').length}</div><div className="text-xs text-slate-500">Approved</div></div>
          <div className="bg-white rounded-xl p-5 border shadow-sm"><div className="text-2xl mb-2">❌</div><div className="text-2xl font-bold text-red-600">{users.filter((u: any) => u.approval_status === 'rejected' && u.role !== 'admin').length}</div><div className="text-xs text-slate-500">Rejected</div></div>
          <div className="bg-white rounded-xl p-5 border shadow-sm"><div className="text-2xl mb-2">🏭</div><div className="text-2xl font-bold">{manufacturers.length}</div><div className="text-xs text-slate-500">Manufacturers</div></div>
          <div className="bg-white rounded-xl p-5 border shadow-sm"><div className="text-2xl mb-2">🛒</div><div className="text-2xl font-bold">{buyers.length}</div><div className="text-xs text-slate-500">Buyers</div></div>
        </div>

        {/* Pending Approvals Highlight */}
        {pendingApprovals.length > 0 && (
          <div className="mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <h2 className="font-semibold text-yellow-800 mb-3 flex items-center gap-2">
              ⏳ Pending Approvals ({pendingApprovals.length})
              <button onClick={bulkApprove} className="bg-green-600 text-white px-3 py-1 rounded text-xs">Approve All</button>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {pendingApprovals.slice(0, 4).map((user: any) => (
                <div key={user.id} className="flex justify-between items-center bg-white p-3 rounded-lg shadow-sm">
                  <div><p className="font-medium">{user.company_name || user.email}</p><p className="text-xs text-slate-500">{user.email} • {user.role}</p></div>
                  <div className="flex gap-2">
                    <button onClick={() => approveUser(user.id)} className="bg-green-600 text-white px-3 py-1 rounded text-xs">Approve</button>
                    <button onClick={() => { setSelectedUser(user); setShowRejectModal(true) }} className="bg-red-600 text-white px-3 py-1 rounded text-xs">Reject</button>
                    <button onClick={() => { setSelectedUser(user); setShowUserDetailModal(true) }} className="bg-blue-600 text-white px-3 py-1 rounded text-xs">View</button>
                  </div>
                </div>
              ))}
            </div>
            {pendingApprovals.length > 4 && <p className="text-center text-sm text-slate-500 mt-3">+{pendingApprovals.length - 4} more pending</p>}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b mb-6">
          <button onClick={() => setActiveTab('pending')} className={`px-6 py-2 font-medium ${activeTab === 'pending' ? 'border-b-2 border-red-600 text-red-600' : 'text-slate-500'}`}>⏳ Pending ({pendingApprovals.length})</button>
          <button onClick={() => setActiveTab('approved')} className={`px-6 py-2 font-medium ${activeTab === 'approved' ? 'border-b-2 border-red-600 text-red-600' : 'text-slate-500'}`}>✅ Approved</button>
          <button onClick={() => setActiveTab('rejected')} className={`px-6 py-2 font-medium ${activeTab === 'rejected' ? 'border-b-2 border-red-600 text-red-600' : 'text-slate-500'}`}>❌ Rejected</button>
          <button onClick={() => setActiveTab('all')} className={`px-6 py-2 font-medium ${activeTab === 'all' ? 'border-b-2 border-red-600 text-red-600' : 'text-slate-500'}`}>📋 All Users</button>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-4">
          <div className="flex-1"><input type="text" placeholder="Search by name or email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full border rounded-lg px-4 py-2" /></div>
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="border rounded-lg px-4 py-2">
            <option value="all">All Roles</option><option value="manufacturer">Manufacturer</option><option value="buyer">Buyer</option>
          </select>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b">
                <tr><th className="p-4 text-left">Company</th><th className="p-4 text-left">Email</th><th className="p-4 text-left">Role</th><th className="p-4 text-left">Status</th><th className="p-4 text-left">Approved At</th><th className="p-4 text-left">Actions</th></tr>
              </thead>
              <tbody>
                {filteredUsers.map((user: any) => (
                  <tr key={user.id} className="border-b hover:bg-slate-50">
                    <td className="p-4 font-medium">{user.company_name || '-'}</td>
                    <td className="p-4">{user.email}</td>
                    <td className="p-4"><select value={user.role} onChange={(e) => updateUserRole(user.id, e.target.value)} className={`px-2 py-1 rounded-full text-xs font-semibold border ${getRoleBadgeClass(user.role)}`}><option value="admin">Admin</option><option value="manufacturer">Manufacturer</option><option value="buyer">Buyer</option></select></td>
                    <td className="p-4">{getStatusBadge(user)}</td>
                    <td className="p-4">{user.approved_at ? new Date(user.approved_at).toLocaleDateString() : '-'}</td>
                    <td className="p-4"><div className="flex gap-2">
                      {user.approval_status === 'pending' && (<><button onClick={() => approveUser(user.id)} className="bg-green-600 text-white px-2 py-1 rounded text-xs">Approve</button><button onClick={() => { setSelectedUser(user); setShowRejectModal(true) }} className="bg-red-600 text-white px-2 py-1 rounded text-xs">Reject</button></>)}
                      <button onClick={() => { setSelectedUser(user); setShowUserDetailModal(true) }} className="bg-blue-600 text-white px-2 py-1 rounded text-xs">View</button>
                      <button onClick={() => deleteUser(user.id, user.email)} className="bg-gray-600 text-white px-2 py-1 rounded text-xs">Delete</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {filteredUsers.length === 0 && <div className="text-center py-12 text-slate-500">No users found</div>}
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Create New User</h2>
            <form onSubmit={createUser} className="space-y-4">
              <input type="text" placeholder="Company Name" required value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} className="w-full border rounded-lg px-4 py-2" />
              <input type="email" placeholder="Email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border rounded-lg px-4 py-2" />
              <input type="password" placeholder="Password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border rounded-lg px-4 py-2" />
              <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="w-full border rounded-lg px-4 py-2">
                <option value="manufacturer">Manufacturer</option><option value="buyer">Buyer</option><option value="admin">Admin</option>
              </select>
              <div className="flex gap-3">
                <button type="submit" disabled={submitting} className="flex-1 bg-red-600 text-white py-2 rounded-lg">{submitting ? 'Creating...' : 'Create User'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowRejectModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Reject User</h2>
            <p className="text-sm text-slate-500 mb-4">User: {selectedUser?.email}</p>
            <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} className="w-full border rounded-lg px-4 py-2 mb-4" placeholder="Reason for rejection..." />
            <div className="flex gap-3">
              <button onClick={rejectUser} className="flex-1 bg-red-600 text-white py-2 rounded-lg">Reject</button>
              <button onClick={() => setShowRejectModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showUserDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowUserDetailModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">User Details</h2><button onClick={() => setShowUserDetailModal(false)} className="text-gray-500">✕</button></div>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-sm text-gray-500">Company Name</label><p className="font-medium">{selectedUser.company_name || '-'}</p></div>
                <div><label className="text-sm text-gray-500">Email</label><p className="font-medium">{selectedUser.email}</p></div>
                <div><label className="text-sm text-gray-500">Role</label><p className="font-medium capitalize">{selectedUser.role}</p></div>
                <div><label className="text-sm text-gray-500">Status</label><p>{getStatusBadge(selectedUser)}</p></div>
                <div><label className="text-sm text-gray-500">Registered On</label><p>{new Date(selectedUser.created_at).toLocaleString()}</p></div>
                {selectedUser.approved_at && <div><label className="text-sm text-gray-500">Approved On</label><p>{new Date(selectedUser.approved_at).toLocaleString()}</p></div>}
                {selectedUser.rejected_reason && <div className="col-span-2"><label className="text-sm text-gray-500">Rejection Reason</label><p className="text-red-600">{selectedUser.rejected_reason}</p></div>}
              </div>
              {selectedUser.approval_status === 'pending' && (
                <div className="flex gap-3 mt-4">
                  <button onClick={() => approveUser(selectedUser.id)} className="flex-1 bg-green-600 text-white py-2 rounded-lg">Approve User</button>
                  <button onClick={() => { setShowUserDetailModal(false); setShowRejectModal(true) }} className="flex-1 bg-red-600 text-white py-2 rounded-lg">Reject User</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}