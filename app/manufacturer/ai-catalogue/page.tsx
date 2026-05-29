'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function AICataloguePage() {
  const [products, setProducts] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState([])
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [generatedDescriptions, setGeneratedDescriptions] = useState({})
  const [currentProduct, setCurrentProduct] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [singleDescription, setSingleDescription] = useState('')
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 })
  const router = useRouter()
  const supabase = createClient()

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
    { code: 'gu', name: 'Gujarati', flag: '🇮🇳' },
    { code: 'ta', name: 'Tamil', flag: '🇮🇳' },
    { code: 'te', name: 'Telugu', flag: '🇮🇳' },
    { code: 'bn', name: 'Bengali', flag: '🇮🇳' },
    { code: 'mr', name: 'Marathi', flag: '🇮🇳' }
  ]

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(profileData)
    const { data: productsData } = await supabase.from('products').select('*').eq('manufacturer_id', user.id)
    setProducts(productsData || [])
    
    // Load existing AI descriptions
    const { data: descriptions } = await supabase.from('ai_descriptions').select('product_id, generated_text, language')
    if (descriptions) {
      const descMap = {}
      descriptions.forEach(d => {
        descMap[`${d.product_id}_${d.language}`] = d.generated_text
      })
      setGeneratedDescriptions(descMap)
    }
    
    setLoading(false)
  }

  function toggleProduct(id) {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(p => p !== id))
    } else {
      setSelectedProducts([...selectedProducts, id])
    }
  }

  function selectAll() {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([])
    } else {
      setSelectedProducts(products.map(p => p.id))
    }
  }

  async function generateSingle(product) {
    setCurrentProduct(product)
    setSingleDescription('')
    setShowModal(true)
    setGenerating(true)
    
    try {
      const response = await fetch('/api/ai-catalogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id,
          productTitle: product.title,
          productCategory: product.category,
          productFeatures: product.features,
          language: selectedLanguage
        })
      })
      const data = await response.json()
      if (data.success) {
        setSingleDescription(data.description)
        setGeneratedDescriptions(prev => ({
          ...prev,
          [`${product.id}_${selectedLanguage}`]: data.description
        }))
      } else {
        alert('Error: ' + data.error)
      }
    } catch (err) {
      alert('Failed to generate: ' + err.message)
    }
    setGenerating(false)
  }

  async function generateBatch() {
    const productsToGenerate = selectedProducts.length > 0 ? selectedProducts : products.map(p => p.id)
    if (productsToGenerate.length === 0) {
      alert('No products selected')
      return
    }
    
    setGenerating(true)
    setBatchProgress({ current: 0, total: productsToGenerate.length })
    
    try {
      const response = await fetch('/api/ai-catalogue/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: selectedLanguage,
          productIds: productsToGenerate
        })
      })
      const data = await response.json()
      if (data.success) {
        alert(`Generated ${data.results.filter(r => r.success).length} of ${data.total} descriptions`)
        // Refresh descriptions
        const { data: descriptions } = await supabase.from('ai_descriptions').select('product_id, generated_text, language')
        const descMap = {}
        descriptions?.forEach(d => {
          descMap[`${d.product_id}_${d.language}`] = d.generated_text
        })
        setGeneratedDescriptions(descMap)
      } else {
        alert('Error: ' + data.error)
      }
    } catch (err) {
      alert('Batch generation failed: ' + err.message)
    }
    setGenerating(false)
    setBatchProgress({ current: 0, total: 0 })
  }

  async function saveDescription(productId, description) {
    if (!description) return
    setGenerating(true)
    try {
      const response = await fetch('/api/ai-catalogue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          productTitle: products.find(p => p.id === productId)?.title,
          language: selectedLanguage
        })
      })
      const data = await response.json()
      if (data.success) {
        alert('Description saved to product!')
        // Update product description in database
        await supabase.from('products').update({ description: data.description }).eq('id', productId)
        setGeneratedDescriptions(prev => ({
          ...prev,
          [`${productId}_${selectedLanguage}`]: data.description
        }))
      }
    } catch (err) {
      alert('Failed to save: ' + err.message)
    }
    setGenerating(false)
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">AI Catalogue Text Generator</h1>
            <p className="text-slate-500 text-sm">Generate professional product descriptions using AI (Gemini)</p>
          </div>
          <button onClick={() => router.push('/manufacturer/dashboard')} className="text-slate-600 hover:text-slate-800">← Back</button>
        </div>

        {/* Language Selection */}
        <div className="bg-white rounded-xl p-5 mb-6 shadow-sm">
          <h2 className="font-semibold mb-3">🌐 Select Language</h2>
          <div className="flex flex-wrap gap-3">
            {languages.map(lang => (
              <button
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                  selectedLanguage === lang.code ? 'bg-cyan-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Batch Actions */}
        <div className="bg-white rounded-xl p-5 mb-6 shadow-sm">
          <div className="flex justify-between items-center flex-wrap gap-3">
            <div>
              <h2 className="font-semibold">Batch Generation</h2>
              <p className="text-sm text-slate-500">Generate descriptions for multiple products at once</p>
            </div>
            <div className="flex gap-3">
              <button onClick={selectAll} className="px-4 py-2 border rounded-lg text-sm hover:bg-slate-50">
                {selectedProducts.length === products.length ? 'Deselect All' : 'Select All'}
              </button>
              <button onClick={generateBatch} disabled={generating || products.length === 0}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg disabled:opacity-50 transition">
                {generating ? `Generating... ${batchProgress.current}/${batchProgress.total}` : '🚀 Generate All Selected'}
              </button>
            </div>
          </div>
          {generating && batchProgress.total > 0 && (
            <div className="mt-3 w-full bg-slate-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full transition-all" style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}></div>
            </div>
          )}
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4 text-left w-12">Select</th>
                <th className="p-4 text-left">Product</th>
                <th className="p-4 text-left">Category</th>
                <th className="p-4 text-left">Current Description</th>
                <th className="p-4 text-left">AI Generated</th>
                <th className="p-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id} className="border-b hover:bg-slate-50">
                  <td className="p-4">
                    <input type="checkbox" checked={selectedProducts.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                  </td>
                  <td className="p-4 font-medium">{p.title}</td>
                  <td className="p-4">{p.category || '-'}</td>
                  <td className="p-4 max-w-xs">
                    <p className="text-sm text-slate-600 line-clamp-2">{p.description || 'No description'}</p>
                  </td>
                  <td className="p-4 max-w-xs">
                    {generatedDescriptions[`${p.id}_${selectedLanguage}`] ? (
                      <p className="text-sm text-cyan-600 line-clamp-2">{generatedDescriptions[`${p.id}_${selectedLanguage}`]}</p>
                    ) : (
                      <span className="text-slate-400 text-sm">Not generated</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => generateSingle(p)} disabled={generating}
                        className="bg-cyan-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50">
                        Generate
                      </button>
                      {generatedDescriptions[`${p.id}_${selectedLanguage}`] && (
                        <button onClick={() => saveDescription(p.id, generatedDescriptions[`${p.id}_${selectedLanguage}`])} disabled={generating}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50">
                          Save
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500">No products found. Add products first.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Single Product Modal */}
      {showModal && currentProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">AI Generated Description</h2>
              <p className="text-slate-500 text-sm">Product: {currentProduct.title}</p>
            </div>
            <div className="p-6">
              {generating ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-600 mx-auto mb-3"></div>
                  <p className="text-slate-500">Generating description with AI...</p>
                </div>
              ) : (
                <>
                  <div className="bg-slate-50 rounded-lg p-4 mb-4">
                    <p className="whitespace-pre-wrap text-slate-700">{singleDescription}</p>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => saveDescription(currentProduct.id, singleDescription)} className="flex-1 bg-green-600 text-white py-2 rounded-lg">
                      Save to Product
                    </button>
                    <button onClick={() => generateSingle(currentProduct)} className="flex-1 bg-cyan-600 text-white py-2 rounded-lg">
                      Regenerate
                    </button>
                    <button onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded-lg">
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}