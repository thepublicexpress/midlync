'use client'
import { useState, useEffect, type ChangeEvent } from 'react'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'
import QRModal from '@/app/components/QRModal'

type CustomField = {
  label: string
  value: string
}

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [showImportPanel, setShowImportPanel] = useState(false)
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<any>(null)
  const [customFields, setCustomFields] = useState<CustomField[]>([{ label: '', value: '' }])
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState<{
    title: string
    description: string
    price_per_unit: string
    currency: string
    moq: string
    category: string
    images: string[]
    image_url: string
  }>({
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

  async function uploadImage(file: File) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Please login again')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', 'products')

    const response = await fetch('/api/uploads', {
      method: 'POST',
      body: formData,
    })

    const result = await response.json()
    if (!response.ok) throw new Error(result?.error || 'Upload failed')

    return result.url as string
  }

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    const newUrls: string[] = []
    for (const file of Array.from(files)) {
      try {
        const url = await uploadImage(file)
        newUrls.push(url)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        alert('Upload failed: ' + message)
      }
    }
    setForm({ ...form, images: [...form.images, ...newUrls] })
    setUploading(false)
  }

  function removeImage(index: number) {
    setForm({ ...form, images: form.images.filter((_, i) => i !== index) })
  }

  function addCustomField() {
    setCustomFields([...customFields, { label: '', value: '' }])
  }

  function updateCustomField(index: number, field: keyof CustomField, value: string) {
    const updated = [...customFields]
    updated[index][field] = value
    setCustomFields(updated)
  }

  function removeCustomField(index: number) {
    const updated = customFields.filter((_, i) => i !== index)
    setCustomFields(updated.length ? updated : [{ label: '', value: '' }])
  }

  function parseCustomFields(value: unknown): CustomField[] {
    if (!value) return [{ label: '', value: '' }]

    if (Array.isArray(value)) {
      return value.map((item) => {
        if (typeof item === 'string') return { label: item, value: '' }
        if (item && typeof item === 'object') {
          return {
            label: item.label || item.key || '',
            value: item.value || item.val || '',
          }
        }
        return { label: '', value: '' }
      }).filter((item) => item.label || item.value)
    }

    if (typeof value === 'object') {
      return Object.entries(value).map(([label, val]) => ({
        label,
        value: String(val),
      }))
    }

    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        return parseCustomFields(parsed)
      } catch {
        return [{ label: '', value: value }]
      }
    }

    return [{ label: '', value: '' }]
  }

  function buildSpecificationsPayload() {
    const specs: Record<string, string> = {}
    customFields
      .filter((field) => field.label.trim())
      .forEach((field) => {
        specs[field.label.trim()] = field.value
      })
    return Object.keys(specs).length > 0 ? specs : null
  }

  function normalizeImages(value: unknown): string[] {
    if (Array.isArray(value)) {
      return value
        .filter(Boolean)
        .map((item) => String(item))
    }

    if (typeof value === 'string') {
      return value
        .split(/,|;|\n/)
        .map((item) => item.trim())
        .filter(Boolean)
    }

    return []
  }

  function downloadSampleTemplate() {
    const sampleData = [
      {
        title: 'Cotton Fabric Roll',
        description: 'Premium quality cotton fabric, 100% natural',
        price: '2.50',
        currency: 'USD',
        moq: '100',
        category: 'Fabrics',
        image_url: 'https://example.com/image1.jpg',
        color: 'White',
        width: '54 inches',
        gsm: '150'
      },
      {
        title: 'Polyester Thread',
        description: 'High strength polyester thread for stitching',
        price: '0.50',
        currency: 'USD',
        moq: '500',
        category: 'Threads',
        image_url: 'https://example.com/image2.jpg',
        thread_count: '40/2',
        color: 'Black'
      }
    ]

    const ws = XLSX.utils.json_to_sheet(sampleData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Products')
    XLSX.writeFile(wb, 'product_import_template.xlsx')
  }

  function buildProductPayloadFromRow(row: Record<string, any>, userId: string) {
    const normalizedRow = Object.entries(row).reduce<Record<string, unknown>>((acc, [key, value]) => {
      acc[key.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')] = value
      return acc
    }, {})

    const title = String(normalizedRow.title ?? normalizedRow.product_name ?? normalizedRow.name ?? normalizedRow.product_title ?? normalizedRow.product ?? 'Untitled Product')
    const description = String(normalizedRow.description ?? normalizedRow.short_description ?? normalizedRow.details ?? '')
    const price = Number(normalizedRow.price ?? normalizedRow.price_per_unit ?? normalizedRow.unit_price ?? normalizedRow.price_per_piece ?? '0') || 0
    const currency = String(normalizedRow.currency ?? 'USD').toUpperCase()
    const moq = Number(normalizedRow.moq ?? normalizedRow.minimum_order_quantity ?? normalizedRow.minimum_order_qty ?? '0') || 0
    const category = String(normalizedRow.category ?? normalizedRow.product_category ?? '')
    const imageValues = normalizeImages(normalizedRow.images ?? normalizedRow.image_url ?? normalizedRow.image ?? normalizedRow.main_image ?? '')
    const imageUrl = imageValues[0] || String(normalizedRow.image_url ?? normalizedRow.image ?? normalizedRow.main_image ?? '')

    const specKeys = new Set([
      'title',
      'product_name',
      'name',
      'product_title',
      'product',
      'description',
      'short_description',
      'details',
      'price',
      'price_per_unit',
      'unit_price',
      'price_per_piece',
      'currency',
      'moq',
      'minimum_order_quantity',
      'minimum_order_qty',
      'category',
      'product_category',
      'images',
      'image_url',
      'image',
      'main_image',
      'status',
      'unit',
      'sku',
      'sub_category',
      'fabric_type',
      'gsm',
      'width',
      'color',
      'lead_time',
      'shipping_from',
      'country_of_origin',
      'hs_code',
      'warranty',
      'return_policy',
      'packaging_details',
      'care_instructions',
      'video_url',
      'additional_info',
    ])

    const specs: Record<string, string> = {}
    Object.entries(normalizedRow).forEach(([key, value]) => {
      if (specKeys.has(key) || value === '' || value === null || value === undefined) return
      specs[key.replace(/_/g, ' ')] = String(value)
    })

    return {
      manufacturer_id: userId,
      title,
      description,
      price_per_unit: price,
      currency,
      moq,
      category,
      images: imageValues,
      image_url: imageUrl,
      status: 'active',
      specifications: Object.keys(specs).length > 0 ? specs : null,
    }
  }

  async function handleBulkImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(extension || '')) {
      alert('Please upload a CSV or Excel file')
      event.target.value = ''
      return
    }

    setImporting(true)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' }) as Array<Record<string, unknown>>

      if (!rows.length) {
        throw new Error('No rows found in the selected file')
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please log in again')

      const validRows = rows.filter((row) => Object.values(row).some((value) => value !== '' && value !== null && value !== undefined))
      if (!validRows.length) {
        throw new Error('No product rows were found')
      }

      let insertedCount = 0
      for (const row of validRows) {
        const payload = buildProductPayloadFromRow(row, user.id)
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
        insertedCount += 1
      }

      setShowImportPanel(false)
      await loadProducts()
      alert(`Imported ${insertedCount} product${insertedCount === 1 ? '' : 's'} successfully`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert('Import failed: ' + message)
    } finally {
      setImporting(false)
      event.target.value = ''
    }
  }

  function openModal(product: any = null) {
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
      setCustomFields(parseCustomFields(product.specifications))
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
      setCustomFields([{ label: '', value: '' }])
    }
    setShowModal(true)
  }

  async function saveProduct(e: React.FormEvent<HTMLFormElement>) {
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
      specifications: buildSpecificationsPayload(),
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

  async function deleteProduct(id: string) {
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
        <div className="flex flex-col gap-3 md:flex-row md:justify-between md:items-center mb-6">
          <h1 className="text-2xl font-bold">My Products ({products.length})</h1>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setShowImportPanel((prev) => !prev)}
              className="bg-violet-600 hover:bg-violet-700 text-white px-5 py-2 rounded-xl transition"
            >
              {showImportPanel ? 'Hide Import' : '📥 Bulk Upload (Excel/CSV)'}
            </button>
            <button
              onClick={() => openModal()}
              className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-xl transition"
            >
              + Add Product
            </button>
          </div>
        </div>

        {showImportPanel && (
          <div className="bg-white rounded-2xl border p-5 mb-6 space-y-4">
            <div>
              <h2 className="font-semibold mb-3">Bulk Import Products</h2>
              
              <div className="bg-slate-50 border rounded-lg p-4 mb-4">
                <h3 className="font-medium text-sm mb-3">📋 Expected Format:</h3>
                <div className="text-xs text-slate-700 space-y-2">
                  <p><strong>Main Columns (flexible names):</strong></p>
                  <ul className="ml-4 space-y-1 mb-3">
                    <li>• <strong>Title:</strong> product, product_name, product_title, name</li>
                    <li>• <strong>Description:</strong> short_description, details</li>
                    <li>• <strong>Price:</strong> price_per_unit, unit_price, price_per_piece</li>
                    <li>• <strong>MOQ:</strong> minimum_order_quantity, minimum_order_qty</li>
                    <li>• <strong>Category:</strong> product_category</li>
                    <li>• <strong>Images:</strong> image_url, image, main_image (comma/semicolon separated for multiple)</li>
                    <li>• <strong>Currency:</strong> (optional, defaults to USD)</li>
                  </ul>
                  <p className="text-violet-700"><strong>✨ Tip:</strong> Any extra columns become custom fields (e.g., color, size, gsm, width)</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={downloadSampleTemplate}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
                >
                  📥 Download Template
                </button>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-violet-400 bg-violet-50 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100 transition">
                  <span>{importing ? 'Importing...' : 'Choose File'}</span>
                  <input type="file" accept=".csv,.xlsx,.xls" onChange={handleBulkImport} className="hidden" />
                </label>
              </div>
              {importing && <span className="ml-3 text-sm text-violet-600">Processing file...</span>}
            </div>
          </div>
        )}

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
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-h-[90vh] overflow-y-auto p-4 sm:p-6 sm:max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4 sticky top-0 bg-white pt-2">
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

              <div className="border-t pt-4 space-y-4">
                <div className="rounded-xl border border-dashed border-violet-300 bg-violet-50 p-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-violet-700">
                      Bulk Upload Products (Excel/CSV)
                    </label>
                    <span className="text-xs text-violet-600">Optional</span>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">
                    Upload a file with columns like title, description, price, category, moq, image_url and extra fields.
                  </p>
                  <label className="inline-flex cursor-pointer items-center rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm font-medium text-violet-700 hover:bg-violet-100">
                    <span>{importing ? 'Importing...' : 'Choose file'}</span>
                    <input type="file" accept=".csv,.xlsx,.xls" onChange={handleBulkImport} className="hidden" />
                  </label>
                  {importing && <span className="ml-3 text-sm text-violet-600">Processing...</span>}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold">
                      Extra Product Details
                    </label>
                    <button
                      type="button"
                      onClick={addCustomField}
                      className="text-sm text-cyan-600 hover:underline"
                    >
                      + Add Field
                    </button>
                  </div>
                  <div className="space-y-2">
                    {customFields.map((field, index) => (
                      <div key={index} className="grid grid-cols-[1fr_1fr_auto] gap-2">
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) => updateCustomField(index, 'label', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="Field name"
                        />
                        <input
                          type="text"
                          value={field.value}
                          onChange={(e) => updateCustomField(index, 'value', e.target.value)}
                          className="w-full border rounded-lg px-3 py-2 text-sm"
                          placeholder="Field value"
                        />
                        <button
                          type="button"
                          onClick={() => removeCustomField(index)}
                          className="text-sm text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Add any extra details you want, such as material, color, warranty, or special notes.
                  </p>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t sticky bottom-0 bg-white py-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 border rounded-lg py-2 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-cyan-600 text-white rounded-lg py-2 hover:bg-cyan-700"
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