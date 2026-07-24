'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

// Function to generate manufacturer code (fallback if not imported)
function generateManufacturerCode(id: string): string {
  // Simple fallback: take first 6 chars of UUID
  return id ? `MFR-${id.slice(0, 6)}` : 'MFR-XXXX'
}

export default function BuyerBrowsePage() {
  const [products, setProducts] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      setProfile(profileData)
      
      try {
        // ✅ Added product_code to the select query
        const { data: productsData, error } = await supabase
          .from('products')
          .select('id, title, description, category, price_per_unit, currency, moq, manufacturer_id, image_url, status, images, product_code')
          .eq('status', 'active')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('Products query error:', error)
        } else {
          setProducts(productsData || [])
        }
      } catch (err) {
        console.error('Products fetch exception:', err)
        setProducts([])
      }
      setLoading(false)
    }
    load()
  }, [])

  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))]

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = !selectedCategory || selectedCategory === 'All' || p.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto"></div>
          <p className="mt-4 text-slate-500">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="buyer" companyName={profile?.company_name || 'Buyer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Browse Products</h1>
          <p className="text-slate-500 mt-1">Discover products from trusted manufacturers</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border">
            <div className="text-2xl mb-2">🛒</div>
            <div className="text-2xl font-bold">{products.length}</div>
            <div className="text-xs text-slate-500">Total Products</div>
          </div>
          <div className="bg-white rounded-xl p-5 border">
            <div className="text-2xl mb-2">🏭</div>
            <div className="text-2xl font-bold">{new Set(products.map(p => p.manufacturer_id)).size}</div>
            <div className="text-xs text-slate-500">Manufacturers</div>
          </div>
          <div className="bg-white rounded-xl p-5 border">
            <div className="text-2xl mb-2">📁</div>
            <div className="text-2xl font-bold">{categories.length - 1}</div>
            <div className="text-xs text-slate-500">Categories</div>
          </div>
          <div className="bg-white rounded-xl p-5 border">
            <div className="text-2xl mb-2">⭐</div>
            <div className="text-2xl font-bold">New</div>
            <div className="text-xs text-slate-500">Arrivals</div>
          </div>
        </div>

        {/* Search & Filter */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm border">
          <div className="flex flex-col md:flex-row gap-4">
            <input 
              type="text" 
              placeholder="Search products by name or description..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
            <select 
              value={selectedCategory} 
              onChange={e => setSelectedCategory(e.target.value)} 
              className="border rounded-lg px-4 py-2 focus:outline-none focus:border-cyan-500"
            >
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4 flex justify-between items-center">
          <p className="text-sm text-slate-500">
            Showing {filteredProducts.length} of {products.length} products
          </p>
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')} 
              className="text-sm text-cyan-600 hover:text-cyan-700"
            >
              Clear search
            </button>
          )}
        </div>

        {filteredProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-slate-500 text-lg">No products found</p>
            <p className="text-slate-400 text-sm mt-1">Try adjusting your search or category filter</p>
            <button 
              onClick={() => { setSearchTerm(''); setSelectedCategory('') }} 
              className="mt-4 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-2 rounded-lg transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredProducts.map((p) => {
              let images = []
              try { 
                images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []) 
              } catch { 
                images = [] 
              }
              const mainImage = images[0] || p.image_url
              
              return (
                <div 
                  key={p.id} 
                  className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  onClick={() => router.push(`/products/${p.id}`)}
                >
                  <div className="aspect-square bg-slate-50 flex items-center justify-center relative overflow-hidden">
                    {mainImage ? (
                      <img 
                        src={mainImage} 
                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" 
                        alt={p.title}
                      />
                    ) : (
                      <span className="text-6xl">📦</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg truncate text-slate-800">{p.title}</h3>
                    <p className="text-cyan-600 font-bold text-xl mt-1">
                      ₹{p.price_per_unit?.toLocaleString('en-IN') || '—'}
                    </p>
                    {p.manufacturer_id && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <span>🏭</span> {generateManufacturerCode(p.manufacturer_id)}
                      </p>
                    )}
                    {/* ✅ Display product sub‑code */}
                    {p.product_code && (
                      <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                        <span>🔖</span> {p.product_code}
                      </p>
                    )}
                    {p.category && (
                      <span className="inline-block mt-2 text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">
                        {p.category}
                      </span>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/products/${p.id}`)
                      }} 
                      className="w-full mt-3 bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded-lg text-sm transition font-medium"
                    >
                      View Details →
                    </button>
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