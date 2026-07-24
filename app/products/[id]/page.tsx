'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'

export default function PublicProductDetail() {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [images, setImages] = useState<string[]>([])
  const [selectedImage, setSelectedImage] = useState(0)
  const [showLightbox, setShowLightbox] = useState(false)
  const [lightboxImage, setLightboxImage] = useState('')
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const [showFullDetails, setShowFullDetails] = useState(false)
  const [showEnquiryForm, setShowEnquiryForm] = useState(false)
  const [enquiryMessage, setEnquiryMessage] = useState('')
  const [enquiryQuantity, setEnquiryQuantity] = useState('')
  const [sending, setSending] = useState(false)
  const [profile, setProfile] = useState<any>(null)
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

    const { data: productData, error } = await supabase
      .from('products')
      .select('*, manufacturer:profiles(company_name, manufacturer_code)')
      .eq('id', params.id)
      .single()

    if (error || !productData) {
      setLoading(false)
      return
    }
    setProduct(productData)

    // Fetch images
    const { data: imageData } = await supabase
      .from('product_images')
      .select('image_url')
      .eq('product_id', params.id)
      .order('sort_order', { ascending: true })

    let combined: string[] = []
    if (productData.images && Array.isArray(productData.images)) {
      combined = [...productData.images]
    }
    if (imageData && imageData.length > 0) {
      imageData.forEach(img => {
        if (!combined.includes(img.image_url)) combined.push(img.image_url)
      })
    }
    if (combined.length === 0 && productData.image_url) {
      combined = [productData.image_url]
    }
    setImages(combined)
    setLoading(false)
  }

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

  const handleEnquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Please login to send enquiry')
      router.push('/login')
      return
    }
    if (!profile) {
      alert('Profile not loaded')
      return
    }
    setSending(true)
    try {
      const payload = {
        product_id: product.id,
        buyer_id: user.id,
        message: enquiryMessage,
        quantity: parseInt(enquiryQuantity) || null,
        source_role: 'buyer',
      }
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        alert('✅ Enquiry sent successfully! Admin will review and connect you.')
        setShowEnquiryForm(false)
        setEnquiryMessage('')
        setEnquiryQuantity('')
      } else {
        alert('❌ Failed: ' + (data.error || 'Unknown error'))
      }
    } catch (err) {
      alert('Error sending enquiry')
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }
  if (!product) {
    return <div className="min-h-screen flex items-center justify-center">Product not found</div>
  }

  const specs = product.specifications || {}

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-8 bg-white rounded-xl shadow p-6">
          {/* Left – Images */}
          <div>
            <div
              className="relative bg-gray-100 rounded-xl overflow-hidden cursor-zoom-in"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
              onClick={() => openLightbox(images[selectedImage] || '')}
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
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${
                      selectedImage === idx
                        ? 'border-blue-500 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right – Details */}
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {product.category && (
                <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded">
                  {product.category}
                </span>
              )}
              <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                Manufacturer: {product.manufacturer?.manufacturer_code || 'MFR-CODE'}
              </span>
              {/* ✅ Product Code display */}
              {product.product_code && (
                <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded font-mono">
                  Code: {product.product_code}
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
            <div className="text-3xl font-bold text-blue-600 mb-4">
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

            {Object.keys(specs).length > 0 && (
              <div className="border-t pt-4 mb-4">
                <h3 className="font-semibold text-gray-800 mb-3">📏 Specifications</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {Object.entries(specs).map(([key, value]) => (
                    <div key={key}><span className="text-gray-500">{key}:</span> <span className="font-medium">{String(value)}</span></div>
                  ))}
                </div>
              </div>
            )}

            {product.description && (
              <div className="border-t pt-4 mb-4">
                <h3 className="font-semibold text-gray-800 mb-2">📄 Description</h3>
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            {/* Enquiry Button */}
            <div className="mt-6 pt-4 border-t">
              <button
                onClick={() => setShowEnquiryForm(true)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Send Enquiry
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {showLightbox && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center cursor-zoom-out" onClick={() => setShowLightbox(false)}>
          <button className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 z-10" onClick={() => setShowLightbox(false)}>✕</button>
          <img src={lightboxImage} alt="Zoomed" className="max-w-[95vw] max-h-[95vh] object-contain" />
        </div>
      )}

      {/* Enquiry Modal */}
      {showEnquiryForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowEnquiryForm(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-bold mb-4">Send Enquiry</h3>
            <form onSubmit={handleEnquirySubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">Product</label>
                <p className="text-gray-700">{product.title}</p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">Message *</label>
                <textarea
                  required
                  rows={4}
                  value={enquiryMessage}
                  onChange={(e) => setEnquiryMessage(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Write your inquiry..."
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">Quantity (optional)</label>
                <input
                  type="number"
                  value={enquiryQuantity}
                  onChange={(e) => setEnquiryQuantity(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="e.g., 1000"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  {sending ? 'Sending...' : 'Send'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowEnquiryForm(false)}
                  className="flex-1 border py-2 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}