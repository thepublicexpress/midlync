'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts'

export default function AnalyticsPage() {
  const [profile, setProfile] = useState(null)
  const [products, setProducts] = useState([])
  const [viewsData, setViewsData] = useState([])
  const [inquiriesData, setInquiriesData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [categoryStats, setCategoryStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('week')
  const router = useRouter()
  const supabase = createClient()

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

  useEffect(() => {
    loadData()
  }, [timeRange])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(profileData)

    const { data: productsData } = await supabase.from('products').select('*').eq('manufacturer_id', user.id)
    setProducts(productsData || [])

    // Get date range
    const now = new Date()
    let startDate = new Date()
    if (timeRange === 'week') startDate.setDate(now.getDate() - 7)
    if (timeRange === 'month') startDate.setMonth(now.getMonth() - 1)
    if (timeRange === 'year') startDate.setFullYear(now.getFullYear() - 1)

    // Get product views
    const { data: views } = await supabase
      .from('product_views')
      .select('product_id, viewed_at')
      .gte('viewed_at', startDate.toISOString())
    
    // Get inquiries
    const { data: inquiries } = await supabase
      .from('product_inquiries')
      .select('product_id, created_at')
      .gte('created_at', startDate.toISOString())

    // Process views data for chart
    const viewsByDay = {}
    views?.forEach(v => {
      const day = new Date(v.viewed_at).toLocaleDateString()
      viewsByDay[day] = (viewsByDay[day] || 0) + 1
    })
    setViewsData(Object.entries(viewsByDay).map(([date, count]) => ({ date, views: count })))

    // Process inquiries data
    const inquiriesByDay = {}
    inquiries?.forEach(i => {
      const day = new Date(i.created_at).toLocaleDateString()
      inquiriesByDay[day] = (inquiriesByDay[day] || 0) + 1
    })
    setInquiriesData(Object.entries(inquiriesByDay).map(([date, count]) => ({ date, inquiries: count })))

    // Top products by views
    const productViews = {}
    views?.forEach(v => {
      productViews[v.product_id] = (productViews[v.product_id] || 0) + 1
    })
    const top = Object.entries(productViews)
      .map(([id, count]) => {
        const product = productsData?.find(p => p.id === id)
        return { name: product?.title || 'Unknown', views: count, price: product?.price_per_unit }
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 5)
    setTopProducts(top)

    // Category stats
    const categoryCount = {}
    productsData?.forEach(p => {
      if (p.category) {
        categoryCount[p.category] = (categoryCount[p.category] || 0) + 1
      }
    })
    setCategoryStats(Object.entries(categoryCount).map(([name, value]) => ({ name, value })))

    setLoading(false)
  }

  const totalViews = viewsData.reduce((sum, d) => sum + d.views, 0)
  const totalInquiries = inquiriesData.reduce((sum, d) => sum + d.inquiries, 0)
  const conversionRate = totalViews > 0 ? ((totalInquiries / totalViews) * 100).toFixed(1) : 0

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading analytics...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
            <p className="text-slate-500 text-sm">Track product performance and buyer behavior</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setTimeRange('week')} className={`px-4 py-2 rounded-lg ${timeRange === 'week' ? 'bg-cyan-600 text-white' : 'bg-white border'}`}>Week</button>
            <button onClick={() => setTimeRange('month')} className={`px-4 py-2 rounded-lg ${timeRange === 'month' ? 'bg-cyan-600 text-white' : 'bg-white border'}`}>Month</button>
            <button onClick={() => setTimeRange('year')} className={`px-4 py-2 rounded-lg ${timeRange === 'year' ? 'bg-cyan-600 text-white' : 'bg-white border'}`}>Year</button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="text-2xl mb-2">📦</div>
            <div className="text-2xl font-bold">{products.length}</div>
            <div className="text-xs text-slate-500">Total Products</div>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="text-2xl mb-2">👁</div>
            <div className="text-2xl font-bold">{totalViews}</div>
            <div className="text-xs text-slate-500">Total Views</div>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="text-2xl mb-2">📩</div>
            <div className="text-2xl font-bold">{totalInquiries}</div>
            <div className="text-xs text-slate-500">Inquiries</div>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="text-2xl mb-2">📊</div>
            <div className="text-2xl font-bold">{conversionRate}%</div>
            <div className="text-xs text-slate-500">Conversion Rate</div>
          </div>
        </div>

        {/* Views & Inquiries Chart */}
        <div className="bg-white rounded-xl p-6 border shadow-sm mb-8">
          <h2 className="text-lg font-semibold mb-4">Views & Inquiries Trend</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={viewsData.map((v, i) => ({ ...v, inquiries: inquiriesData[i]?.inquiries || 0 }))}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="views" stroke="#0891b2" name="Views" />
              <Line type="monotone" dataKey="inquiries" stroke="#f59e0b" name="Inquiries" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Top Products & Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Top Products */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Top Performing Products</h2>
            {topProducts.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No views data yet</p>
            ) : (
              <div className="space-y-3">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-bold text-cyan-600">#{i+1}</span>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-slate-400">${p.price}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">{p.views}</p>
                      <p className="text-xs text-slate-400">views</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Category Distribution */}
          <div className="bg-white rounded-xl p-6 border shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Products by Category</h2>
            {categoryStats.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No categories yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={categoryStats} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                    {categoryStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Product Performance Table */}
        <div className="bg-white rounded-xl p-6 border shadow-sm">
          <h2 className="text-lg font-semibold mb-4">All Products Performance</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr><th className="p-3 text-left">Product</th><th className="p-3 text-left">Category</th><th className="p-3 text-left">Price</th><th className="p-3 text-left">Views</th><th className="p-3 text-left">Inquiries</th><th className="p-3 text-left">Conversion</th></tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const views = viewsData.filter(v => v.product_id === p.id)?.length || 0
                  const inquiries = inquiriesData.filter(i => i.product_id === p.id)?.length || 0
                  const conv = views > 0 ? ((inquiries / views) * 100).toFixed(1) : 0
                  return (
                    <tr key={p.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium">{p.title}</td>
                      <td className="p-3">{p.category || '-'}</td>
                      <td className="p-3">${p.price_per_unit}</td>
                      <td className="p-3">{views}</td>
                      <td className="p-3">{inquiries}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${conv > 10 ? 'bg-green-100 text-green-700' : conv > 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-700'}`}>
                          {conv}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}