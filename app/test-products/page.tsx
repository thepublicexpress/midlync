import { createClient } from '@/lib/supabase/client'
import { generateManufacturerCode } from '@/lib/code-generator'

export default async function TestProductsPage() {
  const supabase = createClient()
  
  // Fetch products with simpler query
  const { data: products, error } = await supabase
    .from('products')
    .select('id, title, description, category, price_per_unit, currency, moq, manufacturer_id, image_url, status')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-2">🛍️ Test Products Page</h1>
        <p className="text-slate-600 mb-6">Public products display (no auth required)</p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">❌ Error: {error.message}</p>
            <p className="text-red-600 text-sm mt-1">{error.details}</p>
          </div>
        )}

        {!products || products.length === 0 ? (
          <div className="bg-white rounded-lg p-12 text-center border">
            <p className="text-lg text-slate-600">No products found</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-slate-600 mb-4">Found {products.length} product(s)</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p: any) => (
                <div key={p.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition">
                  <div className="aspect-square bg-slate-50 flex items-center justify-center">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.title} className="w-full h-full object-contain p-4" />
                    ) : (
                      <span className="text-5xl">📦</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-lg truncate">{p.title}</h3>
                    <p className="text-cyan-600 font-bold text-xl">₹{p.price_per_unit?.toLocaleString('en-IN') || '—'}</p>
                    
                    {p.manufacturer_id && (
                      <div className="mt-2 p-2 bg-slate-50 rounded text-xs">
                        <p className="text-slate-600">🏭 Seller Code:</p>
                        <p className="font-mono font-bold text-slate-800">{generateManufacturerCode(p.manufacturer_id)}</p>
                      </div>
                    )}
                    
                    {p.category && (
                      <p className="text-xs text-slate-500 mt-2">📂 {p.category}</p>
                    )}
                    
                    {p.moq && (
                      <p className="text-xs text-slate-500 mt-1">MOQ: {p.moq}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
