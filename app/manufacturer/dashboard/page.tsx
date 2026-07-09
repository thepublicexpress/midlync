'use client'
import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import * as XLSX from 'xlsx'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'

export default function ManufacturerDashboard() {
  const [products, setProducts] = useState<any[]>([])
  const [orders, setOrders] = useState<any[]>([])
  const [inquiries, setInquiries] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showQuickAdd, setShowQuickAdd] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [showImportPanel, setShowImportPanel] = useState(false)
  const [customFields, setCustomFields] = useState([{ label: '', value: '' }])
  const [form, setForm] = useState({
    title: '',
    description: '',
    price_per_unit: '',
    currency: 'USD',
    moq: '',
    category: '',
    images: [] as string[],
    image_url: '',
  })
  const router = useRouter()
  const supabase = createClient()

  async function load() {
    try {
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

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('manufacturer_id', user.id)

      setProducts(productsData || [])

      const { data: ordersData } = await supabase
        .from('orders')
        .select('*')
        .eq('manufacturer_id', user.id)

      setOrders(ordersData || [])

      const { data: inquiriesData } = await supabase
        .from('product_inquiries')
        .select('*')
        .eq('manufacturer_id', user.id)

      setInquiries(inquiriesData || [])
    } catch (err) {
      console.error('Load error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function uploadImage(file: File) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Please log in again')

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

    setForm((prev) => ({ ...prev, images: [...prev.images, ...newUrls] }))
    setUploading(false)
  }

  function removeImage(index: number) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }))
  }

  function addCustomField() {
    setCustomFields([...customFields, { label: '', value: '' }])
  }

  function updateCustomField(index: number, field: 'label' | 'value', value: string) {
    const updated = [...customFields]
    updated[index][field] = value
    setCustomFields(updated)
  }

  function removeCustomField(index: number) {
    const updated = customFields.filter((_, i) => i !== index)
    setCustomFields(updated.length ? updated : [{ label: '', value: '' }])
  }

  function buildSpecificationsPayload() {
    const specs: Record<string, string> = {}
    customFields.filter((field) => field.label.trim()).forEach((field) => {
      specs[field.label.trim()] = field.value
    })
    return Object.keys(specs).length > 0 ? specs : null
  }

  async function handleQuickSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const productData = {
      manufacturer_id: user.id,
      title: form.title,
      description: form.description,
      price_per_unit: parseFloat(form.price_per_unit) || 0,
      currency: form.currency,
      moq: parseInt(form.moq, 10) || 0,
      category: form.category,
      images: form.images,
      image_url: form.images[0] || '',
      status: 'active',
      specifications: buildSpecificationsPayload(),
    }

    const { error } = await supabase.from('products').insert(productData)
    if (error) {
      alert('Error: ' + error.message)
    } else {
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
      load()
      alert('Product added successfully')
    }
  }

  function normalizeImages(value: unknown): string[] {
    if (Array.isArray(value)) return value.filter(Boolean).map((item) => String(item))
    if (typeof value === 'string') {
      return value.split(/,|;|\n/).map((item) => item.trim()).filter(Boolean)
    }
    return []
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
      'title', 'product_name', 'name', 'product_title', 'product', 'description', 'short_description', 'details',
      'price', 'price_per_unit', 'unit_price', 'price_per_piece', 'currency', 'moq', 'minimum_order_quantity',
      'minimum_order_qty', 'category', 'product_category', 'images', 'image_url', 'image', 'main_image',
      'status', 'unit', 'sku', 'sub_category', 'fabric_type', 'gsm', 'width', 'color', 'lead_time',
      'shipping_from', 'country_of_origin', 'hs_code', 'warranty', 'return_policy', 'packaging_details',
      'care_instructions', 'video_url', 'additional_info',
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

      if (!rows.length) throw new Error('No rows found in the selected file')

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Please log in again')

      const validRows = rows.filter((row) => Object.values(row).some((value) => value !== '' && value !== null && value !== undefined))
      if (!validRows.length) throw new Error('No product rows were found')

      let insertedCount = 0
      for (const row of validRows) {
        const payload = buildProductPayloadFromRow(row, user.id)
        const { error } = await supabase.from('products').insert(payload)
        if (error) throw error
        insertedCount += 1
      }

      setShowImportPanel(false)
      await load()
      alert(`Imported ${insertedCount} product${insertedCount === 1 ? '' : 's'} successfully`)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      alert('Import failed: ' + message)
    } finally {
      setImporting(false)
      event.target.value = ''
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500">Loading...</div>
      </div>
    )
  }

  const pendingOrders = orders.filter(o => o.stage < 5).length

  // 16 Menu Buttons for Manufacturer
  const menuItems = [
    // Row 1 - Main Modules
    { name: 'Dashboard', href: '/manufacturer/dashboard', icon: '📊', color: 'bg-slate-600' },
    { name: 'Products', href: '/manufacturer/products', icon: '📦', color: 'bg-blue-500', count: products.length },
    { name: 'Orders', href: '/manufacturer/orders', icon: '📋', color: 'bg-green-500', count: pendingOrders },
    { name: 'Inquiries', href: '/manufacturer/inquiries', icon: '📩', color: 'bg-purple-500', count: inquiries.length },
    
    // Row 2 - Sales & Catalogue
    { name: 'Catalogue', href: '/manufacturer/catalogue', icon: '📁', color: 'bg-orange-500' },
    { name: 'Invoices', href: '/manufacturer/invoices', icon: '🧾', color: 'bg-amber-500' },
    { name: 'Quotations', href: '/manufacturer/quotations', icon: '📝', color: 'bg-yellow-500' },
    { name: 'Trade Fair', href: '/manufacturer/trade-fair-report', icon: '🎪', color: 'bg-pink-500' },
    
    // Row 3 - Tools & Management
    { name: 'Inventory', href: '/manufacturer/inventory', icon: '📦', color: 'bg-teal-500' },
    { name: 'Inspections', href: '/manufacturer/inspections', icon: '🔍', color: 'bg-indigo-500' },
    { name: 'Analytics', href: '/manufacturer/analytics', icon: '📊', color: 'bg-red-500' },
    { name: 'Connections', href: '/manufacturer/connections', icon: '🤝', color: 'bg-cyan-500' },
    
    // Row 4 - Assets & Settings
    { name: 'Assets', href: '/manufacturer/assets', icon: '🖼️', color: 'bg-emerald-500' },
    { name: 'QR Labels', href: '/manufacturer/qr-labels', icon: '🏷️', color: 'bg-fuchsia-500' },
    { name: 'AI Tools', href: '/manufacturer/ai-catalogue', icon: '🤖', color: 'bg-sky-500' },
    { name: 'Settings', href: '/manufacturer/profile', icon: '⚙️', color: 'bg-gray-500' },
  ]

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {profile?.company_name || 'Manufacturer'}!
          </h1>
          <p className="text-slate-500">Manage your products, track orders, and grow your business.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="text-2xl mb-2">📦</div>
            <div className="text-2xl font-bold">{products.length}</div>
            <div className="text-xs text-slate-500">Total Products</div>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="text-2xl mb-2">✅</div>
            <div className="text-2xl font-bold">{products.filter(p => p.status === 'active').length}</div>
            <div className="text-xs text-slate-500">Active Products</div>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="text-2xl mb-2">📩</div>
            <div className="text-2xl font-bold">{inquiries.length}</div>
            <div className="text-xs text-slate-500">Total Inquiries</div>
          </div>
          <div className="bg-white rounded-xl p-5 border shadow-sm">
            <div className="text-2xl mb-2">📋</div>
            <div className="text-2xl font-bold">{pendingOrders}</div>
            <div className="text-xs text-slate-500">Pending Orders</div>
          </div>
        </div>

        {/* 16 Menu Buttons - 4x4 Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="bg-white rounded-xl p-4 text-center border shadow-sm hover:shadow-lg transition-all duration-200 group hover:-translate-y-1"
            >
              <div className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 text-white text-2xl shadow-md group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <div className="text-sm font-semibold text-slate-700">{item.name}</div>
              {item.count !== undefined && (
                <div className="text-xs text-slate-400 mt-1">{item.count}</div>
              )}
            </Link>
          ))}
        </div>

        {/* Recent Activity Section */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          {/* Recent Inquiries */}
          {inquiries.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">📩 Recent Inquiries</h3>
                <Link href="/manufacturer/inquiries" className="text-cyan-600 text-xs">View All</Link>
              </div>
              <div className="space-y-2">
                {inquiries.slice(0, 3).map((inq) => (
                  <div key={inq.id} className="text-sm border-b pb-2">
                    <p className="font-medium">{inq.products?.title || 'Product'}</p>
                    <p className="text-xs text-slate-500">{inq.message?.substring(0, 60)}...</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          {orders.length > 0 && (
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold">📋 Recent Orders</h3>
                <Link href="/manufacturer/orders" className="text-cyan-600 text-xs">View All</Link>
              </div>
              <div className="space-y-2">
                {orders.slice(0, 3).map((order) => (
                  <div key={order.id} className="text-sm border-b pb-2">
                    <p className="font-medium">Order #{order.order_number?.slice(0, 8)}</p>
                    <p className="text-xs text-slate-500">Amount: ₹{order.total_amount}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}