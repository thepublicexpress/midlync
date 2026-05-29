'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function QuotationMakerPage() {
  const [products, setProducts] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [quotations, setQuotations] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editingQuote, setEditingQuote] = useState(null)
  const [showHistory, setShowHistory] = useState(false)
  const [selectedQuote, setSelectedQuote] = useState(null)
  const [currencyRates, setCurrencyRates] = useState({
    USD: 1, EUR: 0.92, GBP: 0.79, INR: 83.5, AED: 3.67, SGD: 1.35
  })
  
  const [form, setForm] = useState({
    buyerName: '',
    buyerEmail: '',
    buyerCompany: '',
    buyerAddress: '',
    buyerGst: '',
    selectedProducts: [],
    quantities: {},
    currency: 'USD',
    taxRate: 18,
    validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
    paymentTerms: '50% advance, 50% before shipment',
    deliveryTerms: 'FOB Mumbai',
    notes: '',
    termsConditions: '1. Prices are exclusive of GST\n2. Payment terms as mentioned\n3. Delivery subject to force majeure'
  })

  const router = useRouter()
  const supabase = createClient()

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
    
    const { data: quotesData } = await supabase.from('quotations').select('*').eq('manufacturer_id', user.id).order('created_at', { ascending: false })
    setQuotations(quotesData || [])
    setLoading(false)
  }

  function toggleProduct(productId) {
    if (form.selectedProducts.includes(productId)) {
      setForm({
        ...form,
        selectedProducts: form.selectedProducts.filter(id => id !== productId),
        quantities: { ...form.quantities, [productId]: 0 }
      })
    } else {
      setForm({
        ...form,
        selectedProducts: [...form.selectedProducts, productId],
        quantities: { ...form.quantities, [productId]: 1 }
      })
    }
  }

  function updateQuantity(productId, qty) {
    setForm({ ...form, quantities: { ...form.quantities, [productId]: parseInt(qty) || 0 } })
  }

  function getSelectedProductsData() {
    return products.filter(p => form.selectedProducts.includes(p.id))
  }

  function calculateSubtotal() {
    const selected = getSelectedProductsData()
    return selected.reduce((sum, p) => sum + (p.price_per_unit || 0) * (form.quantities[p.id] || 1), 0)
  }

  function calculateTax() {
    return (calculateSubtotal() * form.taxRate) / 100
  }

  function calculateTotal() {
    return calculateSubtotal() + calculateTax()
  }

  function formatCurrency(amount) {
    const symbol = form.currency === 'INR' ? '₹' : form.currency === 'EUR' ? '€' : form.currency === 'GBP' ? '£' : '$'
    return `${symbol}${amount.toFixed(2)}`
  }

  async function saveQuotation(version = 1, parentId = null) {
    const quoteNumber = `QT-${Date.now()}-${version}`
    const productsData = getSelectedProductsData().map(p => ({
      id: p.id,
      title: p.title,
      price: p.price_per_unit,
      currency: p.currency,
      quantity: form.quantities[p.id] || 1,
      moq: p.moq,
      category: p.category
    }))

    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase.from('quotations').insert({
      manufacturer_id: user.id,
      quote_number: quoteNumber,
      version: version,
      parent_quote_id: parentId,
      products: productsData,
      buyer_details: {
        name: form.buyerName,
        email: form.buyerEmail,
        company: form.buyerCompany,
        address: form.buyerAddress,
        gst: form.buyerGst
      },
      subtotal: calculateSubtotal(),
      tax_rate: form.taxRate,
      tax_amount: calculateTax(),
      total_amount: calculateTotal(),
      currency: form.currency,
      valid_until: form.validUntil,
      payment_terms: form.paymentTerms,
      delivery_terms: form.deliveryTerms,
      notes: form.notes,
      terms_conditions: form.termsConditions,
      status: 'draft'
    })

    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert(`Quotation ${quoteNumber} saved!`)
      setShowModal(false)
      loadData()
      setForm({
        buyerName: '', buyerEmail: '', buyerCompany: '', buyerAddress: '', buyerGst: '',
        selectedProducts: [], quantities: {}, currency: 'USD', taxRate: 18,
        validUntil: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
        paymentTerms: '50% advance, 50% before shipment',
        deliveryTerms: 'FOB Mumbai',
        notes: '',
        termsConditions: '1. Prices are exclusive of GST\n2. Payment terms as mentioned\n3. Delivery subject to force majeure'
      })
    }
  }

  async function createRevision(quote) {
    // Load existing quotation data
    setEditingQuote(quote)
    setForm({
      buyerName: quote.buyer_details?.name || '',
      buyerEmail: quote.buyer_details?.email || '',
      buyerCompany: quote.buyer_details?.company || '',
      buyerAddress: quote.buyer_details?.address || '',
      buyerGst: quote.buyer_details?.gst || '',
      selectedProducts: quote.products?.map(p => p.id) || [],
      quantities: Object.fromEntries(quote.products?.map(p => [p.id, p.quantity]) || []),
      currency: quote.currency || 'USD',
      taxRate: quote.tax_rate || 18,
      validUntil: quote.valid_until?.split('T')[0] || '',
      paymentTerms: quote.payment_terms || '',
      deliveryTerms: quote.delivery_terms || '',
      notes: quote.notes || '',
      termsConditions: quote.terms_conditions || ''
    })
    setShowModal(true)
  }

  async function sendQuotation(quote) {
    const subject = encodeURIComponent(`Quotation ${quote.quote_number} from ${profile?.company_name}`)
    const body = encodeURIComponent(`Dear Customer,\n\nPlease find attached our quotation ${quote.quote_number}.\n\nTotal Amount: ${quote.currency === 'INR' ? '₹' : '$'}${quote.total_amount}\nValid Until: ${new Date(quote.valid_until).toLocaleDateString()}\n\nFor details, please login to your account.\n\nThanks,\n${profile?.company_name}`)
    window.location.href = `mailto:${quote.buyer_details?.email}?subject=${subject}&body=${body}`
  }

  function printQuotation(quote) {
    const printWindow = window.open('', '_blank')
    printWindow?.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Quotation ${quote.quote_number}</title>
        <style>
          body { font-family: Arial; padding: 40px; }
          .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
          .company { font-size: 28px; font-weight: bold; color: #0891b2; }
          .quote-title { font-size: 24px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
          th { background: #f3f4f6; }
          .total { text-align: right; font-size: 18px; font-weight: bold; }
          .footer { margin-top: 40px; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div><div class="company">Midlync</div><div>${profile?.company_name}</div><div>${profile?.address || ''}</div><div>GST: ${profile?.gst || ''}</div></div>
          <div><div class="quote-title">QUOTATION</div><div>No: ${quote.quote_number}</div><div>Version: ${quote.version}</div><div>Date: ${new Date(quote.created_at).toLocaleDateString()}</div></div>
        </div>
        <div><strong>To:</strong><br/>${quote.buyer_details?.company || quote.buyer_details?.name}<br/>${quote.buyer_details?.address}<br/>GST: ${quote.buyer_details?.gst || 'N/A'}</div>
        <table><thead><tr><th>#</th><th>Product</th><th>Quantity</th><th>Unit Price</th><th>Amount</th></tr></thead>
        <tbody>${quote.products?.map((p, i) => `<tr><td>${i+1}</td><td>${p.title}</td><td>${p.quantity}</td><td>${quote.currency === 'INR' ? '₹' : '$'}${p.price}</td><td>${quote.currency === 'INR' ? '₹' : '$'}${p.price * p.quantity}</td></tr>`).join('')}</tbody>
        <tfoot><tr><td colspan="4" style="text-align:right"><strong>Subtotal</strong></td><td>${quote.currency === 'INR' ? '₹' : '$'}${quote.subtotal}</td></tr>
        <tr><td colspan="4" style="text-align:right"><strong>Tax (${quote.tax_rate}%)</strong></td><td>${quote.currency === 'INR' ? '₹' : '$'}${quote.tax_amount}</td></tr>
        <tr><td colspan="4" style="text-align:right"><strong>Total</strong></td><td><strong>${quote.currency === 'INR' ? '₹' : '$'}${quote.total_amount}</strong></td></tr></tfoot>
        </table>
        <div><strong>Valid Until:</strong> ${new Date(quote.valid_until).toLocaleDateString()}</div>
        <div><strong>Payment Terms:</strong> ${quote.payment_terms}</div>
        <div><strong>Delivery Terms:</strong> ${quote.delivery_terms}</div>
        <div class="footer"><p>${quote.terms_conditions}</p><p>For ${profile?.company_name}</p></div>
      </body>
      </html>
    `)
    printWindow?.document.close()
    printWindow?.print()
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Quotation Maker</h1>
            <p className="text-slate-500 text-sm">Multi-currency quotations with revision tracking</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-xl transition">
            + New Quotation
          </button>
        </div>

        {/* Quotations List */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr><th className="p-4 text-left">Quote No</th><th className="p-4 text-left">Buyer</th><th className="p-4 text-left">Date</th><th className="p-4 text-left">Total</th><th className="p-4 text-left">Status</th><th className="p-4 text-left">Actions</th></tr>
            </thead>
            <tbody>
              {quotations.map(q => (
                <tr key={q.id} className="border-b hover:bg-slate-50">
                  <td className="p-4 font-mono text-sm">{q.quote_number}</td>
                  <td className="p-4">{q.buyer_details?.company || q.buyer_details?.name}</td>
                  <td className="p-4">{new Date(q.created_at).toLocaleDateString()}</td>
                  <td className="p-4">{q.currency === 'INR' ? '₹' : '$'}{q.total_amount}</td>
                  <td className="p-4"><span className={`px-2 py-1 rounded-full text-xs ${q.status === 'sent' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{q.status}</span></td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button onClick={() => printQuotation(q)} className="text-blue-600">🖨️</button>
                      <button onClick={() => sendQuotation(q)} className="text-green-600">📧</button>
                      <button onClick={() => createRevision(q)} className="text-purple-600">📝 Revision</button>
                    </div>
                  </td>
                </tr>
              ))}
              {quotations.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-slate-500">No quotations yet. Create your first quotation.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quotation Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">{editingQuote ? `Revision ${editingQuote.version + 1}` : 'New Quotation'}</h2>
            </div>
            <div className="p-6 space-y-6">
              {/* Buyer Details */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">Buyer Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <input type="text" placeholder="Buyer Name *" value={form.buyerName} onChange={e => setForm({...form, buyerName: e.target.value})} className="border rounded-lg p-2" />
                  <input type="email" placeholder="Buyer Email *" value={form.buyerEmail} onChange={e => setForm({...form, buyerEmail: e.target.value})} className="border rounded-lg p-2" />
                  <input type="text" placeholder="Company Name" value={form.buyerCompany} onChange={e => setForm({...form, buyerCompany: e.target.value})} className="border rounded-lg p-2" />
                  <input type="text" placeholder="GST Number" value={form.buyerGst} onChange={e => setForm({...form, buyerGst: e.target.value})} className="border rounded-lg p-2" />
                  <textarea placeholder="Address" rows={2} value={form.buyerAddress} onChange={e => setForm({...form, buyerAddress: e.target.value})} className="md:col-span-2 border rounded-lg p-2" />
                </div>
              </div>

              {/* Products */}
              <div className="border-b pb-4">
                <h3 className="font-semibold mb-3">Products</h3>
                <div className="space-y-2">
                  {products.map(p => (
                    <label key={p.id} className="flex items-center gap-3 p-2 border rounded-lg hover:bg-slate-50">
                      <input type="checkbox" checked={form.selectedProducts.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                      <span className="flex-1">{p.title}</span>
                      <span className="text-cyan-600">${p.price_per_unit}</span>
                      {form.selectedProducts.includes(p.id) && (
                        <input type="number" min="1" value={form.quantities[p.id] || 1} onChange={e => updateQuantity(p.id, e.target.value)} className="w-20 border rounded p-1 text-center" />
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Quote Details */}
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold">Currency</label>
                  <select value={form.currency} onChange={e => setForm({...form, currency: e.target.value})} className="w-full border rounded-lg p-2">
                    <option value="USD">USD ($)</option><option value="INR">INR (₹)</option><option value="EUR">EUR (€)</option><option value="GBP">GBP (£)</option><option value="AED">AED (د.إ)</option><option value="SGD">SGD ($)</option>
                  </select>
                </div>
                <div><label className="block text-sm font-semibold">Tax Rate (%)</label><input type="number" value={form.taxRate} onChange={e => setForm({...form, taxRate: parseFloat(e.target.value)})} className="w-full border rounded-lg p-2" /></div>
                <div><label className="block text-sm font-semibold">Valid Until</label><input type="date" value={form.validUntil} onChange={e => setForm({...form, validUntil: e.target.value})} className="w-full border rounded-lg p-2" /></div>
                <div><label className="block text-sm font-semibold">Payment Terms</label><input type="text" value={form.paymentTerms} onChange={e => setForm({...form, paymentTerms: e.target.value})} className="w-full border rounded-lg p-2" /></div>
                <div><label className="block text-sm font-semibold">Delivery Terms</label><input type="text" value={form.deliveryTerms} onChange={e => setForm({...form, deliveryTerms: e.target.value})} className="w-full border rounded-lg p-2" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-semibold">Notes</label><textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border rounded-lg p-2" /></div>
              </div>

              {/* Summary */}
              {form.selectedProducts.length > 0 && (
                <div className="bg-slate-50 rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Summary</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(calculateSubtotal())}</span></div>
                    <div className="flex justify-between"><span>Tax ({form.taxRate}%):</span><span>{formatCurrency(calculateTax())}</span></div>
                    <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total:</span><span>{formatCurrency(calculateTotal())}</span></div>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button onClick={() => saveQuotation(editingQuote ? editingQuote.version + 1 : 1, editingQuote?.id)} disabled={!form.buyerName || form.selectedProducts.length === 0} className="flex-1 bg-cyan-600 text-white py-2 rounded-lg disabled:opacity-50">
                  {editingQuote ? 'Save as Revision' : 'Save Quotation'}
                </button>
                <button onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}