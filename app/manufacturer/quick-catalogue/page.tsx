'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function QuickCataloguePage() {
  const [products, setProducts] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [template, setTemplate] = useState('professional')
  const [generating, setGenerating] = useState(false)
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
    const { data: productsData } = await supabase.from('products').select('*').eq('manufacturer_id', user.id)
    setProducts(productsData || [])
    setLoading(false)
  }

  function toggleProduct(id) {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(p => p !== id))
    } else {
      setSelectedProducts([...selectedProducts, id])
    }
  }

  function selectAll() {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p.id))
    }
  }

  function getSelectedData() {
    return products.filter(p => selectedProducts.includes(p.id))
  }

  function calculateTotal() {
    const selected = getSelectedData()
    return selected.reduce((sum, p) => sum + (p.price_per_unit || 0), 0)
  }

  async function generateCatalogue() {
    const selected = getSelectedData()
    if (selected.length === 0) {
      alert('Please select at least one product')
      return
    }
    setGenerating(true)

    const printWindow = window.open('', '_blank')
    let html = `<!DOCTYPE html>
    <html>
    <head>
      <title>Quick Catalogue - ${profile?.company_name}</title>
      <style>
        body { font-family: 'Arial', sans-serif; padding: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .logo { font-size: 32px; font-weight: bold; color: #0891b2; }
        .buyer-info { background: #f3f4f6; padding: 15px; border-radius: 10px; margin-bottom: 30px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 30px; }
        .product-card { border: 1px solid #ddd; padding: 20px; border-radius: 10px; text-align: center; }
        img { max-width: 150px; max-height: 150px; object-fit: contain; }
        .title { font-size: 18px; font-weight: bold; margin: 10px 0; }
        .price { color: #0891b2; font-size: 20px; font-weight: bold; }
        .specs { font-size: 12px; color: #666; margin-top: 10px; }
        .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        hr { margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Midlync</div>
        <h2>${profile?.company_name}</h2>
        <p>${profile?.address || ''} | ${profile?.email || ''} | GST: ${profile?.gst || ''}</p>
        <hr />
      </div>
      
      <div class="buyer-info">
        <strong>Prepared for:</strong><br/>
        ${buyerName || 'Valued Customer'}<br/>
        ${buyerEmail || ''}
      </div>
      
      <h3>Product Catalogue</h3>
      <div class="grid">`
    
    selected.forEach(p => {
      let images = []
      try { images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []) } catch { images = [] }
      const mainImage = images[0] || p.image_url
      html += `
        <div class="product-card">
          ${mainImage ? `<img src="${mainImage}" />` : '<div style="font-size:50px">📦</div>'}
          <div class="title">${p.title}</div>
          <div class="price">${p.currency === 'INR' ? '₹' : '$'}${p.price_per_unit}</div>
          <div class="specs">
            ${p.moq ? `MOQ: ${p.moq} ${p.moq_unit}<br>` : ''}
            ${p.fabric_type ? `Fabric: ${p.fabric_type}<br>` : ''}
            ${p.lead_time ? `Lead Time: ${p.lead_time}` : ''}
          </div>
          <p style="font-size:12px; margin-top:10px">${p.short_description || p.description?.substring(0, 100) || ''}</p>
        </div>`
    })
    
    html += `
      </div>
      <hr />
      <div class="footer">
        <p>For inquiries, contact: ${profile?.email} | ${profile?.contact_phone || ''}</p>
        <p>Generated on ${new Date().toLocaleDateString()}</p>
      </div>
    </body>
    </html>`
    
    printWindow?.document.write(html)
    printWindow?.document.close()
    printWindow?.print()
    setGenerating(false)
  }

  async function generateQuotation() {
    const selected = getSelectedData()
    if (selected.length === 0) {
      alert('Please select at least one product')
      return
    }
    if (!buyerName) {
      alert('Please enter buyer name')
      return
    }
    setGenerating(true)

    const total = calculateTotal()
    const quoteNo = 'QT-' + Date.now()
    
    const printWindow = window.open('', '_blank')
    let html = `<!DOCTYPE html>
    <html>
    <head>
      <title>Quotation ${quoteNo}</title>
      <style>
        body { font-family: 'Arial', sans-serif; padding: 40px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .company { font-size: 28px; font-weight: bold; color: #0891b2; }
        .quote-title { font-size: 24px; font-weight: bold; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f3f4f6; }
        .total { text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px; }
        .terms { margin-top: 40px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <div class="company">Midlync</div>
          <div>${profile?.company_name}</div>
          <div>${profile?.address || ''}</div>
          <div>GST: ${profile?.gst || ''}</div>
        </div>
        <div>
          <div class="quote-title">QUOTATION</div>
          <div>Quote No: ${quoteNo}</div>
          <div>Date: ${new Date().toLocaleDateString()}</div>
          <div>Valid Till: ${new Date(Date.now() + 15*24*60*60*1000).toLocaleDateString()}</div>
        </div>
      </div>
      
      <div>
        <strong>To:</strong><br/>
        ${buyerName}<br/>
        ${buyerEmail || ''}
      </div>
      
      <table>
        <thead>
          <tr><th>#</th><th>Product</th><th>Description</th><th>Qty</th><th>Unit Price</th><th>Amount</th></tr>
        </thead>
        <tbody>
          ${selected.map((p, i) => `
            <tr>
              <td>${i+1}</td>
              <td>${p.title}</td>
              <td>${p.short_description || p.category || ''}</td>
              <td>1</td>
              <td>${p.currency === 'INR' ? '₹' : '$'}${p.price_per_unit}</td>
              <td>${p.currency === 'INR' ? '₹' : '$'}${p.price_per_unit}</td>
            </tr>
          `).join('')}
        </tbody>
        <tfoot>
          <tr><td colspan="5" style="text-align:right"><strong>Total</strong></td><td><strong>${selected[0]?.currency === 'INR' ? '₹' : '$'}${total}</strong></td></tr>
        </tfoot>
      </table>
      
      <div class="total">
        Amount in Words: ${total} Only
      </div>
      
      <div class="terms">
        <strong>Terms & Conditions:</strong><br/>
        1. Prices are exclusive of GST unless stated otherwise<br/>
        2. Payment terms: 50% advance, 50% before shipment<br/>
        3. Delivery time: ${selected[0]?.lead_time || '15-20 days'} from order confirmation<br/>
        4. This is a system generated quotation
      </div>
    </body>
    </html>`
    
    printWindow?.document.write(html)
    printWindow?.document.close()
    printWindow?.print()
    setGenerating(false)
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">5-Minute Catalogue & Quotation</h1>
            <p className="text-slate-500 text-sm">Quickly generate professional catalogues and quotations</p>
          </div>
          <button onClick={() => router.push('/manufacturer/dashboard')} className="text-slate-600 hover:text-slate-800">← Back</button>
        </div>

        {/* Buyer Details */}
        <div className="bg-white rounded-xl p-5 mb-6 shadow-sm">
          <h2 className="font-semibold mb-3">Buyer Details</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <input type="text" placeholder="Buyer Name *" value={buyerName} onChange={e => setBuyerName(e.target.value)}
              className="border rounded-lg px-4 py-2" />
            <input type="email" placeholder="Buyer Email" value={buyerEmail} onChange={e => setBuyerEmail(e.target.value)}
              className="border rounded-lg px-4 py-2" />
          </div>
        </div>

        {/* Template Selection */}
        <div className="bg-white rounded-xl p-5 mb-6 shadow-sm">
          <h2 className="font-semibold mb-3">Template Style</h2>
          <div className="flex gap-4">
            <label className="flex items-center gap-2">
              <input type="radio" value="professional" checked={template === 'professional'} onChange={() => setTemplate('professional')} />
              Professional
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" value="minimal" checked={template === 'minimal'} onChange={() => setTemplate('minimal')} />
              Minimal
            </label>
            <label className="flex items-center gap-2">
              <input type="radio" value="luxury" checked={template === 'luxury'} onChange={() => setTemplate('luxury')} />
              Luxury
            </label>
          </div>
        </div>

        {/* Product Selection */}
        <div className="bg-white rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold">Select Products</h2>
            <button onClick={selectAll} className="text-sm text-cyan-600 hover:underline">
              {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-60 overflow-y-auto">
            {products.map(p => (
              <label key={p.id} className="flex items-center gap-2 text-sm p-2 border rounded-lg hover:bg-slate-50">
                <input type="checkbox" checked={selectedProducts.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                <span className="truncate">{p.title}</span>
                <span className="text-cyan-600 text-xs ml-auto">${p.price_per_unit}</span>
              </label>
            ))}
          </div>
          {products.length === 0 && <p className="text-slate-400 text-center py-4">No products found. Add products first.</p>}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button onClick={generateCatalogue} disabled={generating || selectedProducts.length === 0}
            className="bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition">
            📄 Generate Catalogue (PDF)
          </button>
          <button onClick={generateQuotation} disabled={generating || selectedProducts.length === 0 || !buyerName}
            className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold disabled:opacity-50 transition">
            💰 Generate Quotation (PDF)
          </button>
        </div>

        {/* Selected Count */}
        <div className="mt-4 text-center text-sm text-slate-500">
          {selectedProducts.length} product(s) selected
        </div>
      </div>
    </div>
  )
}