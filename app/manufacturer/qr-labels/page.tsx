'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function QRLabelsPage() {
  const [products, setProducts] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [selectAll, setSelectAll] = useState(false)
  const [labelSize, setLabelSize] = useState('medium')
  const [includeLogo, setIncludeLogo] = useState(true)
  const [includePrice, setIncludePrice] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProducts()
  }, [])

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
    setLoading(false)
  }

  function toggleProductSelection(productId) {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId))
      setSelectAll(false)
    } else {
      setSelectedProducts([...selectedProducts, productId])
      if (selectedProducts.length + 1 === products.length) {
        setSelectAll(true)
      }
    }
  }

  function toggleSelectAll() {
    if (selectAll) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p.id))
    }
    setSelectAll(!selectAll)
  }

  function getImageUrl(product) {
    let images = []
    try { images = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || []) } catch { images = [] }
    return images[0] || product.image_url || ''
  }

  function getLabelSizeClass() {
    switch(labelSize) {
      case 'small': return 'w-32 h-32 text-xs'
      case 'large': return 'w-64 h-64 text-base'
      default: return 'w-48 h-48 text-sm'
    }
  }

  function downloadQRCode(product, index) {
    const url = `${window.location.origin}/products/${product.id}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}`
    const link = document.createElement('a')
    link.href = qrUrl
    link.download = `qrcode_${product.title}_${index+1}.png`
    link.click()
  }

  function downloadAllQRCodes() {
    const productsToPrint = selectedProducts.length > 0 
      ? products.filter(p => selectedProducts.includes(p.id))
      : products
    
    const html = `<!DOCTYPE html>
    <html>
    <head>
      <title>QR Labels - ${profile?.company_name}</title>
      <meta charset="UTF-8">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .labels-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px; }
        .label { border: 1px solid #ddd; border-radius: 8px; padding: 15px; text-align: center; page-break-inside: avoid; }
        .label-image { width: 120px; height: 120px; margin: 0 auto 10px; }
        .label-image img { width: 100%; height: 100%; object-fit: contain; }
        .qr-code { width: 100px; height: 100px; margin: 10px auto; }
        .qr-code img { width: 100%; height: 100%; }
        .product-title { font-weight: bold; margin: 10px 0 5px; }
        .product-price { color: #0891b2; font-weight: bold; }
        .footer { text-align: center; margin-top: 40px; font-size: 12px; color: #666; }
        @media print {
          .label { break-inside: avoid; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header no-print">
        <h1>QR Labels</h1>
        <p>${profile?.company_name}</p>
        <button onclick="window.print()" style="padding: 10px 20px; margin-top: 10px;">Print Labels</button>
      </div>
      <div class="labels-grid">
        ${productsToPrint.map(product => {
          const imageUrl = getImageUrl(product)
          const productUrl = `${window.location.origin}/products/${product.id}`
          const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(productUrl)}`
          return `
            <div class="label">
              ${includeLogo && imageUrl ? `<div class="label-image"><img src="${imageUrl}" /></div>` : ''}
              <div class="qr-code"><img src="${qrCodeUrl}" /></div>
              <div class="product-title">${product.title}</div>
              ${includePrice ? `<div class="product-price">${product.currency === 'INR' ? '₹' : '$'}${product.price_per_unit}</div>` : ''}
            </div>
          `
        }).join('')}
      </div>
      <div class="footer">Generated by Midlync | ${new Date().toLocaleDateString()}</div>
    </body>
    </html>`
    
    const printWindow = window.open('', '_blank')
    printWindow?.document.write(html)
    printWindow?.document.close()
    printWindow?.print()
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">🏷️ QR Labels</h1>
            <p className="text-slate-500 text-sm">Generate and print QR code labels for your products</p>
          </div>
          <button onClick={() => router.push('/manufacturer/dashboard')} className="text-slate-600 hover:text-slate-800">← Back</button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Options */}
          <div className="lg:col-span-1 space-y-4">
            {/* Label Settings */}
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <h3 className="font-semibold mb-3">⚙️ Label Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Label Size</label>
                  <select value={labelSize} onChange={e => setLabelSize(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                    <option value="small">Small (32x32mm)</option>
                    <option value="medium">Medium (48x48mm)</option>
                    <option value="large">Large (64x64mm)</option>
                  </select>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={includeLogo} onChange={e => setIncludeLogo(e.target.checked)} />
                  <span className="text-sm">Include Product Image</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={includePrice} onChange={e => setIncludePrice(e.target.checked)} />
                  <span className="text-sm">Include Price</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <h3 className="font-semibold mb-3">📤 Actions</h3>
              <div className="space-y-2">
                <button onClick={downloadAllQRCodes} className="w-full bg-cyan-600 text-white py-2 rounded-lg text-sm hover:bg-cyan-700">
                  🖨️ Print Selected Labels
                </button>
              </div>
            </div>
          </div>

          {/* Right Content - Products Selection */}
          <div className="lg:col-span-3">
            {/* Product Selection Header */}
            <div className="bg-white rounded-xl p-4 mb-4 border shadow-sm flex justify-between items-center">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectAll} onChange={toggleSelectAll} />
                  <span className="text-sm">Select All ({products.length})</span>
                </label>
                {selectedProducts.length > 0 && (
                  <span className="text-sm text-blue-600">{selectedProducts.length} products selected</span>
                )}
              </div>
              <p className="text-sm text-slate-500">{products.length} products total</p>
            </div>

            {/* Products Grid */}
            {products.length === 0 ? (
              <div className="bg-white rounded-2xl p-16 text-center border">
                <div className="text-6xl mb-4">🏷️</div>
                <p className="text-slate-500">No products found. Add products first.</p>
                <Link href="/manufacturer/products" className="mt-4 inline-block text-cyan-600 hover:underline">
                  + Add Products
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => {
                  const imageUrl = getImageUrl(product)
                  const productUrl = `${window.location.origin}/products/${product.id}`
                  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(productUrl)}`
                  
                  return (
                    <div key={product.id} className="bg-white rounded-xl border p-3 shadow-sm hover:shadow-md transition">
                      <div className="flex items-start gap-2 mb-2">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => toggleProductSelection(product.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 text-center">
                          {includeLogo && imageUrl && (
                            <img src={imageUrl} alt={product.title} className="w-16 h-16 object-contain mx-auto mb-2" />
                          )}
                          <div className="w-24 h-24 mx-auto my-2">
                            <img src={qrCodeUrl} alt="QR Code" className="w-full h-full" />
                          </div>
                          <p className="font-medium text-sm truncate">{product.title}</p>
                          {includePrice && (
                            <p className="text-cyan-600 font-bold text-sm">{product.currency === 'INR' ? '₹' : '$'}{product.price_per_unit}</p>
                          )}
                          <button
                            onClick={() => downloadQRCode(product, 0)}
                            className="mt-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded hover:bg-gray-200"
                          >
                            Download QR
                          </button>
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