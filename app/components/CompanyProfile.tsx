'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface CompanyProfileProps {
  userId: string
  role: 'buyer' | 'manufacturer'
  showProducts?: boolean
  compact?: boolean
}

export default function CompanyProfile({ userId, role, showProducts = false, compact = false }: CompanyProfileProps) {
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showFullDescription, setShowFullDescription] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadProfile()
    if (showProducts && role === 'manufacturer') {
      loadProducts()
    }
  }, [userId, showProducts, role])

  async function loadProfile() {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    setProfile(data)
    setLoading(false)
  }

  async function loadProducts() {
    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('manufacturer_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(4)
    
    setProducts(data || [])
  }

  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return null
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    const videoId = (match && match[2].length === 11) ? match[2] : null
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  }

  const isDirectVideoUrl = (url: string) => {
    if (!url) return false
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url)
  }

  const getImageUrl = (images: any) => {
    if (!images) return null
    try {
      const imgArray = typeof images === 'string' ? JSON.parse(images) : images
      return imgArray[0] || null
    } catch {
      return null
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-20 bg-gray-200 rounded-lg"></div>
        <div className="h-32 bg-gray-200 rounded-lg"></div>
      </div>
    )
  }

  if (!profile) {
    return <div className="text-slate-500 text-center py-8">Company details not available</div>
  }

  const videoEmbedUrl = getYouTubeEmbedUrl(profile.factory_video_url)
  const directVideoUrl = isDirectVideoUrl(profile.factory_video_url) ? profile.factory_video_url : null

  // Compact view - for product pages, order pages
  if (compact) {
    return (
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border">
        <div className="p-4">
          <div className="flex items-center gap-3">
            {profile.logo_url ? (
              <img src={profile.logo_url} alt={profile.company_name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                🏢
              </div>
            )}
            <div>
              <h3 className="font-semibold text-gray-800">{profile.company_name || 'Company Name'}</h3>
              {profile.city && profile.country && (
                <p className="text-xs text-gray-500">{profile.city}, {profile.country}</p>
              )}
              {profile.year_established && (
                <p className="text-xs text-gray-500">Est. {profile.year_established}</p>
              )}
            </div>
          </div>
          
          <div className="mt-3 flex gap-2 text-xs">
            {profile.email && (
              <a href={`mailto:${profile.email}`} className="text-cyan-600 hover:underline">Email</a>
            )}
            {profile.phone && (
              <a href={`tel:${profile.phone}`} className="text-cyan-600 hover:underline">Call</a>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Full view - for dedicated profile page
  return (
    <div className="space-y-6">
      {/* Company Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-6">
          <div className="flex items-center gap-4">
            {profile.logo_url ? (
              <img src={profile.logo_url} alt={profile.company_name} className="w-20 h-20 rounded-full bg-white object-cover p-1" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-4xl">
                🏢
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white">{profile.company_name || 'Company Name'}</h1>
              <p className="text-white/80 text-sm">{role === 'manufacturer' ? 'Manufacturer' : 'Buyer'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* About Section */}
          {profile.description && (
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h2 className="text-lg font-semibold mb-3">📖 About</h2>
              <p className={`text-gray-600 leading-relaxed ${!showFullDescription && 'line-clamp-3'}`}>
                {profile.description}
              </p>
              {profile.description.length > 200 && (
                <button
                  onClick={() => setShowFullDescription(!showFullDescription)}
                  className="text-cyan-600 text-sm mt-2 hover:underline"
                >
                  {showFullDescription ? 'Show less' : 'Read more'}
                </button>
              )}
            </div>
          )}

          {/* Factory Video */}
          {(videoEmbedUrl || directVideoUrl) && (
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h2 className="text-lg font-semibold mb-3">🎬 Factory Tour Video</h2>
              {videoEmbedUrl ? (
                <div className="relative pb-[56.25%] h-0 rounded-lg overflow-hidden">
                  <iframe
                    src={videoEmbedUrl}
                    title="Factory Video"
                    className="absolute top-0 left-0 w-full h-full"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <video src={directVideoUrl || ''} controls className="w-full rounded-lg bg-black" />
              )}
            </div>
          )}

          {/* Factory Photos */}
          {profile.factory_photos && profile.factory_photos.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h2 className="text-lg font-semibold mb-3">🏭 Factory Photos</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {profile.factory_photos.map((photo: string, idx: number) => (
                  <div key={idx} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                    <img src={photo} alt={`Factory ${idx + 1}`} className="w-full h-full object-cover cursor-pointer" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Business Information */}
          {(profile.nature_of_business || profile.product_categories || profile.employee_count || profile.annual_turnover || profile.production_capacity) && (
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h2 className="text-lg font-semibold mb-3">📊 Business Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {profile.nature_of_business && (
                  <div>
                    <p className="text-xs text-gray-400">Nature of Business</p>
                    <p className="text-sm font-medium">{profile.nature_of_business}</p>
                  </div>
                )}
                {profile.product_categories && (
                  <div>
                    <p className="text-xs text-gray-400">Product Categories</p>
                    <p className="text-sm font-medium">{profile.product_categories}</p>
                  </div>
                )}
                {profile.employee_count && (
                  <div>
                    <p className="text-xs text-gray-400">Employees</p>
                    <p className="text-sm font-medium">{profile.employee_count}</p>
                  </div>
                )}
                {profile.annual_turnover && (
                  <div>
                    <p className="text-xs text-gray-400">Annual Turnover</p>
                    <p className="text-sm font-medium">{profile.annual_turnover}</p>
                  </div>
                )}
                {profile.production_capacity && (
                  <div>
                    <p className="text-xs text-gray-400">Production Capacity</p>
                    <p className="text-sm font-medium">{profile.production_capacity}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Certifications */}
          {profile.certifications && (
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h2 className="text-lg font-semibold mb-3">✅ Certifications</h2>
              <div className="flex flex-wrap gap-2">
                {profile.certifications.split(',').map((cert: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full">
                    {cert.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Major Customers */}
          {profile.major_customers && (
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h2 className="text-lg font-semibold mb-3">🤝 Major Customers</h2>
              <div className="flex flex-wrap gap-2">
                {profile.major_customers.split(',').map((customer: string, idx: number) => (
                  <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                    {customer.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Products */}
          {showProducts && products.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm p-6 border">
              <h2 className="text-lg font-semibold mb-3">🛍️ Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {products.map((product) => {
                  const productImage = getImageUrl(product.images)
                  return (
                    <Link
                      key={product.id}
                      href={`/products/${product.id}`}
                      className="group cursor-pointer"
                    >
                      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                        {productImage ? (
                          <img src={productImage} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl">📦</div>
                        )}
                      </div>
                      <p className="font-medium text-sm line-clamp-1">{product.title}</p>
                      <p className="text-xs text-cyan-600 font-semibold">
                        {product.currency === 'INR' ? '₹' : '$'}{product.price_per_unit}
                      </p>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar - Contact Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm p-6 border sticky top-6">
            <h2 className="text-lg font-semibold mb-3">📞 Contact Information</h2>
            <div className="space-y-3">
              {profile.contact_person && (
                <div>
                  <p className="text-xs text-gray-400">Contact Person</p>
                  <p className="font-medium">{profile.contact_person}</p>
                  {profile.designation && <p className="text-sm text-gray-500">{profile.designation}</p>}
                </div>
              )}
              {profile.mobile_number && (
                <div>
                  <p className="text-xs text-gray-400">Mobile</p>
                  <a href={`tel:${profile.mobile_number}`} className="text-cyan-600 hover:underline">
                    {profile.mobile_number}
                  </a>
                </div>
              )}
              {profile.phone_number && (
                <div>
                  <p className="text-xs text-gray-400">Phone</p>
                  <a href={`tel:${profile.phone_number}`} className="text-cyan-600 hover:underline">
                    {profile.phone_number}
                  </a>
                </div>
              )}
              {profile.email && (
                <div>
                  <p className="text-xs text-gray-400">Email</p>
                  <a href={`mailto:${profile.email}`} className="text-cyan-600 hover:underline break-all">
                    {profile.email}
                  </a>
                </div>
              )}
              {profile.website && (
                <div>
                  <p className="text-xs text-gray-400">Website</p>
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-cyan-600 hover:underline">
                    {profile.website}
                  </a>
                </div>
              )}
            </div>

            {/* Address */}
            {(profile.address || profile.city || profile.country) && (
              <div className="border-t pt-3 mt-3">
                <p className="text-xs text-gray-400">Address</p>
                <p className="text-sm">
                  {profile.address && <>{profile.address}<br /></>}
                  {profile.city && profile.state && `${profile.city}, ${profile.state}`}
                  {profile.zip_code && <>{profile.zip_code}<br /></>}
                  {profile.country && <>{profile.country}</>}
                </p>
              </div>
            )}

            {/* Tax Details */}
            {(profile.gst || profile.pan || profile.iec) && (
              <div className="border-t pt-3 mt-3">
                <p className="text-xs text-gray-400">Tax & Legal</p>
                {profile.gst && <p className="text-sm"><span className="text-gray-500">GST:</span> {profile.gst}</p>}
                {profile.pan && <p className="text-sm"><span className="text-gray-500">PAN:</span> {profile.pan}</p>}
                {profile.iec && <p className="text-sm"><span className="text-gray-500">IEC:</span> {profile.iec}</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}