'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function CataloguePage() {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [selectedProducts, setSelectedProducts] = useState([])
  const [layout, setLayout] = useState('grid')
  const [brandColor, setBrandColor] = useState('#0891b2')
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [exportFormat, setExportFormat] = useState('pdf')
  const [exportColumns, setExportColumns] = useState({
    image: true,
    name: true,
    category: true,
    price: true,
    currency: true,
    moq: true,
    description: true,
    fabric_type: true,
    gsm: true,
    width: true,
    color: true,
    lead_time: true,
    product_link: true
  })
  const [invoiceData, setInvoiceData] = useState({
    buyerName: '',
    buyerCompany: '',
    buyerAddress: '',
    buyerGst: '',
    dueDate: new Date(Date.now() + 15*24*60*60*1000).toISOString().split('T')[0]
  })
  const router = useRouter()
  const supabase = createClient()

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))]

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [searchTerm, selectedCategory, priceRange, products])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(profileData)
    const { data: productsData } = await supabase.from('products').select('*').eq('manufacturer_id', user.id)
    setProducts(productsData || [])
    setFilteredProducts(productsData || [])
    setLoading(false)
  }

  function applyFilters() {
    let filtered = [...products]
    if (searchTerm) {
      filtered = filtered.filter(p => 
        p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    if (selectedCategory && selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory)
    }
    if (priceRange.min) {
      filtered = filtered.filter(p => (p.price_per_unit || 0) >= parseFloat(priceRange.min))
    }
    if (priceRange.max) {
      filtered = filtered.filter(p => (p.price_per_unit || 0) <= parseFloat(priceRange.max))
    }
    setFilteredProducts(filtered)
  }

  function clearFilters() {
    setSearchTerm('')
    setSelectedCategory('')
    setPriceRange({ min: '', max: '' })
  }

  function toggleProductSelection(id) {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(p => p !== id))
    } else {
      setSelectedProducts([...selectedProducts, id])
    }
  }

  function selectAll() {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
  }

  function getSelectedProductsData() {
    return filteredProducts.filter(p => selectedProducts.includes(p.id))
  }

  function calculateTotal() {
    const selected = getSelectedProductsData()
    return selected.reduce((sum, p) => sum + (p.price_per_unit || 0), 0)
  }

  function getImageUrl(product) {
    let images = []
    try { images = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []) } catch { images = [] }
    return images[0] || product.image_url || ''
  }

  function exportWithOptions() {
    const data = selectedProducts.length > 0 ? getSelectedProductsData() : filteredProducts
    const currency = data[0]?.currency === 'INR' ? '₹' : '$'
    
    if (exportFormat === 'pdf') {
      exportPDF(data, currency)
    } else if (exportFormat === 'excel') {
      exportExcel(data, currency)
    } else if (exportFormat === 'ppt') {
      exportPowerPoint(data, currency)
    }
    setShowExportOptions(false)
  }

  function exportPDF(data, currency) {
    const html = getExportHTML(data, currency)
    const printWindow = window.open('', '_blank')
    printWindow?.document.write(html)
    printWindow?.document.close()
    printWindow?.print()
  }

  function exportExcel(data, currency) {
    const html = getExportHTML(data, currency)
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${profile?.company_name}_catalogue.xls`
    a.click()
    URL.revokeObjectURL(url)
  }

  function exportPowerPoint(data, currency) {
    let slidesHTML = ''
    for (let i = 0; i < data.length; i += 4) {
      const slideProducts = data.slice(i, i + 4)
      slidesHTML += `
        <div class="slide">
          <div class="slide-header">
            <div class="logo">Midlync</div>
            <div class="company">${profile?.company_name}</div>
          </div>
          <h2>Products</h2>
          <div class="grid">
            ${slideProducts.map(p => `
              <div class="card">
                ${exportColumns.image ? `<img src="${getImageUrl(p)}" style="max-height:100px" />` : ''}
                <h3>${p.title}</h3>
                <p>${currency}${p.price_per_unit}</p>
              </div>
            `).join('')}
          </div>
        </div>
      `
    }
    const html = `<!DOCTYPE html><html><head><style>
      .slide { page-break-after: always; padding: 20px; }
      .grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 20px; }
      .card { border:1px solid #ddd; padding: 15px; text-align:center; }
    </style></head><body>${slidesHTML}</body></html>`
    const blob = new Blob([html], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${profile?.company_name}_catalogue.pptx`
    a.click()
    URL.revokeObjectURL(url)
  }

  function getExportHTML(data, currency) {
    return `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${profile?.company_name} - Catalogue</title>
      <style>
        body { font-family: Arial; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: ${brandColor}; color: white; }
        img { width: 60px; height: 60px; object-fit: contain; }
      </style>
    </head>
    <body>
      <div class="header">
        <h2>${profile?.company_name}</h2>
        <p>Product Catalogue - ${new Date().toLocaleDateString()}</p>
      </div>
      <table>
        <thead><tr>
          ${exportColumns.image ? '<th>Image</th>' : ''}
          ${exportColumns.name ? '<th>Name</th>' : ''}
          ${exportColumns.category ? '<th>Category</th>' : ''}
          ${exportColumns.price ? '<th>Price</th>' : ''}
          ${exportColumns.moq ? '<th>MOQ</th>' : ''}
          ${exportColumns.description ? '<th>Description</th>' : ''}
        </tr></thead>
        <tbody>
          ${data.map(p => `<tr>
            ${exportColumns.image ? `<td>${getImageUrl(p) ? `<img src="${getImageUrl(p)}" />` : '📦'}</td>` : ''}
            ${exportColumns.name ? `<td>${p.title}</td>` : ''}
            ${exportColumns.category ? `<td>${p.category || '-'}</td>` : ''}
            ${exportColumns.price ? `<td>${currency}${p.price_per_unit || 0}</td>` : ''}
            ${exportColumns.moq ? `<td>${p.moq || '-'}</td>` : ''}
            ${exportColumns.description ? `<td>${p.description?.substring(0,100) || '-'}</td>` : ''}
          </tr>`).join('')}
        </tbody>
      </table>
    </body>
    </html>`
  }

  function printInvoice() {
    const selected = getSelectedProductsData()
    const total = calculateTotal()
    const currency = selected[0]?.currency === 'INR' ? '₹' : '$'
    const invoiceNo = 'INV-' + Date.now()
    
    const printWindow = window.open('', '_blank')
    printWindow?.document.write(`
      <!DOCTYPE html>
      <html>
      <head><title>Invoice ${invoiceNo}</title>
      <style>
        body { font-family: Arial; padding: 40px; }
        .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
        .company { font-size: 28px; font-weight: bold; color: ${brandColor}; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
        th { background: #f3f4f6; }
        .total { text-align: right; font-size: 18px; font-weight: bold; }
      </style>
      </head>
      <body>
        <div class="header">
          <div><div class="company">Midlync</div><div>${profile?.company_name}</div></div>
          <div><div>Invoice No: ${invoiceNo}</div><div>Date: ${new Date().toLocaleDateString()}</div></div>
        </div>
        <div><strong>Bill To:</strong><br/>${invoiceData.buyerCompany || invoiceData.buyerName}<br/>${invoiceData.buyerAddress}</div>
        <table><thead><tr><th>#</th><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
        <tbody>${selected.map((p, i) => `<tr><td>${i+1}</td><td>${p.title}</td><td>1</td><td>${currency}${p.price_per_unit}</td><td>${currency}${p.price_per_unit}</td></tr>`).join('')}</tbody>
        <tfoot><tr><td colspan="4" style="text-align:right"><strong>Total</strong></td><td><strong>${currency}${total}</strong></td></tr></tfoot>
        </table>
        <div class="footer"><p>Thank you for your business!</p></div>
      </body>
      </html>
    `)
    printWindow?.document.close()
    printWindow?.print()
  }

  if (loading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">📁 Catalogue Studio</h1>
            <p className="text-slate-500 text-sm">Create and export product catalogues</p>
          </div>
          <div className="flex gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1 border">
              <span className="text-sm">Color:</span>
              <input type="color" value={brandColor} onChange={e => setBrandColor(e.target.value)} className="w-8 h-8 rounded cursor-pointer" />
            </div>
            <button onClick={() => setLayout('grid')} className={`px-3 py-2 rounded ${layout === 'grid' ? 'bg-cyan-600 text-white' : 'bg-white border'}`}>Grid</button>
            <button onClick={() => setLayout('list')} className={`px-3 py-2 rounded ${layout === 'list' ? 'bg-cyan-600 text-white' : 'bg-white border'}`}>List</button>
            <button onClick={() => setShowExportOptions(true)} className="bg-cyan-600 text-white px-4 py-2 rounded-lg">📤 Export</button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <h3 className="font-semibold mb-3">Search</h3>
              <input type="text" placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <h3 className="font-semibold mb-3">Categories</h3>
              <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm border">
              <h3 className="font-semibold mb-3">Price Range</h3>
              <input type="number" placeholder="Min" value={priceRange.min} onChange={e => setPriceRange({...priceRange, min: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm mb-2" />
              <input type="number" placeholder="Max" value={priceRange.max} onChange={e => setPriceRange({...priceRange, max: e.target.value})} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>
            <button onClick={clearFilters} className="w-full bg-red-50 text-red-600 py-2 rounded-lg text-sm">Clear All</button>
          </div>

          {/* Products */}
          <div className="flex-1">
            <div className="bg-white rounded-xl p-4 mb-4 shadow-sm border flex justify-between items-center">
              <label className="flex items-center gap-2">
                <input type="checkbox" checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0} onChange={selectAll} />
                <span>Select All ({filteredProducts.length})</span>
              </label>
              {selectedProducts.length > 0 && (
                <button onClick={() => setShowInvoiceModal(true)} className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-sm">
                  Invoice ({selectedProducts.length})
                </button>
              )}
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center border">
                <div className="text-6xl mb-4">🔍</div>
                <p>No products found</p>
              </div>
            ) : layout === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredProducts.map(p => {
                  const mainImage = getImageUrl(p)
                  return (
                    <div key={p.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                      <div className="relative">
                        <input type="checkbox" checked={selectedProducts.includes(p.id)} onChange={() => toggleProductSelection(p.id)} className="absolute top-2 left-2 z-10" />
                        <div className="aspect-square bg-slate-50 flex items-center justify-center">
                          {mainImage ? <img src={mainImage} className="w-full h-full object-contain p-4" /> : <span className="text-5xl">📦</span>}
                        </div>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold">{p.title}</h3>
                        <div className="text-cyan-600 font-bold">${p.price_per_unit}</div>
                        <button onClick={() => window.open(`/products/${p.id}`, '_blank')} className="w-full mt-3 bg-cyan-600 text-white py-1 rounded text-sm">View</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProducts.map(p => {
                  const mainImage = getImageUrl(p)
                  return (
                    <div key={p.id} className="bg-white rounded-xl border p-4 flex items-center gap-4">
                      <input type="checkbox" checked={selectedProducts.includes(p.id)} onChange={() => toggleProductSelection(p.id)} />
                      <div className="w-16 h-16 bg-slate-50 rounded flex items-center justify-center">
                        {mainImage ? <img src={mainImage} className="w-full h-full object-contain p-2" /> : <span>📦</span>}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{p.title}</h3>
                        <p className="text-sm text-slate-500">{p.category || ''}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-cyan-600 font-bold">${p.price_per_unit}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {showExportOptions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowExportOptions(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Export Catalogue</h2>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Format</h3>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 p-3 border rounded-lg flex-1"><input type="radio" name="format" checked={exportFormat === 'pdf'} onChange={() => setExportFormat('pdf')} /> PDF</label>
                <label className="flex items-center gap-2 p-3 border rounded-lg flex-1"><input type="radio" name="format" checked={exportFormat === 'excel'} onChange={() => setExportFormat('excel')} /> Excel</label>
                <label className="flex items-center gap-2 p-3 border rounded-lg flex-1"><input type="radio" name="format" checked={exportFormat === 'ppt'} onChange={() => setExportFormat('ppt')} /> PowerPoint</label>
              </div>
            </div>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Fields</h3>
              <div className="grid grid-cols-2 gap-2">
                <label><input type="checkbox" checked={exportColumns.image} onChange={e => setExportColumns({...exportColumns, image: e.target.checked})} /> Image</label>
                <label><input type="checkbox" checked={exportColumns.name} onChange={e => setExportColumns({...exportColumns, name: e.target.checked})} /> Name</label>
                <label><input type="checkbox" checked={exportColumns.category} onChange={e => setExportColumns({...exportColumns, category: e.target.checked})} /> Category</label>
                <label><input type="checkbox" checked={exportColumns.price} onChange={e => setExportColumns({...exportColumns, price: e.target.checked})} /> Price</label>
                <label><input type="checkbox" checked={exportColumns.moq} onChange={e => setExportColumns({...exportColumns, moq: e.target.checked})} /> MOQ</label>
                <label><input type="checkbox" checked={exportColumns.description} onChange={e => setExportColumns({...exportColumns, description: e.target.checked})} /> Description</label>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={exportWithOptions} className="flex-1 bg-cyan-600 text-white py-2 rounded-lg">Export</button>
              <button onClick={() => setShowExportOptions(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowInvoiceModal(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">Generate Invoice</h2>
            <div className="space-y-3">
              <input type="text" placeholder="Buyer Name" value={invoiceData.buyerName} onChange={e => setInvoiceData({...invoiceData, buyerName: e.target.value})} className="w-full border rounded-lg p-2" />
              <input type="text" placeholder="Company" value={invoiceData.buyerCompany} onChange={e => setInvoiceData({...invoiceData, buyerCompany: e.target.value})} className="w-full border rounded-lg p-2" />
              <textarea placeholder="Address" rows={2} value={invoiceData.buyerAddress} onChange={e => setInvoiceData({...invoiceData, buyerAddress: e.target.value})} className="w-full border rounded-lg p-2" />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={printInvoice} className="flex-1 bg-indigo-600 text-white py-2 rounded-lg">Generate</button>
              <button onClick={() => setShowInvoiceModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}