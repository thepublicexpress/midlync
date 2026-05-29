'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import * as XLSX from 'xlsx'

export default function TradeFairReportPage() {
  const [products, setProducts] = useState([])
  const [filteredProducts, setFilteredProducts] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProducts, setSelectedProducts] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [exportFormat, setExportFormat] = useState('pdf')
  const [exporting, setExporting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [reportOptions, setReportOptions] = useState({
    includeQR: true,
    showPrices: true,
    showSpecifications: true,
    showImages: true,
    showDescription: true,
    showMOQ: true,
    showCategory: true,
    showSKU: true,
    showLeadTime: true,
    showStock: true
  })

  useEffect(() => {
    loadProducts()
  }, [])

  useEffect(() => {
    const filtered = products.filter(p => 
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    setFilteredProducts(filtered)
    setSelectedProducts([])
    setSelectAll(false)
  }, [searchTerm, products])

  async function loadProducts() {
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
    setFilteredProducts(productsData || [])
    setLoading(false)
  }

  function toggleProductSelection(productId) {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
      setSelectAll(false)
    } else {
      setSelectedProducts([...selectedProducts, productId])
      if (selectedProducts.length + 1 === filteredProducts.length) {
        setSelectAll(true)
      }
    }
  }

  function toggleSelectAll() {
    if (selectAll) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id))
    }
    setSelectAll(!selectAll)
  }

  function getImageUrl(product) {
    let images = []
    try { images = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []) } catch { images = [] }
    return images[0] || product.image_url || ''
  }

  function getProductData() {
    return selectedProducts.length > 0 
      ? products.filter(p => selectedProducts.includes(p.id))
      : filteredProducts
  }

  // Generate HTML for PDF/Print
  function generatePDFHTML() {
    const data = getProductData()
    const currency = data[0]?.currency === 'INR' ? '₹' : '$'
    
    return `<!DOCTYPE html>
    <html>
    <head>
      <title>Trade Fair Report - ${profile?.company_name}</title>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: white; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #0891b2; padding-bottom: 20px; }
        .logo { font-size: 32px; font-weight: bold; color: #0891b2; }
        .company { font-size: 24px; margin: 10px 0; }
        .report-title { font-size: 20px; color: #333; }
        .date { color: #666; margin-top: 10px; }
        .product-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 25px; margin-top: 30px; }
        .product-card { border: 1px solid #ddd; border-radius: 12px; padding: 20px; page-break-inside: avoid; background: white; }
        .product-image { height: 180px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; background: #f8f9fa; border-radius: 8px; }
        .product-image img { max-width: 100%; max-height: 150px; object-fit: contain; }
        .product-title { font-size: 18px; font-weight: bold; margin-bottom: 8px; color: #1e293b; }
        .product-price { font-size: 22px; font-weight: bold; color: #0891b2; margin: 10px 0; }
        .product-specs { font-size: 12px; color: #666; margin: 5px 0; line-height: 1.5; }
        .product-description { font-size: 12px; color: #555; margin-top: 10px; line-height: 1.4; }
        .qr-code { margin-top: 15px; text-align: center; padding-top: 10px; border-top: 1px solid #eee; }
        .qr-code img { width: 80px; height: 80px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 11px; color: #999; }
        @media print {
          .product-card { break-inside: avoid; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">Midlync</div>
        <div class="company">${profile?.company_name}</div>
        <div class="report-title">Trade Fair Product Catalogue</div>
        <div class="date">Generated: ${new Date().toLocaleString()}</div>
        <div>Total Products: ${data.length}</div>
      </div>
      <div class="product-grid">
        ${data.map(p => {
          const imageUrl = getImageUrl(p)
          const productUrl = `${window.location.origin}/products/${p.id}`
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(productUrl)}`
          return `
            <div class="product-card">
              ${reportOptions.showImages ? `<div class="product-image">${imageUrl ? `<img src="${imageUrl}" />` : '<span style="font-size: 50px;">📦</span>'}</div>` : ''}
              <div class="product-title">${p.title}</div>
              ${reportOptions.showPrices ? `<div class="product-price">${currency}${p.price_per_unit || 0}</div>` : ''}
              ${reportOptions.showSpecifications ? `<div class="product-specs">${p.fabric_type ? `🧵 Material: ${p.fabric_type}<br>` : ''}${p.gsm ? `⚖️ GSM: ${p.gsm}<br>` : ''}${p.width ? `📏 Width: ${p.width}<br>` : ''}${p.color ? `🎨 Color: ${p.color}<br>` : ''}</div>` : ''}
              ${reportOptions.showSKU && p.sku ? `<div class="product-specs">🔢 SKU: ${p.sku}</div>` : ''}
              ${reportOptions.showMOQ && p.moq ? `<div class="product-specs">📦 MOQ: ${p.moq} ${p.moq_unit || 'pieces'}</div>` : ''}
              ${reportOptions.showLeadTime && p.lead_time ? `<div class="product-specs">⏱️ Lead Time: ${p.lead_time}</div>` : ''}
              ${reportOptions.showStock && p.stock_quantity !== undefined ? `<div class="product-specs">📊 Stock: ${p.stock_quantity} ${p.unit_of_measure || 'units'}</div>` : ''}
              ${reportOptions.showCategory && p.category ? `<div class="product-specs">📂 Category: ${p.category}</div>` : ''}
              ${reportOptions.showDescription && p.description ? `<div class="product-description">📝 ${p.description.substring(0, 150)}${p.description.length > 150 ? '...' : ''}</div>` : ''}
              ${reportOptions.includeQR ? `<div class="qr-code"><img src="${qrCodeUrl}" /><br><span style="font-size: 10px;">Scan to view</span></div>` : ''}
            </div>
          `
        }).join('')}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Midlync - B2B Manufacturing Platform</p>
        <p>Contact: ${profile?.email} | ${profile?.contact_phone || ''}</p>
      </div>
    </body>
    </html>`
  }

  // Professional Excel Export with Images
  async function exportToExcel() {
    setExporting(true)
    const data = getProductData()
    const currency = data[0]?.currency === 'INR' ? '₹' : '$'
    
    // Create HTML table for Excel with images
    let html = `<!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Trade Fair Report - ${profile?.company_name}</title>
      <style>
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; vertical-align: top; }
        th { background: #0891b2; color: white; font-weight: bold; }
        tr:nth-child(even) { background: #f9f9f9; }
        .product-image { width: 100px; height: 100px; object-fit: contain; }
        .qr-code { width: 60px; height: 60px; }
      </style>
    </head>
    <body>
      <h2>${profile?.company_name} - Trade Fair Product Catalogue</h2>
      <p>Generated on: ${new Date().toLocaleString()}</p>
      <p>Total Products: ${data.length}</p>
      <tr>
        <thead>
          <tr>
            ${reportOptions.showImages ? '<th>Product Image</th>' : ''}
            <th>Product Name</th>
            ${reportOptions.showCategory ? '<th>Category</th>' : ''}
            ${reportOptions.showSKU ? '<th>SKU</th>' : ''}
            ${reportOptions.showPrices ? '<th>Price</th>' : ''}
            ${reportOptions.showMOQ ? '<th>MOQ</th>' : ''}
            ${reportOptions.showSpecifications ? '<th>Material</th><th>GSM</th><th>Width</th><th>Color</th>' : ''}
            ${reportOptions.showLeadTime ? '<th>Lead Time</th>' : ''}
            ${reportOptions.showStock ? '<th>Stock</th>' : ''}
            ${reportOptions.showDescription ? '<th>Description</th>' : ''}
            ${reportOptions.includeQR ? '<th>QR Code</th>' : ''}
            <th>Product Link</th>
          </tr>
        </thead>
        <tbody>
          ${data.map(p => {
            const imageUrl = getImageUrl(p)
            const productUrl = `${window.location.origin}/products/${p.id}`
            const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(productUrl)}`
            return `
              <tr>
                ${reportOptions.showImages ? `<td>${imageUrl ? `<img src="${imageUrl}" class="product-image" />` : '📦'}</td>` : ''}
                <td><strong>${p.title}</strong></td>
                ${reportOptions.showCategory ? `<td>${p.category || '-'}</td>` : ''}
                ${reportOptions.showSKU ? `<td>${p.sku || '-'}</td>` : ''}
                ${reportOptions.showPrices ? `<td style="color: #0891b2; font-weight: bold;">${currency}${p.price_per_unit || 0}</td>` : ''}
                ${reportOptions.showMOQ ? `<td>${p.moq || '-'}</td>` : ''}
                ${reportOptions.showSpecifications ? `
                  <td>${p.fabric_type || '-'}</td>
                  <td>${p.gsm || '-'}</td>
                  <td>${p.width || '-'}</td>
                  <td>${p.color || '-'}</td>
                ` : ''}
                ${reportOptions.showLeadTime ? `<td>${p.lead_time || '-'}</td>` : ''}
                ${reportOptions.showStock ? `<td>${p.stock_quantity || 0}</td>` : ''}
                ${reportOptions.showDescription ? `<td>${p.description?.substring(0, 200) || '-'}</td>` : ''}
                ${reportOptions.includeQR ? `<td><img src="${qrCodeUrl}" class="qr-code" /></td>` : ''}
                <td><a href="${productUrl}">View Product</a></td>
              </tr>
            `
          }).join('')}
        </tbody>
      </table>
      <p style="margin-top: 30px; font-size: 11px; color: #666;">© ${new Date().getFullYear()} Midlync - B2B Platform</p>
    </body>
    </html>`
    
    const blob = new Blob([html], { type: 'application/vnd.ms-excel' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trade_fair_report_${profile?.company_name}_${new Date().toISOString().slice(0,10)}.xls`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  // Export to PowerPoint
  function exportToPowerPoint() {
    setExporting(true)
    const data = getProductData()
    const currency = data[0]?.currency === 'INR' ? '₹' : '$'
    
    let slidesHTML = ''
    for (let i = 0; i < data.length; i += 4) {
      const slideProducts = data.slice(i, i + 4)
      slidesHTML += `
        <div class="slide">
          <div class="slide-header">
            <div class="logo">Midlync</div>
            <div class="company">${profile?.company_name}</div>
            <div class="date">${new Date().toLocaleDateString()}</div>
          </div>
          <h2 class="slide-title">Trade Fair Catalogue (Page ${Math.floor(i/4) + 1})</h2>
          <div class="product-grid">
            ${slideProducts.map(p => {
              const imageUrl = getImageUrl(p)
              const productUrl = `${window.location.origin}/products/${p.id}`
              const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(productUrl)}`
              return `
                <div class="product-card">
                  ${reportOptions.showImages ? `<div class="product-image">${imageUrl ? `<img src="${imageUrl}" />` : '📦'}</div>` : ''}
                  <h3 class="product-title">${p.title}</h3>
                  ${reportOptions.showPrices ? `<div class="product-price">${currency}${p.price_per_unit || 0}</div>` : ''}
                  ${reportOptions.showSpecifications ? `<div class="product-specs">${p.fabric_type ? `${p.fabric_type}` : ''}${p.gsm ? ` | ${p.gsm} GSM` : ''}</div>` : ''}
                  ${reportOptions.showMOQ && p.moq ? `<div class="product-specs">MOQ: ${p.moq}</div>` : ''}
                  ${reportOptions.includeQR ? `<div class="qr-code"><img src="${qrCodeUrl}" /></div>` : ''}
                </div>
              `
            }).join('')}
          </div>
          <div class="footer">${profile?.email} | ${profile?.contact_phone || ''}</div>
        </div>
      `
    }

    const pptHTML = `<!DOCTYPE html>
    <html>
    <head>
      <title>Trade Fair Report - ${profile?.company_name}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; background: white; }
        .slide { width: 100%; min-height: 100vh; page-break-after: always; padding: 40px; }
        .slide:last-child { page-break-after: auto; }
        .slide-header { display: flex; justify-content: space-between; border-bottom: 2px solid #0891b2; padding-bottom: 15px; margin-bottom: 30px; }
        .logo { font-size: 28px; font-weight: bold; color: #0891b2; }
        .company { font-size: 18px; color: #333; }
        .date { font-size: 12px; color: #666; }
        .slide-title { font-size: 28px; color: #0891b2; margin-bottom: 30px; border-left: 4px solid #0891b2; padding-left: 15px; }
        .product-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 25px; }
        .product-card { background: #f8f9fa; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .product-image { height: 150px; display: flex; align-items: center; justify-content: center; margin-bottom: 15px; }
        .product-image img { max-width: 100%; max-height: 120px; object-fit: contain; }
        .product-title { font-size: 16px; font-weight: bold; margin-bottom: 8px; }
        .product-price { font-size: 20px; font-weight: bold; color: #0891b2; margin: 8px 0; }
        .product-specs { font-size: 12px; color: #666; margin: 5px 0; }
        .qr-code { margin-top: 10px; }
        .qr-code img { width: 60px; height: 60px; }
        .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 10px; color: #999; }
      </style>
    </head>
    <body>
      ${slidesHTML}
    </body>
    </html>`
    
    const blob = new Blob([pptHTML], { type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `trade_fair_report_${profile?.company_name}_${new Date().toISOString().slice(0,10)}.pptx`
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  function generateShareLink() {
    const data = getProductData()
    const shareData = {
      company: profile?.company_name,
      products: data.map(p => ({ id: p.id, title: p.title })),
      options: reportOptions
    }
    const encodedData = btoa(JSON.stringify(shareData))
    const shareUrl = `${window.location.origin}/share/${encodedData}`
    navigator.clipboard.writeText(shareUrl)
    alert('Share link copied to clipboard!')
  }

  function handleExport() {
    if (exportFormat === 'pdf') {
      const printWindow = window.open('', '_blank')
      printWindow?.document.write(generatePDFHTML())
      printWindow?.document.close()
      printWindow?.print()
    } else if (exportFormat === 'excel') {
      exportToExcel()
    } else if (exportFormat === 'ppt') {
      exportToPowerPoint()
    }
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">🎪 Trade Fair Report</h1>
            <p className="text-slate-500 text-sm">Generate professional product catalogues for trade fairs</p>
          </div>
          <button onClick={() => router.push('/manufacturer/dashboard')} className="text-slate-600 hover:text-slate-800">← Back</button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <h3 className="font-semibold mb-3">🔍 Search Products</h3>
              <input type="text" placeholder="Search by name or category..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm" />
            </div>

            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <h3 className="font-semibold mb-3">📋 Report Options</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={reportOptions.includeQR} onChange={e => setReportOptions({...reportOptions, includeQR: e.target.checked})} /><span>Include QR Codes</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={reportOptions.showPrices} onChange={e => setReportOptions({...reportOptions, showPrices: e.target.checked})} /><span>Show Prices</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={reportOptions.showSpecifications} onChange={e => setReportOptions({...reportOptions, showSpecifications: e.target.checked})} /><span>Show Specifications</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={reportOptions.showImages} onChange={e => setReportOptions({...reportOptions, showImages: e.target.checked})} /><span>Show Images</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={reportOptions.showDescription} onChange={e => setReportOptions({...reportOptions, showDescription: e.target.checked})} /><span>Show Description</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={reportOptions.showMOQ} onChange={e => setReportOptions({...reportOptions, showMOQ: e.target.checked})} /><span>Show MOQ</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={reportOptions.showCategory} onChange={e => setReportOptions({...reportOptions, showCategory: e.target.checked})} /><span>Show Category</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={reportOptions.showSKU} onChange={e => setReportOptions({...reportOptions, showSKU: e.target.checked})} /><span>Show SKU</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={reportOptions.showLeadTime} onChange={e => setReportOptions({...reportOptions, showLeadTime: e.target.checked})} /><span>Show Lead Time</span></label>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={reportOptions.showStock} onChange={e => setReportOptions({...reportOptions, showStock: e.target.checked})} /><span>Show Stock</span></label>
              </div>
            </div>

            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <h3 className="font-semibold mb-3">📤 Export Options</h3>
              <div className="space-y-2">
                <select value={exportFormat} onChange={e => setExportFormat(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm mb-2">
                  <option value="pdf">📄 PDF Document</option>
                  <option value="excel">📊 Excel Spreadsheet (with Images)</option>
                  <option value="ppt">📽️ PowerPoint Presentation</option>
                </select>
                <button onClick={handleExport} disabled={exporting || filteredProducts.length === 0} className="w-full bg-cyan-600 text-white py-2 rounded-lg text-sm hover:bg-cyan-700 disabled:opacity-50">
                  {exporting ? 'Generating...' : `Export as ${exportFormat.toUpperCase()}`}
                </button>
                <button onClick={generateShareLink} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm hover:bg-blue-700">
                  🔗 Generate Share Link
                </button>
              </div>
            </div>
          </div>

          {/* Right Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl p-4 mb-4 border shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={selectAll} onChange={toggleSelectAll} /><span>Select All ({filteredProducts.length})</span></label>
                {selectedProducts.length > 0 && <span className="text-sm text-blue-600">{selectedProducts.length} products selected</span>}
              </div>
              <p className="text-sm text-slate-500">{filteredProducts.length} products found</p>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-slate-500">No products found. Add products first.</p>
                <Link href="/manufacturer/products" className="mt-4 inline-block text-cyan-600 hover:underline">+ Add Products</Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredProducts.map((product) => {
                  const imageUrl = getImageUrl(product)
                  return (
                    <div key={product.id} className="bg-white rounded-xl border p-4 shadow-sm hover:shadow-md transition">
                      <div className="flex gap-4">
                        <input type="checkbox" checked={selectedProducts.includes(product.id)} onChange={() => toggleProductSelection(product.id)} className="mt-1" />
                        {reportOptions.showImages && imageUrl && (
                          <div className="w-20 h-20 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0"><img src={imageUrl} alt={product.title} className="w-full h-full object-cover" /></div>
                        )}
                        <div className="flex-1">
                          <h3 className="font-semibold">{product.title}</h3>
                          {reportOptions.showPrices && <p className="text-cyan-600 font-bold">{product.currency === 'INR' ? '₹' : '$'}{product.price_per_unit}</p>}
                          {reportOptions.showCategory && product.category && <p className="text-xs text-slate-500">{product.category}</p>}
                          {reportOptions.showMOQ && product.moq > 0 && <p className="text-xs text-slate-500">MOQ: {product.moq} pieces</p>}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}