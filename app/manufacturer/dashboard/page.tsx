'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ManufacturerDashboard() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUser(user)
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(profile)
      const { data: products } = await supabase.from('products').select('*').eq('manufacturer_id', user.id).order('created_at', { ascending: false })
      setProducts(products || [])
      setLoading(false)
    }
    load()
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-slate-500">Loading...</div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-slate-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-white font-bold text-xl">Midlync</span>
          <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full">MANUFACTURER</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-slate-300 text-sm">{profile?.company_name}</span>
          <button onClick={handleLogout} className="text-slate-400 hover:text-white text-sm transition">Logout</button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Products', value: products.length, icon: '📦' },
            { label: 'Active', value: products.filter(p => p.status === 'active').length, icon: '✅' },
            { label: 'Total Views', value: products.reduce((a, p) => a + (p.views || 0), 0), icon: '👁' },
            { label: 'Inquiries', value: products.reduce((a, p) => a + (p.inquiries || 0), 0), icon: '📩' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm">
              <div className="text-2xl mb-2">{s.icon}</div>
              <div className="text-2xl font-bold text-slate-900">{s.value}</div>
              <div className="text-xs text-slate-500 font-medium uppercase tracking-wide mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Action Bar */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <button
            onClick={() => router.push('/manufacturer/products')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl transition text-sm">
            + Add Product
          </button>
          <button className="bg-white border border-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition text-sm hover:bg-slate-50">
            📱 Print All QR
          </button>
          <button className="bg-white border border-slate-200 text-slate-700 font-semibold px-5 py-2.5 rounded-xl transition text-sm hover:bg-slate-50">
            📤 Export Catalogue
          </button>
        </div>

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
            <div className="text-5xl mb-4">📦</div>
            <div className="text-slate-500 text-lg mb-4">No products yet</div>
            <button
              onClick={() => router.push('/manufacturer/products')}
              className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl">
              + Add Your First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map(p => {
              const imgs = (() => { try { return JSON.parse(p.image_urls || '[]') } catch { return [] } })()
              const img = imgs[0] || p.image_url
              const syms: Record<string, string> = { USD: '$', INR: '₹', EUR: '€', GBP: '£' }
              const sym = syms[p.currency || 'USD'] || ''
              return (
                <div key={p.id} className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition">
                  <div className="aspect-square bg-slate-50 flex items-center justify-center overflow-hidden">
                    {img ? (
                      <img src={img} alt={p.title} className="w-full h-full object-contain p-2"/>
                    ) : (
                      <span className="text-5xl">📦</span>
                    )}
                  </div>
                  <div className="p-3">
                    <div className="font-bold text-sm text-slate-900 mb-1 truncate">{p.title}</div>
                    <div className="text-blue-600 font-bold text-sm mb-2">
                      {sym}{p.price_per_unit || '—'}<span className="text-slate-400 font-normal text-xs">/unit</span>
                    </div>
                    <div className="flex gap-1 flex-wrap mb-3">
                      {p.category && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{p.category}</span>}
                      {p.moq && <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">MOQ: {p.moq}</span>}
                    </div>
                    <div className="flex gap-1">
                      <button className="flex-1 text-xs bg-green-50 text-green-700 border border-green-200 font-bold py-1.5 rounded-lg">✏️ Edit</button>
                      <button className="flex-1 text-xs bg-blue-50 text-blue-700 border border-blue-200 font-bold py-1.5 rounded-lg">📱 QR</button>
                      <button className="flex-1 text-xs bg-red-50 text-red-600 border border-red-200 font-bold py-1.5 rounded-lg">✕ Del</button>
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