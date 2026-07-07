'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function InventoryManagement() {
  const [products, setProducts] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'existing' | 'custom'>('existing')
  
  // Existing product mode
  const [selectedProductId, setSelectedProductId] = useState('')
  const [quantity, setQuantity] = useState(0)
  const [details, setDetails] = useState('')
  
  // Custom product mode
  const [customProductName, setCustomProductName] = useState('')
  const [customSku, setCustomSku] = useState('')
  const [customQuantity, setCustomQuantity] = useState(0)
  const [customUnit, setCustomUnit] = useState('pieces')
  const [customDetails, setCustomDetails] = useState('')
  
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
    setLoading(false)
  }

  const selectedProduct = products.find(p => p.id === selectedProductId)

  async function addInventory() {
    if (!selectedProductId) {
      alert('Please select a product')
      return
    }
    if (quantity === 0) {
      alert('Please enter quantity')
      return
    }

    const currentQuantity = selectedProduct.stock_quantity || 0
    const newQuantity = currentQuantity + quantity
    
    const { error } = await supabase
      .from('products')
      .update({ 
        stock_quantity: newQuantity,
        last_restocked: new Date().toISOString().split('T')[0]
      })
      .eq('id', selectedProductId)
    
    if (error) {
      alert('Error: ' + error.message)
      return
    }

    alert(`✅ Added ${quantity} units! Total stock: ${newQuantity}`)
    setQuantity(0)
    setDetails('')
    setSelectedProductId('')
    loadData()
  }

  async function addCustomInventory() {
    if (!customProductName.trim()) {
      alert('Please enter product name')
      return
    }
    if (customQuantity === 0) {
      alert('Please enter quantity')
      return
    }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Create new product entry with manual inventory
    const { data, error } = await supabase
      .from('products')
      .insert({
        manufacturer_id: user.id,
        title: customProductName,
        sku: customSku || `MANUAL-${Date.now()}`,
        stock_quantity: customQuantity,
        unit_of_measure: customUnit,
        category: 'Manual Inventory',
        description: customDetails || 'Added manually from warehouse/godam',
        is_active: true,
        last_restocked: new Date().toISOString().split('T')[0]
      })
      .select()

    if (error) {
      alert('Error: ' + error.message)
      return
    }

    alert(`✅ Added ${customQuantity} units of "${customProductName}" to inventory!`)
    setCustomProductName('')
    setCustomSku('')
    setCustomQuantity(0)
    setCustomUnit('pieces')
    setCustomDetails('')
    setMode('existing')
    loadData()
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">📦 Add Inventory</h1>
            <p className="text-slate-500 text-sm">Manually add existing stock from warehouse/godam</p>
          </div>
          <button onClick={() => router.push('/manufacturer/dashboard')} className="text-slate-600 hover:text-slate-800 text-sm">← Back</button>
        </div>

        {/* Mode Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setMode('existing')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              mode === 'existing'
                ? 'bg-cyan-600 text-white'
                : 'bg-white border-2 border-slate-300 text-slate-600 hover:border-cyan-400'
            }`}
          >
            📦 Select Existing Product
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              mode === 'custom'
                ? 'bg-cyan-600 text-white'
                : 'bg-white border-2 border-slate-300 text-slate-600 hover:border-cyan-400'
            }`}
          >
            ➕ Add Custom Product
          </button>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-2xl border shadow-sm p-8">
          {/* EXISTING PRODUCT MODE */}
          {mode === 'existing' && (
            <>
              {/* Product Selection */}
              <div className="mb-8">
                <label className="block text-lg font-bold mb-3">1. Select Product</label>
                <select
                  value={selectedProductId}
                  onChange={e => {
                    setSelectedProductId(e.target.value)
                    setQuantity(0)
                    setDetails('')
                  }}
                  className="w-full border-2 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                >
                  <option value="">-- Choose a product --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.title} (SKU: {p.sku || 'N/A'}) - Current: {p.stock_quantity || 0} {p.unit_of_measure || 'units'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Info Display */}
              {selectedProduct && (
                <div className="mb-8 p-6 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl border-2 border-cyan-200">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Product Name</p>
                      <p className="text-lg font-bold">{selectedProduct.title}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">SKU</p>
                      <p className="text-lg font-bold">{selectedProduct.sku || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 mb-1">Current Stock</p>
                      <p className="text-lg font-bold text-cyan-600">{selectedProduct.stock_quantity || 0} {selectedProduct.unit_of_measure || 'units'}</p>
                    </div>
                  </div>
                  {selectedProduct.category && (
                    <p className="text-sm text-slate-600 mt-4">Category: <span className="font-semibold">{selectedProduct.category}</span></p>
                  )}
                </div>
              )}

              {/* Add Quantity */}
              {selectedProduct && (
                <>
                  <div className="mb-8">
                    <label className="block text-lg font-bold mb-3">2. Add Quantity</label>
                    <div className="flex items-end gap-4">
                      <div className="flex-1">
                        <input 
                          type="number" 
                          min="0"
                          value={quantity} 
                          onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                          className="w-full border-2 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                          placeholder="Enter quantity to add"
                        />
                        <p className="text-xs text-slate-500 mt-2">Unit: {selectedProduct.unit_of_measure || 'units'}</p>
                      </div>
                      <div className="bg-slate-100 rounded-lg px-4 py-3 font-semibold text-center min-w-[150px]">
                        <p className="text-xs text-slate-600 mb-1">After Adding</p>
                        <p className="text-2xl text-cyan-600">
                          {(selectedProduct.stock_quantity || 0) + quantity}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Add Details/Notes */}
                  <div className="mb-8">
                    <label className="block text-lg font-bold mb-3">3. Add Details (Optional)</label>
                    <textarea
                      value={details}
                      onChange={e => setDetails(e.target.value)}
                      className="w-full border-2 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                      placeholder="e.g., Stock added from Godam A, received from supplier, warehouse inventory check, etc."
                      rows={4}
                    />
                    <p className="text-xs text-slate-500 mt-2">Add any notes about where this stock is from</p>
                  </div>

                  {/* Submit Button */}
                  <div className="flex gap-3 pt-4">
                    <button 
                      onClick={addInventory}
                      className="flex-1 bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700 font-bold text-lg transition"
                    >
                      ✅ Add to Inventory
                    </button>
                    <button 
                      onClick={() => {
                        setSelectedProductId('')
                        setQuantity(0)
                        setDetails('')
                      }}
                      className="flex-1 border-2 border-slate-300 py-3 rounded-lg hover:bg-slate-50 font-bold text-lg transition"
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}

              {!selectedProduct && products.length > 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👆</div>
                  <p className="text-slate-500 text-lg">Select a product to add inventory</p>
                </div>
              )}

              {products.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-slate-500 text-lg">No products found</p>
                  <p className="text-slate-400 text-sm mt-2">Create products first in your catalogue</p>
                </div>
              )}
            </>
          )}

          {/* CUSTOM PRODUCT MODE */}
          {mode === 'custom' && (
            <>
              {/* Product Name */}
              <div className="mb-6">
                <label className="block text-lg font-bold mb-3">Product Name</label>
                <input 
                  type="text" 
                  value={customProductName}
                  onChange={e => setCustomProductName(e.target.value)}
                  className="w-full border-2 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g., Red Fabric Roll, Blue Threads, etc."
                />
              </div>

              {/* SKU */}
              <div className="mb-6">
                <label className="block text-lg font-bold mb-3">SKU (Optional)</label>
                <input 
                  type="text" 
                  value={customSku}
                  onChange={e => setCustomSku(e.target.value)}
                  className="w-full border-2 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g., SKU-001 (leave empty to auto-generate)"
                />
              </div>

              {/* Quantity and Unit */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-lg font-bold mb-3">Quantity</label>
                  <input 
                    type="number" 
                    min="0"
                    value={customQuantity}
                    onChange={e => setCustomQuantity(parseInt(e.target.value) || 0)}
                    className="w-full border-2 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-lg font-bold mb-3">Unit</label>
                  <select 
                    value={customUnit}
                    onChange={e => setCustomUnit(e.target.value)}
                    className="w-full border-2 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  >
                    <option value="pieces">Pieces</option>
                    <option value="kg">Kilograms (kg)</option>
                    <option value="meter">Meters (m)</option>
                    <option value="liter">Liters (L)</option>
                    <option value="carton">Cartons</option>
                    <option value="box">Boxes</option>
                    <option value="bags">Bags</option>
                  </select>
                </div>
              </div>

              {/* Details */}
              <div className="mb-8">
                <label className="block text-lg font-bold mb-3">Details/Notes</label>
                <textarea
                  value={customDetails}
                  onChange={e => setCustomDetails(e.target.value)}
                  className="w-full border-2 rounded-lg px-4 py-3 text-base focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                  placeholder="e.g., Stock from old godam, warehouse check, unregistered inventory, etc."
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={addCustomInventory}
                  className="flex-1 bg-cyan-600 text-white py-3 rounded-lg hover:bg-cyan-700 font-bold text-lg transition"
                >
                  ✅ Add Custom Inventory
                </button>
                <button 
                  onClick={() => {
                    setCustomProductName('')
                    setCustomSku('')
                    setCustomQuantity(0)
                    setCustomUnit('pieces')
                    setCustomDetails('')
                  }}
                  className="flex-1 border-2 border-slate-300 py-3 rounded-lg hover:bg-slate-50 font-bold text-lg transition"
                >
                  Clear
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}