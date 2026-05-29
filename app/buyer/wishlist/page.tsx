'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function BuyerWishlistPage() {
  const [wishlist, setWishlist] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadWishlist()
  }, [])

  async function loadWishlist() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(profileData)
    
    const { data: wishlistData } = await supabase
      .from('buyer_wishlist')
      .select('*, products(id, title, price_per_unit, image_url, category)')
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false })
    
    setWishlist(wishlistData || [])
    setLoading(false)
  }

  async function removeFromWishlist(productId) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase
      .from('buyer_wishlist')
      .delete()
      .eq('buyer_id', user.id)
      .eq('product_id', productId)
    
    loadWishlist()
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="buyer" companyName={profile?.company_name || 'Buyer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">My Wishlist</h1>
            <p className="text-slate-500 text-sm">Products you've saved for later</p>
          </div>
          <button onClick={() => router.push('/buyer/dashboard')} className="text-slate-600 hover:text-slate-800">← Back</button>
        </div>

        {wishlist.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border">
            <div className="text-6xl mb-4">❤️</div>
            <p className="text-slate-500 mb-4">Your wishlist is empty</p>
            <button onClick={() => router.push('/buyer/browse')} className="bg-cyan-600 text-white px-6 py-3 rounded-xl">
              Browse Products →
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {wishlist.map((item) => {
              let images = []
              try { images = typeof item.products?.images === 'string' ? JSON.parse(item.products.images) : (item.products?.images || []) } catch { images = [] }
              const mainImage = images[0] || item.products?.image_url
              return (
                <div key={item.id} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-lg transition">
                  <div onClick={() => router.push(`/products/${item.products?.id}`)} className="aspect-square bg-slate-50 flex items-center justify-center cursor-pointer">
                    {mainImage ? <img src={mainImage} className="w-full h-full object-contain p-4" /> : <span className="text-5xl">📦</span>}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg truncate">{item.products?.title}</h3>
                    <p className="text-cyan-600 font-bold">${item.products?.price_per_unit || '—'}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.products?.category}</p>
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => router.push(`/products/${item.products?.id}`)} className="flex-1 bg-cyan-600 text-white py-2 rounded-lg text-sm">
                        View Details
                      </button>
                      <button onClick={() => removeFromWishlist(item.products?.id)} className="px-3 bg-red-100 text-red-600 rounded-lg text-sm">
                        ❌
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
  )
}