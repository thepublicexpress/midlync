'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import QRModal from '@/app/components/QRModal'

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    title: '',
    description: '',
    price_per_unit: '',
    currency: 'USD',
    moq: '',
    category: '',
    images: [],
    image_url: '',
  })

  useEffect(() => {
    loadProducts()
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(data)
    }
  }

  async function loadProducts() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    const { data } = await supabase
      .from('products')
      .select('*')
      .eq('manufacturer_id', user.id)
      .order('created_at', { ascending: false })

    setProducts(data || [])
    setLoading(false)
  }

  async function uploadImage(file) {
    const { data: { user } } = await supabase.auth.getUser()
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `products/${user.id}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)

    return publicUrl
  }

  async function handleImageUpload(e) {
    const files = e.target.files
    if (!files.length) return
    setUploading(true)
    const newUrls = []
    for (let i = 0; i < files.length; i++) {
      try {
        const url = await uploadImage(files[i])
        newUrls.push(url)
      } catch (err) {
        alert('Upload failed: ' + err.message)
      }
    }
    setForm({ ...form, images: [...form.images, ...newUrls] })
    setUploading(false)
  }

  function removeImage(index) {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) })
  }

  function openModal(product = null) {
    if (product) {
      setEditingProduct(product)
      let images = []
      try {
        images = typeof product.images === 'string' ? JSON.parse(product.images) : (product.images || [])
      } catch {
        images = []
      }
      setForm({
        title: product.title || '',
        description: product.description || '',
        price_per_unit: product.price_per_unit || '',
        currency: product.currency || 'USD',
        moq: product.moq || '',
        category: product.category || '',
        images: images,
        image_url: product.image_url || '',
      })
    } else {
      setEditingProduct(null)
      setForm({
        title: '',
        description: '',
        price_per_unit: '',
        currency: 'USD',
        moq: '',
        category: '',
        images: [],
        image_url: '',
      })
    }
    setShowModal(true)
  }

  async function saveProduct(e) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const productData = {
      manufacturer_id: user.id,
      title: form.title,
      description: form.description,
      price_per_unit: parseFloat(form.price_per_unit) || 0,
      currency: form.currency,
      moq: parseInt(form.moq) || 0,
      category: form.category,
      images: form.images,
      image_url: form.images[0] || '',
      status: 'active',
    }

    let error
    if (editingProduct) {
      const { error: updateError } = await supabase
        .from('products')
        .update(productData)
        .eq('id', editingProduct.id)
      error = updateError
    } else {
      const { error: insertError } = await supabase
        .from('products')
        .insert(productData)
      error = insertError
    }

    if (error) {
      alert('Error: ' + error.message)
    } else {
      setShowModal(false)
      loadProducts()
    }
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      loadProducts()
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Products ({products.length})</h1>
          <button
            onClick={() => openModal()}
            className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-xl transition"
          >
            + Add Product
          </button>
        </div>

        {products.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border">
            <div className="text-6xl mb-4">📦</div>
            <p className="text-slate-500 mb-4">No products yet</p>
            <button
              onClick={() => openModal()}
              className="bg-cyan-600 text-white px-6 py-3 rounded-xl"
            >
              + Add Your First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {products.map((p) => {
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
                  className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition"
                >
                  <div
                    onClick={() => router.push(`/manufacturer/products/${p.id}`)}
                    className="aspect-square bg-slate-50 flex items-center justify-center cursor-pointer"
                  >
                    {mainImage ? (
                      <img
                        src={mainImage}
                        alt={p.title}
                        className="w-full h-full object-contain p-4"
                      />
                    ) : (
                      <span className="text-5xl">📦</span>
                    )}
                  </div>
                  <div className="p-4">
                    <h3
                      onClick={() => router.push(`/manufacturer/products/${p.id}`)}
                      className="font-bold text-lg truncate cursor-pointer hover:text-cyan-600"
                    >
                      {p.title}
                    </h3>
                    <div className="text-cyan-600 font-bold text-lg">
                      ${p.price_per_unit || '—'}
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => openModal(p)}
                        className="flex-1 text-sm bg-green-600 text-white py-1.5 rounded hover:bg-green-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteProduct(p.id)}
                        className="flex-1 text-sm bg-red-600 text-white py-1.5 rounded hover:bg-red-700"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => {
                          setSelectedProduct(p)
                          setQrModalOpen(true)
                        }}
                        className="flex-1 text-sm bg-blue-600 text-white py-1.5 rounded hover:bg-blue-700"
                      >
                        QR
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">
              {editingProduct ? 'Edit Product' : 'Add Product'}
            </h2>
            <form onSubmit={saveProduct} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">
                  Product Images
                </label>
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square bg-slate-100 rounded">
                      <img
                        src={img}
                        alt=""
                        className="w-full h-full object-cover rounded"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-lg text-sm inline-block">
                  📤 Upload Images
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                {uploading && <span className="ml-2 text-sm">Uploading...</span>}
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Product name"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2"
                  placeholder="Product description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Price per Unit
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.price_per_unit}
                    onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Currency
                  </label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                  >
                    <option value="USD">USD ($)</option>
                    <option value="INR">INR (₹)</option>
                    <option value="EUR">EUR (€)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    MOQ
                  </label>
                  <input
                    type="number"
                    value={form.moq}
                    onChange={(e) => setForm({ ...form, moq: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full border rounded-lg px-4 py-2"
                    placeholder="Fabric, Garment, etc."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border rounded-lg py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-600 text-white rounded-lg py-2"
                >
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <QRModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  )
}