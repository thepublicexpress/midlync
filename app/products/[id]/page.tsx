'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import CompanyProfile from '@/app/components/CompanyProfile'

export default function ProductDetailPage() {
  const [product, setProduct] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [isZoomed, setIsZoomed] = useState(false)
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 })
  const [showLightbox, setShowLightbox] = useState(false)
  const [lightboxImage, setLightboxImage] = useState('')
  const [user, setUser] = useState(null)
  const [isOwner, setIsOwner] = useState(false)
  const [sendingInquiry, setSendingInquiry] = useState(false)
  const [showCompanyProfile, setShowCompanyProfile] = useState(false)
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    getCurrentUser()
  }, [])

  useEffect(() => {
    if (user) {
      loadProduct()
    }
  }, [params?.id, user])

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
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

    if (user && productData) {
      setIsOwner(user.id === productData.manufacturer_id)
    }

    if (productData?.manufacturer_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', productData.manufacturer_id)
        .single()
      setProfile(profileData)
    }

    setLoading(false)
  }

  const getImages = () => {
    if (product?.images && Array.isArray(product.images) && product.images.length > 0) {
      return product.images
    }
    if (product?.image_url) {
      return [product.image_url]
    }
    return []
  }

  const images = getImages()

  const handleMouseMove = (e) => {
    if (!isZoomed) return
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - left) / width) * 100
    const y = ((e.clientY - top) / height) * 100
    setZoomPosition({ x: Math.min(Math.max(x, 0), 100), y: Math.min(Math.max(y, 0), 100) })
  }

  const openLightbox = (img) => {
    setLightboxImage(img)
    setShowLightbox(true)
  }

  const addToCart = () => {
    if (!user) {
      alert('Please login to add items to cart')
      router.push('/login')
      return
    }

    const cart = JSON.parse(localStorage.getItem('midlync_cart') || '[]')
    const existingItem = cart.find(item => item.id === product.id)

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.push({
        id: product.id,
        title: product.title,
        price: product.price_per_unit,
        image: product.image_url || (product.images?.[0]),
        category: product.category,
        manufacturer_id: product.manufacturer_id,
        quantity: 1
      })
    }

    localStorage.setItem('midlync_cart', JSON.stringify(cart))
    alert('✓ Added to cart!')
  }

  const handleSendInquiry = async () => {
    if (!user) {
      alert('Please login to send inquiry')
      router.push('/login')
      return
    }

    const message = prompt('Enter your message for the manufacturer:', 
      `Hi, I'm interested in your product "${product?.title}". Please share more details about pricing and availability.`)

    if (!message) return

    setSendingInquiry(true)

    try {
      const response = await fetch('/api/inquiries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          product_id: product?.id,
          buyer_id: user?.id,
          message: message,
          quantity: product?.moq || 1
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('✅ Inquiry sent! The manufacturer will contact you soon.')
      } else {
        alert('❌ Failed: ' + (data.error || 'Unknown error'))
      }
    } catch (error) {
      console.error('Error:', error)
      alert('❌ Network error. Please try again.')
    } finally {
      setSendingInquiry(false)
    }
  }

  const handleGetQR = () => {
    const url = `${window.location.origin}/products/${product?.id}`
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`
    window.open(qrUrl, '_blank')
  }

  if (loading) {
    return (
      <>
        <Navbar role="buyer" companyName="Buyer" />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </>
    )
  }

  if (!product) {
    return (
      <>
        <Navbar role="buyer" companyName="Buyer" />
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-slate-500">Product not found</p>
            <button onClick={() => router.back()} className="mt-4 text-blue-600">Go Back</button>
          </div>
        </div>
      </>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar role="buyer" companyName="Buyer" />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-8">
        <div className="flex flex-col md:flex-row md:gap-8 lg:gap-12">
          
          {/* Left Column - Images with Zoom */}
          <div className="md:w-1/2">
            <div 
              className="relative bg-slate-50 rounded-xl overflow-hidden border border-slate-100"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <div 
                className="aspect-square relative cursor-zoom-in"
                onClick={() => openLightbox(images[selectedImage])}
              >
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
                          backgroundSize: '250%',
                          backgroundRepeat: 'no-repeat'
                        }}
                      />
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl bg-slate-100">
                    📦
                  </div>
                )}
              </div>
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-16 h-16 md:w-20 md:h-20 rounded-lg border-2 overflow-hidden flex-shrink-0 transition ${
                      selectedImage === idx ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="text-center text-xs text-slate-400 mt-2">
              👆 Click image to zoom • Hover to magnify
            </div>
          </div>

          {/* Right Column - Product Details */}
          <div className="md:w-1/2 mt-6 md:mt-0">
            {product.category && (
              <div className="inline-block bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full mb-3">
                {product.category}
              </div>
            )}

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 mb-3">
              {product.title}
            </h1>

            <div className="mb-4">
              <span className="text-2xl md:text-3xl font-bold text-blue-600">
                {product.currency === 'INR' ? '₹' : '$'}{product.price_per_unit || '—'}
              </span>
              <span className="text-slate-500 text-sm ml-2">per {product.unit || 'piece'}</span>
            </div>

            {product.moq > 0 && (
              <div className="bg-slate-50 rounded-lg p-4 mb-4">
                <div className="text-sm text-slate-600">Minimum Order Quantity</div>
                <div className="font-semibold text-slate-900 text-lg">{product.moq} {product.moq_unit || 'pieces'}</div>
              </div>
            )}

            {product.description && (
              <div className="border-t border-slate-100 pt-4 mb-4">
                <h3 className="font-semibold text-slate-800 mb-2">📄 Description</h3>
                <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-slate-100">
              <button 
                onClick={addToCart}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition"
              >
                🛒 Add to Cart
              </button>
              <button 
                onClick={handleSendInquiry}
                disabled={sendingInquiry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
              >
                {sendingInquiry ? 'Sending...' : '📩 Send Inquiry'}
              </button>
              <button 
                onClick={handleGetQR}
                className="flex-1 border border-slate-200 text-slate-700 font-semibold py-3 rounded-xl hover:bg-slate-50 transition"
              >
                📱 Get QR
              </button>
            </div>

            {/* Manufacturer Company Profile Section */}
            {product.manufacturer_id && (
              <div className="mt-8 pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold text-slate-800">
                    🏭 Manufacturer Information
                  </h3>
                  <button
                    onClick={() => setShowCompanyProfile(!showCompanyProfile)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    {showCompanyProfile ? 'Show less' : 'View full profile'}
                  </button>
                </div>
                
                {/* Compact Manufacturer Info */}
                <div className="bg-slate-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    {profile?.logo_url ? (
                      <img src={profile.logo_url} alt={profile.company_name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                        🏢
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-slate-800">{profile?.company_name || 'Company Name'}</p>
                      {profile?.city && profile?.country && (
                        <p className="text-xs text-slate-500">{profile.city}, {profile.country}</p>
                      )}
                      {profile?.year_established && (
                        <p className="text-xs text-slate-500">Est. {profile.year_established}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Full Company Profile (expandable) */}
                {showCompanyProfile && (
                  <div className="mt-3">
                    <CompanyProfile userId={product.manufacturer_id} role="manufacturer" />
                  </div>
                )}
              </div>
            )}

            {/* Back Button */}
            <div className="mt-4 text-center">
              <button onClick={() => router.back()} className="text-slate-400 text-sm hover:text-slate-600">
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {showLightbox && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center cursor-zoom-out"
          onClick={() => setShowLightbox(false)}
        >
          <button 
            className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300"
            onClick={() => setShowLightbox(false)}
          >
            ✕
          </button>
          <img 
            src={lightboxImage} 
            alt="Zoomed" 
            className="max-w-[95vw] max-h-[95vh] object-contain"
          />
        </div>
      )}
    </div>
  )
}