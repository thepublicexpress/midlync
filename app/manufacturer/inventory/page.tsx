'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function InventoryManagement() {
  const [products, setProducts] = useState([])
  const [lowStockProducts, setLowStockProducts] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showStockModal, setShowStockModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [stockForm, setStockForm] = useState({ quantity: 0, reason: '', type: 'add' })
  const [showThresholdModal, setShowThresholdModal] = useState(false)
  const [thresholdForm, setThresholdForm] = useState({ threshold: 10, reorder_qty: 0 })
  const [transactions, setTransactions] = useState([])
  const [showTransactions, setShowTransactions] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
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
    
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('manufacturer_id', user.id)
      .order('created_at', { ascending: false })
    
    setProducts(productsData || [])
    
    // Check low stock products
    const lowStock = (productsData || []).filter(p => 
      p.stock_quantity <= p.low_stock_threshold && p.stock_quantity > 0
    )
    setLowStockProducts(lowStock)
    
    setLoading(false)
  }

  async function loadTransactions(productId: string) {
    const { data } = await supabase
      .from('inventory_transactions')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false })
      .limit(20)
    
    setTransactions(data || [])
    setShowTransactions(true)
  }

  async function updateStock(product: any) {
    const { data: { user } } = await supabase.auth.getUser()
    let newQuantity = product.stock_quantity
    
    if (stockForm.type === 'add') {
      newQuantity = product.stock_quantity + stockForm.quantity
    } else if (stockForm.type === 'remove') {
      if (stockForm.quantity > product.stock_quantity) {
        alert('Cannot remove more than available stock!')
        return
      }
      newQuantity = product.stock_quantity - stockForm.quantity
    } else if (stockForm.type === 'set') {
      newQuantity = stockForm.quantity
    }
    
    // Update product stock
    const { error } = await supabase
      .from('products')
      .update({ 
        stock_quantity: newQuantity,
        last_restocked: stockForm.type === 'add' ? new Date().toISOString().split('T')[0] : undefined,
        is_low_stock: newQuantity <= product.low_stock_threshold
      })
      .eq('id', product.id)
    
    if (error) {
      alert('Error: ' + error.message)
      return
    }
    
    // Record transaction
    await supabase.from('inventory_transactions').insert({
      product_id: product.id,
      type: stockForm.type,
      quantity: stockForm.quantity,
      previous_quantity: product.stock_quantity,
      new_quantity: newQuantity,
      reason: stockForm.reason || `${stockForm.type === 'add' ? 'Stock added' : 'Stock removed'}`,
      created_by: user.id
    })
    
    // Create notification if low stock
    if (newQuantity <= product.low_stock_threshold && newQuantity > 0) {
      await supabase.from('notifications').insert({
        user_id: user.id,
        title: '⚠️ Low Stock Alert',
        message: `${product.title} stock is low (${newQuantity} ${product.unit_of_measure} remaining). Threshold: ${product.low_stock_threshold}`,
        type: 'stock',
        is_read: false
      })
    }
    
    alert(`Stock updated successfully! New stock: ${newQuantity}`)
    setShowStockModal(false)
    setStockForm({ quantity: 0, reason: '', type: 'add' })
    loadData()
  }

  async function updateThreshold(product: any) {
    const { error } = await supabase
      .from('products')
      .update({ 
        low_stock_threshold: thresholdForm.threshold,
        reorder_quantity: thresholdForm.reorder_qty
      })
      .eq('id', product.id)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Threshold updated successfully!')
      setShowThresholdModal(false)
      loadData()
    }
  }

  const getStockStatus = (product: any) => {
    if (product.stock_quantity === 0) return { text: 'Out of Stock', color: 'bg-red-100 text-red-700', icon: '❌' }
    if (product.stock_quantity <= product.low_stock_threshold) return { text: 'Low Stock', color: 'bg-yellow-100 text-yellow-700', icon: '⚠️' }
    return { text: 'In Stock', color: 'bg-green-100 text-green-700', icon: '✅' }
  }

  const filteredProducts = products.filter(p => {
    if (filterStatus === 'low') return p.stock_quantity <= p.low_stock_threshold
    if (filterStatus === 'out') return p.stock_quantity === 0
    if (filterStatus === 'in') return p.stock_quantity > p.low_stock_threshold
    return true
  })

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">📦 Inventory Management</h1>
            <p className="text-slate-500 text-sm">Track stock levels and manage inventory</p>
          </div>
          <button onClick={() => router.push('/manufacturer/dashboard')} className="text-slate-600 hover:text-slate-800">← Back</button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="text-2xl mb-2">📦</div>
            <div className="text-2xl font-bold">{products.length}</div>
            <div className="text-xs text-slate-500">Total Products</div>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="text-2xl mb-2">⚠️</div>
            <div className="text-2xl font-bold text-yellow-600">{lowStockProducts.length}</div>
            <div className="text-xs text-slate-500">Low Stock Items</div>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="text-2xl mb-2">❌</div>
            <div className="text-2xl font-bold text-red-600">{products.filter(p => p.stock_quantity === 0).length}</div>
            <div className="text-xs text-slate-500">Out of Stock</div>
          </div>
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-2xl font-bold text-green-600">{products.filter(p => p.stock_quantity > p.low_stock_threshold).length}</div>
            <div className="text-xs text-slate-500">In Stock</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setFilterStatus('all')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === 'all' ? 'bg-cyan-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>All Products</button>
          <button onClick={() => setFilterStatus('low')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === 'low' ? 'bg-yellow-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>⚠️ Low Stock</button>
          <button onClick={() => setFilterStatus('out')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === 'out' ? 'bg-red-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>❌ Out of Stock</button>
          <button onClick={() => setFilterStatus('in')} className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filterStatus === 'in' ? 'bg-green-600 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'}`}>✅ In Stock</button>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-semibold">Product</th>
                  <th className="text-left p-4 text-sm font-semibold">Category</th>
                  <th className="text-left p-4 text-sm font-semibold">Current Stock</th>
                  <th className="text-left p-4 text-sm font-semibold">Unit</th>
                  <th className="text-left p-4 text-sm font-semibold">Threshold</th>
                  <th className="text-left p-4 text-sm font-semibold">Status</th>
                  <th className="text-left p-4 text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map(product => {
                  const stockStatus = getStockStatus(product)
                  return (
                    <tr key={product.id} className="border-b hover:bg-slate-50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{product.title}</p>
                          <p className="text-xs text-slate-500">SKU: {product.sku || 'N/A'}</p>
                        </div>
                      </td>
                      <td className="p-4 text-sm">{product.category || '-'}</td>
                      <td className="p-4">
                        <span className={`font-semibold ${stockStatus.color.split(' ')[1]}`}>
                          {product.stock_quantity || 0}
                        </span>
                      </td>
                      <td className="p-4 text-sm">{product.unit_of_measure || 'pieces'}</td>
                      <td className="p-4 text-sm">{product.low_stock_threshold || 10}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${stockStatus.color}`}>
                          {stockStatus.icon} {stockStatus.text}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button onClick={() => { setSelectedProduct(product); setShowStockModal(true); setStockForm({ quantity: 0, reason: '', type: 'add' }) }} className="text-cyan-600 text-sm hover:underline">Update Stock</button>
                          <button onClick={() => { setSelectedProduct(product); setThresholdForm({ threshold: product.low_stock_threshold || 10, reorder_qty: product.reorder_quantity || 0 }); setShowThresholdModal(true) }} className="text-blue-600 text-sm hover:underline">Set Threshold</button>
                          <button onClick={() => loadTransactions(product.id)} className="text-green-600 text-sm hover:underline">History</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredProducts.length === 0 && (
          <div className="bg-white rounded-2xl p-16 text-center border mt-8">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-slate-500">No products found</p>
          </div>
        )}
      </div>

      {/* Update Stock Modal */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowStockModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Update Stock - {selectedProduct.title}</h2>
            <p className="text-sm text-slate-500 mb-4">Current Stock: {selectedProduct.stock_quantity || 0} {selectedProduct.unit_of_measure}</p>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Operation Type</label>
              <select value={stockForm.type} onChange={e => setStockForm({...stockForm, type: e.target.value})} className="w-full border rounded-lg px-4 py-2">
                <option value="add">➕ Add Stock</option>
                <option value="remove">➖ Remove Stock</option>
                <option value="set">📝 Set Exact Quantity</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Quantity</label>
              <input type="number" min="0" value={stockForm.quantity} onChange={e => setStockForm({...stockForm, quantity: parseInt(e.target.value) || 0})} className="w-full border rounded-lg px-4 py-2" />
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Reason / Notes</label>
              <input type="text" value={stockForm.reason} onChange={e => setStockForm({...stockForm, reason: e.target.value})} className="w-full border rounded-lg px-4 py-2" placeholder="e.g., Received from supplier, Damaged, etc." />
            </div>
            
            <div className="flex gap-3 pt-4">
              <button onClick={() => updateStock(selectedProduct)} className="flex-1 bg-cyan-600 text-white py-2 rounded-lg">Update Stock</button>
              <button onClick={() => setShowStockModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Set Threshold Modal */}
      {showThresholdModal && selectedProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowThresholdModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Set Low Stock Alert - {selectedProduct.title}</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Low Stock Threshold</label>
              <input type="number" min="0" value={thresholdForm.threshold} onChange={e => setThresholdForm({...thresholdForm, threshold: parseInt(e.target.value) || 0})} className="w-full border rounded-lg px-4 py-2" />
              <p className="text-xs text-slate-400 mt-1">Alert when stock falls below this number</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">Reorder Quantity</label>
              <input type="number" min="0" value={thresholdForm.reorder_qty} onChange={e => setThresholdForm({...thresholdForm, reorder_qty: parseInt(e.target.value) || 0})} className="w-full border rounded-lg px-4 py-2" />
              <p className="text-xs text-slate-400 mt-1">Quantity to reorder when low stock alert triggers</p>
            </div>
            
            <div className="flex gap-3 pt-4">
              <button onClick={() => updateThreshold(selectedProduct)} className="flex-1 bg-cyan-600 text-white py-2 rounded-lg">Save Settings</button>
              <button onClick={() => setShowThresholdModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Transactions History Modal */}
      {showTransactions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowTransactions(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Inventory Transaction History</h2>
            {transactions.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No transactions recorded</p>
            ) : (
              <div className="space-y-3">
                {transactions.map(t => (
                  <div key={t.id} className="border-b pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`font-semibold text-sm ${
                          t.type === 'add' ? 'text-green-600' : t.type === 'remove' ? 'text-red-600' : 'text-blue-600'
                        }`}>
                          {t.type === 'add' ? '➕ Added' : t.type === 'remove' ? '➖ Removed' : '📝 Set to'}
                        </span>
                        <span className="text-sm ml-2">{Math.abs(t.quantity)} units</span>
                      </div>
                      <span className="text-xs text-slate-400">{new Date(t.created_at).toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">From {t.previous_quantity} → {t.new_quantity}</p>
                    {t.reason && <p className="text-xs text-slate-400 mt-1">Reason: {t.reason}</p>}
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowTransactions(false)} className="w-full mt-4 bg-cyan-600 text-white py-2 rounded-lg">Close</button>
          </div>
        </div>
      )}
    </div>
  )
}