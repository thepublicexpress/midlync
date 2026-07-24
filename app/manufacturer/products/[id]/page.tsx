'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function ManufacturerProductDetail() {
  const [product, setProduct] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const [showLightbox, setShowLightbox] = useState(false)
  const [lightboxImage, setLightboxImage] = useState('')
  const [showQR, setShowQR] = useState(false)
  const [showFullDetails, setShowFullDetails] = useState(false)
  const [allImages, setAllImages] = useState<string[]>([])
  const [deleting, setDeleting] = useState(false)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadProduct()
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
  }

  async function loadProduct() {
    if (!params?.id) return
    setLoading(true)

    const { data: productData } = await supabase
      .from('products')
      .select('*')
      .eq('id', params.id)
      .single()

    setProduct(productData)

    const { data: imagesData } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', params.id)
      .order('sort_order', { ascending: true })

    let combined: string[] = []
    if (productData?.images && Array.isArray(productData.images)) {
      combined = [...productData.images]
    }
    if (imagesData && imagesData.length > 0) {
      const imageUrls = imagesData.map(img => img.image_url)
      combined = [...combined, ...imageUrls.filter(url => !combined.includes(url))]
    }
    if (combined.length === 0 && productData?.image_url) {
      combined = [productData.image_url]
    }
    setAllImages(combined)

    setLoading(false)
  }

  const images = allImages

  const getSpecifications = () => {
    if (product?.specifications) {
      try {
        return typeof product.specifications === 'string'
          ? JSON.parse(product.specifications)
          : product.specifications
      } catch {
        return {}
      }
    }
    return {}
  }

  const specifications = getSpecifications()

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) return
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomPosition({ x: Math.min(Math.max(x, 0), 100), y: Math.min(Math.max(y, 0), 100) })
  }

  const openLightbox = (img: string) => {
    setLightboxImage(img)
    setShowLightbox(true)
  }

  // ✅ Delete using API (cleans R2)
  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this product? This will also delete all associated images from storage.')) return

    setDeleting(true)
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Deletion failed')
      alert('✅ Product and all images deleted successfully!')
      router.push('/manufacturer/products')
    } catch (err: any) {
      alert('❌ Error: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleGetQR = () => {
    setShowQR(true)
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/products/${product?.id}`
    if (navigator.share) {
      try {
        await navigator.share({
          title: product?.title,
          text: `Check out this product: ${product?.title}`,
          url: url,
        })
      } catch {
        console.log('Share cancelled')
      }
    } else {
      await navigator.clipboard.writeText(url)
      alert('✅ Product link copied to clipboard!')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />
        <div className="max-w-7xl mx-auto px-6 py-8 text-center">
          <p className="text-slate-500">Product not found</p>
          <button onClick={() => router.back()} className="mt-4 text-cyan-600">Go Back</button>
        </div>
      </div>
    )
  }

  const productUrl = `${window.location.origin}/products/${product?.id}`

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <button onClick={() => router.back()} className="mb-4 text-cyan-600 hover:underline">
          ← Back to Products
        </button>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="grid md:grid-cols-2 gap-8 p-6">
            {/* Left Column - Images */}
            <div>
              <div
                className="relative bg-slate-100 rounded-xl overflow-hidden cursor-zoom-in"
                onMouseEnter={() => setIsZoomed(true)}
                onMouseLeave={() => setIsZoomed(false)}
                onMouseMove={handleMouseMove}
                onClick={() => openLightbox(images[selectedImage])}
              >
                <div className="aspect-square relative">
                  {images[selectedImage] ? (
                    <>
                      <img
                        src={images[selectedImage]}
                        alt={product.title}
                        className="w-full h-full object-contain p-4"
                      />
                      {isZoomed && (
                        <div
                          className="absolute inset-0 hidden md:block pointer-events-none"
                          style={{
                            backgroundImage: `url(${images[selectedImage]})`,
                            backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                            backgroundSize: '200%',
                            backgroundRepeat: 'no-repeat',
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl">📦</div>
                  )}
                </div>
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  🔍 Click to zoom
                </div>
              </div>

              {images.length > 1 && (
                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 justify-start">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`w-20 h-20 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${
                        selectedImage === idx
                          ? 'border-cyan-500 ring-2 ring-cyan-200 shadow-md'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <img src={img} alt={`Angle ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
              {images.length === 0 && (
                <p className="text-sm text-gray-400 text-center mt-2">No images uploaded yet</p>
              )}
            </div>

            {/* Right Column - Product Details */}
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {product.category && (
                  <span className="inline-block bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                    {product.category}
                  </span>
                )}
                {product.sub_category && (
                  <span className="inline-block bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded">
                    {product.sub_category}
                  </span>
                )}
                {product.sku && (
                  <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                    SKU: {product.sku}
                  </span>
                )}
                {/* ✅ Product Code display */}
                {product.product_code && (
                  <span className="inline-block bg-green-50 text-green-700 text-xs px-2 py-1 rounded font-mono">
                    Code: {product.product_code}
                  </span>
                )}
              </div>

              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>

              <div className="text-3xl font-bold text-cyan-600 mb-4">
                {product.currency === 'INR' ? '₹' : '$'}{product.price_per_unit}
                <span className="text-sm text-gray-500 font-normal"> per {product.unit || 'piece'}</span>
              </div>

              {product.moq > 0 && (
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-sm text-gray-500">Minimum Order Quantity</div>
                  <div className="font-semibold text-lg">{product.moq} {product.moq_unit || 'pieces'}</div>
                </div>
              )}

              {product.short_description && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-gray-700 text-sm">{product.short_description}</p>
                </div>
              )}

              {(product.fabric_type || product.gsm || product.width || product.color || Object.keys(specifications).length > 0) && (
                <div className="border-t pt-4 mb-4">
                  <h3 className="font-semibold text-gray-800 mb-3">📏 Specifications</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    {product.fabric_type && <div><span className="text-gray-500">Material:</span> <span className="font-medium">{product.fabric_type}</span></div>}
                    {product.gsm && <div><span className="text-gray-500">Weight:</span> <span className="font-medium">{product.gsm} GSM</span></div>}
                    {product.width && <div><span className="text-gray-500">Width:</span> <span className="font-medium">{product.width}</span></div>}
                    {product.color && <div><span className="text-gray-500">Color:</span> <span className="font-medium">{product.color}</span></div>}
                    {Object.entries(specifications).map(([key, value]) => (
                      <div key={key}><span className="text-gray-500">{key}:</span> <span className="font-medium">{String(value)}</span></div>
                    ))}
                  </div>
                </div>
              )}

              {(product.lead_time || product.shipping_from || product.country_of_origin || product.hs_code) && (
                <div className="border-t pt-4 mb-4">
                  <h3 className="font-semibold text-gray-800 mb-3">🚚 Shipping & Logistics</h3>
                  <div className="space-y-2 text-sm">
                    {product.lead_time && <div><span className="text-gray-500">Lead Time:</span> <span className="font-medium">{product.lead_time}</span></div>}
                    {product.shipping_from && <div><span className="text-gray-500">Shipping From:</span> <span className="font-medium">{product.shipping_from}</span></div>}
                    {product.country_of_origin && <div><span className="text-gray-500">Country of Origin:</span> <span className="font-medium">{product.country_of_origin}</span></div>}
                    {product.hs_code && <div><span className="text-gray-500">HS Code:</span> <span className="font-medium">{product.hs_code}</span></div>}
                  </div>
                </div>
              )}

              {product.description && (
                <div className="border-t pt-4 mb-4">
                  <h3 className="font-semibold text-gray-800 mb-2">📄 Description</h3>
                  <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                    {product.description}
                  </p>
                </div>
              )}

              {(product.features?.length > 0 || product.tags?.length > 0 || product.certifications?.length > 0 ||
                product.warranty || product.return_policy || product.packaging_details || product.care_instructions ||
                product.video_url || product.additional_info) && (
                <div className="border-t pt-4">
                  <button
                    onClick={() => setShowFullDetails(!showFullDetails)}
                    className="flex items-center gap-2 text-cyan-600 font-semibold text-sm mb-3"
                  >
                    {showFullDetails ? '▼' : '▶'} Additional Information
                  </button>
                  {showFullDetails && (
                    <div className="space-y-4 text-sm">
                      {product.features && product.features.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-1">✨ Features</h4>
                          <div className="flex flex-wrap gap-2">
                            {product.features.map((feature: string, i: number) => (
                              <span key={i} className="bg-green-50 text-green-700 px-2 py-1 rounded text-xs">{feature}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {product.tags && product.tags.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-1">🏷️ Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {product.tags.map((tag: string, i: number) => (
                              <span key={i} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {product.certifications && product.certifications.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-800 mb-1">✅ Certifications</h4>
                          <div className="flex flex-wrap gap-2">
                            {product.certifications.map((cert: string, i: number) => (
                              <span key={i} className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs">{cert}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {product.warranty && <div><span className="text-gray-500">Warranty:</span> <span className="font-medium">{product.warranty}</span></div>}
                      {product.return_policy && <div><span className="text-gray-500">Return Policy:</span> <span className="font-medium">{product.return_policy}</span></div>}
                      {product.packaging_details && <div><span className="text-gray-500">Packaging:</span> <span className="font-medium">{product.packaging_details}</span></div>}
                      {product.care_instructions && <div><span className="text-gray-500">Care Instructions:</span> <span className="font-medium">{product.care_instructions}</span></div>}
                      {product.video_url && (
                        <div>
                          <span className="text-gray-500">Video:</span>
                          <a href={product.video_url} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline ml-2">Watch Video →</a>
                        </div>
                      )}
                      {product.additional_info && <div><span className="text-gray-500">Additional Info:</span> <span className="font-medium">{product.additional_info}</span></div>}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-4 border-t">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition disabled:opacity-50"
                >
                  {deleting ? 'Deleting...' : '🗑️ Delete Product'}
                </button>
                <button
                  onClick={handleGetQR}
                  className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition"
                >
                  📱 Get QR
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition"
                >
                  📤 Share
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center cursor-zoom-out" onClick={() => setShowLightbox(false)}>
          <button className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10" onClick={() => setShowLightbox(false)}>✕</button>
          <img src={lightboxImage} alt="Zoomed" className="max-w-[95vw] max-h-[95vh] object-contain" />
        </div>
      )}

      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">Product QR Code</h3>
              <p className="text-sm text-gray-500">Scan to view product</p>
            </div>
            <div className="flex gap-6 items-center justify-center">
              <div className="w-48 h-48 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                {images[0] ? <img src={images[0]} alt={product.title} className="w-full h-full object-cover" /> : <div className="flex items-center justify-center w-full h-full text-5xl">📦</div>}
              </div>
              <div className="w-48 h-48 bg-white rounded-xl overflow-hidden flex-shrink-0 shadow-md">
                <img id="qr-code-image" src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(productUrl)}`} alt="QR Code" className="w-full h-full object-contain p-2" />
              </div>
            </div>
            <div className="text-center mt-4">
              <h4 className="font-bold text-gray-800">{product.title}</h4>
              <p className="text-cyan-600 font-semibold">{product.currency === 'INR' ? '₹' : '$'}{product.price_per_unit}</p>
            </div>
            <div className="mt-4">
              <p className="text-xs text-gray-500 text-center break-all">{productUrl}</p>
              <div className="flex gap-3 mt-4">
                <button onClick={() => { navigator.clipboard.writeText(productUrl); alert('✅ Link copied!') }} className="flex-1 bg-cyan-600 text-white py-2 rounded-lg">Copy Link</button>
                <button onClick={() => { const win = window.open('', '_blank'); const qr = document.getElementById('qr-code-image')?.src; win?.document.write(`<html><head><title>QR Code</title><style>body{display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:Arial;margin:0;padding:20px;text-align:center}img{max-width:300px;margin:20px auto}</style></head><body><div><h2>${product.title}</h2><img src="${qr}" /><p>${productUrl}</p><p>Price: ${product.currency === 'INR' ? '₹' : '$'}${product.price_per_unit}</p></div><script>window.print();<\/script></body></html>`); win?.document.close() }} className="flex-1 bg-blue-600 text-white py-2 rounded-lg">🖨️ Print</button>
                <button onClick={() => { const qr = document.getElementById('qr-code-image')?.src; const link = document.createElement('a'); link.href = qr || ''; link.download = `qrcode-${product.title}.png`; link.click() }} className="flex-1 bg-green-600 text-white py-2 rounded-lg">⬇️ Download</button>
                <button onClick={() => setShowQR(false)} className="flex-1 border py-2 rounded-lg">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}