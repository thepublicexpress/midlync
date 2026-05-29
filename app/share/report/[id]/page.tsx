'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams } from 'next/navigation'

export default function SharedReportPage() {
  const [report, setReport] = useState(null)
  const [products, setProducts] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const params = useParams()
  const supabase = createClient()

  useEffect(() => {
    loadReport()
  }, [])

  async function loadReport() {
    const { data: reportData } = await supabase
      .from('trade_fair_reports')
      .select('*')
      .eq('id', params.id)
      .single()
    
    if (reportData) {
      setReport(reportData)
      
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .in('id', reportData.selected_products)
      
      setProducts(productsData || [])
      
      if (productsData && productsData[0]) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', productsData[0].manufacturer_id)
          .single()
        setProfile(profileData)
      }
    }
    setLoading(false)
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  if (!report) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Report not found</div>

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">{report.exhibition_name}</h1>
          <p className="text-slate-500 mt-2">Shared Catalogue from {profile?.company_name}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map(p => {
            let images = []
            try { images = typeof p.images === 'string' ? JSON.parse(p.images) : (p.images || []) } catch { images = [] }
            const mainImage = images[0] || p.image_url
            return (
              <div key={p.id} className="border rounded-xl p-4 hover:shadow-lg transition">
                <div className="aspect-square bg-slate-50 flex items-center justify-center rounded-lg">
                  {mainImage ? <img src={mainImage} className="w-full h-full object-contain p-4" /> : <span className="text-5xl">📦</span>}
                </div>
                <h3 className="font-bold text-lg mt-3">{p.title}</h3>
                <p className="text-cyan-600 font-bold">${p.price_per_unit}</p>
                <button className="mt-3 w-full bg-blue-600 text-white py-2 rounded-lg">Send Inquiry</button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}