'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function InvoicesPage() {
  const [products, setProducts] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [printing, setPrinting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState<{
    invoiceNo: string
    invoiceDate: string
    iecCode: string
    poNumber: string
    otherReferences: string
    incoterm: string
    paymentTerms: string
    currency: string
    preCarriageBy: string
    placeOfReceipt: string
    vesselFlightNo: string
    portOfLoading: string
    portOfDischarge: string
    finalDestination: string
    countryOfOrigin: string
    countryOfFinalDestination: string
    manufacturerName: string
    manufacturerAddress: string
    manufacturerGst: string
    manufacturerPhone: string
    manufacturerEmail: string
    buyerName: string
    buyerCompany: string
    buyerAddress: string
    buyerGst: string
    buyerPhone: string
    buyerEmail: string
    shipToName: string
    shipToCompany: string
    shipToAddress: string
    shipToPhone: string
    shipToEmail: string
    containerNo: string
    hsCode: string
    items: any[]
    totalQuantity: number
    totalCartons: number
    grossWeight: number
    netWeight: number
    totalCbm: number
    totalAmount: number
    notes: string
    notes2: string
    invoiceMode: 'select-products' | 'custom'
    notifyBuyer: boolean
    notificationMessage: string
  }>({
    // Basic Invoice Info
    invoiceNo: 'INV-' + Date.now(),
    invoiceDate: new Date().toISOString().split('T')[0],
    iecCode: '',
    poNumber: '',
    otherReferences: '',
    
    // Terms & Conditions
    incoterm: 'FOB INDIA',
    paymentTerms: '20% ADVANCE 80% AGAINST B/L',
    currency: 'USD',
    preCarriageBy: 'ROAD',
    placeOfReceipt: 'MUMBAI, INDIA',
    
    // Shipping Details
    vesselFlightNo: '',
    portOfLoading: 'MUMBAI, INDIA',
    portOfDischarge: 'AQABA',
    finalDestination: 'AQABA',
    countryOfOrigin: 'INDIA',
    countryOfFinalDestination: 'U.A.E',
    
    // Manufacturer/Exporter Details (auto-populated from profile)
    manufacturerName: '',
    manufacturerAddress: '',
    manufacturerGst: '',
    manufacturerPhone: '',
    manufacturerEmail: '',
    
    // Buyer/Consignee Details
    buyerName: '',
    buyerCompany: '',
    buyerAddress: '',
    buyerGst: '',
    buyerPhone: '',
    buyerEmail: '',
    
    // Ship To Details
    shipToName: '',
    shipToCompany: '',
    shipToAddress: '',
    shipToPhone: '',
    shipToEmail: '',
    
    // Carrier Details
    containerNo: '',
    hsCode: '63026090',
    
    // Items
    items: [],
    
    // Totals
    totalQuantity: 0,
    totalCartons: 0,
    grossWeight: 0,
    netWeight: 0,
    totalCbm: 0,
    totalAmount: 0,
    
    // Notes
    notes: 'This is to certify that the goods are of "INDIA ORIGIN"',
    notes2: 'Subject to confirmation',

    // Invoice Mode & Notifications
    invoiceMode: 'select-products',
    notifyBuyer: true,
    notificationMessage: 'Dear Buyer, Your invoice is ready. Please find the details attached. Thank you!'
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(profileData)
    
    // Auto-populate form with manufacturer details
    if (profileData) {
      setForm((prevForm) => ({
        ...prevForm,
        manufacturerName: profileData.company_name || '',
        manufacturerAddress: profileData.address || '',
        manufacturerGst: profileData.gst || '',
        manufacturerPhone: profileData.contact_phone || '',
        manufacturerEmail: profileData.email || '',
        iecCode: profileData.iec || ''
      }))
    }
    
    const { data: productsData } = await supabase.from('products').select('*').eq('manufacturer_id', user.id)
    setProducts(productsData || [])
    
    const { data: invoicesData } = await supabase.from('invoices').select('*').eq('manufacturer_id', user.id).order('created_at', { ascending: false })
    setInvoices(invoicesData || [])
    
    setLoading(false)
  }

  function toggleProduct(id: string) {
    if (selectedProducts.includes(id)) {
      setSelectedProducts(selectedProducts.filter(p => p !== id))
      // Remove from items
      setForm({
        ...form,
        items: form.items.filter((item: any) => item.productId !== id)
      })
    } else {
      setSelectedProducts([...selectedProducts, id])
      const product = products.find((p: any) => p.id === id)
      // Add to items
      const newItem = {
        id: Date.now(),
        productId: product?.id,
        productName: product?.title,
        description: product?.description || '',
        colour: '',
        size: '',
        cartons: 0,
        quantityPerCarton: 0,
        totalPieces: 0,
        grossWeightPerCarton: 0,
        netWeightPerCarton: 0,
        totalGrossWeight: 0,
        totalNetWeight: 0,
        cartonSize: '',
        cartonCbm: 0,
        totalCbm: 0,
        unitPrice: product?.price_per_unit || 0,
        totalAmount: 0
      }
      setForm({ ...form, items: [...form.items, newItem] })
    }
  }

  function updateItem(index: number, field: string, value: any) {
    const newItems = [...form.items]
    newItems[index][field] = value
    
    // Auto-calculate
    if (field === 'quantityPerCarton' || field === 'cartons') {
      newItems[index].totalPieces = (newItems[index].quantityPerCarton || 0) * (newItems[index].cartons || 0)
    }
    if (field === 'grossWeightPerCarton' || field === 'cartons') {
      newItems[index].totalGrossWeight = (newItems[index].grossWeightPerCarton || 0) * (newItems[index].cartons || 0)
    }
    if (field === 'netWeightPerCarton' || field === 'cartons') {
      newItems[index].totalNetWeight = (newItems[index].netWeightPerCarton || 0) * (newItems[index].cartons || 0)
    }
    if (field === 'cartonCbm' || field === 'cartons') {
      newItems[index].totalCbm = (newItems[index].cartonCbm || 0) * (newItems[index].cartons || 0)
    }
    if (field === 'totalPieces') {
      newItems[index].totalAmount = (newItems[index].totalPieces || 0) * (newItems[index].unitPrice || 0)
    }
    
    setForm({ ...form, items: newItems })
    calculateTotals(newItems)
  }

  function calculateTotals(items: any[]) {
    const totalQuantity = items.reduce((sum: number, i: any) => sum + (i.totalPieces || 0), 0)
    const totalCartons = items.reduce((sum: number, i: any) => sum + (i.cartons || 0), 0)
    const grossWeight = items.reduce((sum: number, i: any) => sum + (i.totalGrossWeight || 0), 0)
    const netWeight = items.reduce((sum: number, i: any) => sum + (i.totalNetWeight || 0), 0)
    const totalCbm = items.reduce((sum: number, i: any) => sum + (i.totalCbm || 0), 0)
    const totalAmount = items.reduce((sum: number, i: any) => sum + (i.totalAmount || 0), 0)
    
    setForm(prev => ({
      ...prev,
      totalQuantity,
      totalCartons,
      grossWeight,
      netWeight,
      totalCbm,
      totalAmount
    }))
  }

  function numberToWords(): string {
    const ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE']
    const tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY']
    const teens = ['TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN']
    
    function convert(n: number): string {
      if (n === 0) return ''
      if (n < 10) return ones[n]
      if (n < 20) return teens[n - 10]
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '')
      if (n < 1000) return ones[Math.floor(n / 100)] + ' HUNDRED' + (n % 100 ? ' ' + convert(n % 100) : '')
      if (n < 100000) return convert(Math.floor(n / 1000)) + ' THOUSAND' + (n % 1000 ? ' ' + convert(n % 1000) : '')
      return convert(Math.floor(n / 100000)) + ' LAKH' + (n % 100000 ? ' ' + convert(n % 100000) : '')
    }
    
    const dollars = Math.floor(form.totalAmount)
    const cents = Math.round((form.totalAmount - dollars) * 100)
    const dollarWords = convert(dollars)
    const centWords = cents > 0 ? ` AND CENTS ${convert(cents)}` : ''
    return `${dollarWords}${centWords} ONLY`
  }

  async function saveInvoice() {
    if (form.items.length === 0) {
      alert('Please add at least one product')
      return
    }
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      alert('Please log in again')
      return
    }
    
    const { data, error } = await supabase.from('invoices').insert({
      invoice_number: form.invoiceNo,
      manufacturer_id: user.id,
      invoice_date: form.invoiceDate,
      iec_code: form.iecCode,
      po_number: form.poNumber,
      other_references: form.otherReferences,
      incoterm: form.incoterm,
      payment_terms: form.paymentTerms,
      currency: form.currency,
      pre_carriage_by: form.preCarriageBy,
      place_of_receipt: form.placeOfReceipt,
      vessel_flight_no: form.vesselFlightNo,
      port_of_loading: form.portOfLoading,
      port_of_discharge: form.portOfDischarge,
      final_destination: form.finalDestination,
      country_of_origin: form.countryOfOrigin,
      country_of_final_destination: form.countryOfFinalDestination,
      manufacturer_name: form.manufacturerName,
      manufacturer_address: form.manufacturerAddress,
      manufacturer_gst: form.manufacturerGst,
      manufacturer_phone: form.manufacturerPhone,
      manufacturer_email: form.manufacturerEmail,
      buyer_name: form.buyerName,
      buyer_company: form.buyerCompany,
      buyer_address: form.buyerAddress,
      buyer_gst: form.buyerGst,
      buyer_phone: form.buyerPhone,
      buyer_email: form.buyerEmail,
      ship_to_name: form.shipToName,
      ship_to_company: form.shipToCompany,
      ship_to_address: form.shipToAddress,
      ship_to_phone: form.shipToPhone,
      ship_to_email: form.shipToEmail,
      container_no: form.containerNo,
      hs_code: form.hsCode,
      items: form.items,
      total_quantity: form.totalQuantity,
      total_cartons: form.totalCartons,
      gross_weight: form.grossWeight,
      net_weight: form.netWeight,
      total_cbm: form.totalCbm,
      total_amount: form.totalAmount,
      amount_in_words: numberToWords(),
      notes: form.notes,
      notes_2: form.notes2
    }).select().single()
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('✅ Invoice created successfully!')
      
      // Send notification to buyer if enabled
      if (form.notifyBuyer && form.buyerEmail) {
        await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: form.buyerEmail,
            title: '📄 Invoice #' + form.invoiceNo,
            message: form.notificationMessage || `Invoice ${form.invoiceNo} has been created. Total Amount: ${form.currency} ${form.totalAmount.toFixed(2)}`,
            type: 'invoice',
            relatedId: data?.id
          })
        })
      }
      
      setShowModal(false)
      loadData()
      resetForm()
    }
  }

  function resetForm() {
    setForm({
      invoiceNo: 'INV-' + Date.now(),
      invoiceDate: new Date().toISOString().split('T')[0],
      iecCode: form.iecCode, // Keep manufacturer IEC code
      poNumber: '',
      otherReferences: '',
      incoterm: 'FOB INDIA',
      paymentTerms: '20% ADVANCE 80% AGAINST B/L',
      currency: 'USD',
      preCarriageBy: 'ROAD',
      placeOfReceipt: 'MUMBAI, INDIA',
      vesselFlightNo: '',
      portOfLoading: 'MUMBAI, INDIA',
      portOfDischarge: 'AQABA',
      finalDestination: 'AQABA',
      countryOfOrigin: 'INDIA',
      countryOfFinalDestination: 'U.A.E',
      manufacturerName: form.manufacturerName, // Keep manufacturer details
      manufacturerAddress: form.manufacturerAddress,
      manufacturerGst: form.manufacturerGst,
      manufacturerPhone: form.manufacturerPhone,
      manufacturerEmail: form.manufacturerEmail,
      buyerName: '',
      buyerCompany: '',
      buyerAddress: '',
      buyerGst: '',
      buyerPhone: '',
      buyerEmail: '',
      shipToName: '',
      shipToCompany: '',
      shipToAddress: '',
      shipToPhone: '',
      shipToEmail: '',
      containerNo: '',
      hsCode: '63026090',
      items: [],
      totalQuantity: 0,
      totalCartons: 0,
      grossWeight: 0,
      netWeight: 0,
      totalCbm: 0,
      totalAmount: 0,
      notes: 'This is to certify that the goods are of "INDIA ORIGIN"',
      notes2: 'Subject to confirmation',
      invoiceMode: 'select-products',
      notifyBuyer: true,
      notificationMessage: 'Dear Buyer, Your invoice is ready. Please find the details attached. Thank you!'
    })
    setSelectedProducts([])
  }

  function viewInvoice(invoice: any) {
    // Populate form with saved invoice data for viewing/editing
    setForm({
      invoiceNo: invoice.invoice_number || '',
      invoiceDate: invoice.invoice_date || '',
      iecCode: invoice.iec_code || '',
      poNumber: invoice.po_number || '',
      otherReferences: invoice.other_references || '',
      incoterm: invoice.incoterm || 'FOB INDIA',
      paymentTerms: invoice.payment_terms || '',
      currency: invoice.currency || 'USD',
      preCarriageBy: invoice.pre_carriage_by || '',
      placeOfReceipt: invoice.place_of_receipt || '',
      vesselFlightNo: invoice.vessel_flight_no || '',
      portOfLoading: invoice.port_of_loading || '',
      portOfDischarge: invoice.port_of_discharge || '',
      finalDestination: invoice.final_destination || '',
      countryOfOrigin: invoice.country_of_origin || '',
      countryOfFinalDestination: invoice.country_of_final_destination || '',
      manufacturerName: invoice.manufacturer_name || '',
      manufacturerAddress: invoice.manufacturer_address || '',
      manufacturerGst: invoice.manufacturer_gst || '',
      manufacturerPhone: invoice.manufacturer_phone || '',
      manufacturerEmail: invoice.manufacturer_email || '',
      buyerName: invoice.buyer_name || '',
      buyerCompany: invoice.buyer_company || '',
      buyerAddress: invoice.buyer_address || '',
      buyerGst: invoice.buyer_gst || '',
      buyerPhone: invoice.buyer_phone || '',
      buyerEmail: invoice.buyer_email || '',
      shipToName: invoice.ship_to_name || '',
      shipToCompany: invoice.ship_to_company || '',
      shipToAddress: invoice.ship_to_address || '',
      shipToPhone: invoice.ship_to_phone || '',
      shipToEmail: invoice.ship_to_email || '',
      containerNo: invoice.container_no || '',
      hsCode: invoice.hs_code || '',
      items: invoice.items || [],
      totalQuantity: invoice.total_quantity || 0,
      totalCartons: invoice.total_cartons || 0,
      grossWeight: invoice.gross_weight || 0,
      netWeight: invoice.net_weight || 0,
      totalCbm: invoice.total_cbm || 0,
      totalAmount: invoice.total_amount || 0,
      notes: invoice.notes || '',
      notes2: invoice.notes_2 || '',
      invoiceMode: 'select-products',
      notifyBuyer: false,
      notificationMessage: ''
    })
    setShowModal(true)
  }

  async function deleteInvoice(invoiceId: string) {
    if (!confirm('Are you sure you want to delete this invoice?')) return
    
    const { error } = await supabase.from('invoices').delete().eq('id', invoiceId)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('✅ Invoice deleted successfully!')
      loadData()
    }
  }

  function printInvoice() {
    if (form.items.length === 0) {
      alert('Please add items to print invoice')
      return
    }
    
    setPrinting(true)
    const currencySymbol = form.currency === 'INR' ? '₹' : '$'
    const amountWords = numberToWords()
    
    setTimeout(() => {
      const printWindow = window.open('', '_blank')
      printWindow?.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>INVOICE ${form.invoiceNo}</title>
          <meta charset="UTF-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Arial', sans-serif; padding: 20px; background: #fff; }
            .invoice-box { max-width: 1200px; margin: 0 auto; border: 1px solid #ddd; padding: 20px; }
            .header { text-align: center; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #0891b2; }
            .company-name { font-size: 28px; font-weight: bold; color: #0891b2; }
            .company-details { font-size: 12px; color: #666; margin-top: 5px; }
            .title { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 15px; flex-wrap: wrap; gap: 10px; }
            .info-box { flex: 1; min-width: 250px; border: 1px solid #ddd; padding: 10px; border-radius: 5px; }
            .info-box h4 { margin-bottom: 5px; color: #0891b2; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f3f4f6; font-weight: bold; }
            .totals { display: flex; justify-content: flex-end; margin-top: 20px; }
            .totals table { width: 350px; }
            .amount-words { margin-top: 20px; font-size: 12px; border-top: 1px solid #ddd; padding-top: 10px; }
            .footer { margin-top: 30px; font-size: 11px; text-align: center; border-top: 1px solid #ddd; padding-top: 15px; }
            .signature { margin-top: 30px; display: flex; justify-content: flex-end; }
            @media print {
              body { padding: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div class="company-name">Midlync</div>
              <div class="company-details">${form.manufacturerName || profile?.company_name || ''} | ${form.manufacturerAddress || profile?.address || ''} | GST: ${form.manufacturerGst || profile?.gst || ''}</div>
              <div class="company-details">Ph: ${form.manufacturerPhone || profile?.contact_phone || ''} | Email: ${form.manufacturerEmail || profile?.email || ''}</div>
            </div>
            
            <div class="title">COMMERCIAL INVOICE</div>
            
            <div class="info-row">
              <div class="info-box">
                <h4>Exporter</h4>
                <p>${form.manufacturerName || profile?.company_name || ''}<br/>${form.manufacturerAddress || profile?.address || ''}<br/>GST: ${form.manufacturerGst || profile?.gst || ''}<br/>IEC: ${form.iecCode || profile?.iec || '3396003497'}</p>
              </div>
              <div class="info-box">
                <h4>Invoice Details</h4>
                <p>Invoice No: ${form.invoiceNo}<br/>Date: ${form.invoiceDate}<br/>IEC: ${form.iecCode || profile?.iec || '3396003497'}<br/>PO No: ${form.poNumber || '-'}</p>
              </div>
            </div>
            
            <div class="info-row">
              <div class="info-box">
                <h4>Buyer</h4>
                <p>${form.buyerCompany || form.buyerName}<br/>${form.buyerAddress}<br/>GST: ${form.buyerGst || 'N/A'}<br/>Phone: ${form.buyerPhone || ''}<br/>Email: ${form.buyerEmail || ''}</p>
              </div>
              <div class="info-box">
                <h4>Shipment Details</h4>
                <p>Incoterm: ${form.incoterm}<br/>Payment: ${form.paymentTerms}<br/>Port of Loading: ${form.portOfLoading}<br/>Port of Discharge: ${form.portOfDischarge}<br/>Container: ${form.containerNo || 'N/A'}</p>
              </div>
            </div>
            
            <table>
              <thead>
                <tr><th>#</th><th>Description of Goods</th><th>Colour</th><th>Size</th><th>Cartons</th><th>Pcs/Ctn</th><th>Total Pcs</th><th>Unit Price (${form.currency})</th><th>Amount (${form.currency})</th></tr>
              </thead>
              <tbody>
                ${form.items.map((item, idx) => `
                  <tr>
                    <td>${idx + 1}</td>
                    <td>${item.productName}<br/><small style="color:#666">${item.description?.substring(0, 50) || ''}</small></td>
                    <td>${item.colour || '-'}</td>
                    <td>${item.size || '-'}</td>
                    <td>${item.cartons || 0}</td>
                    <td>${item.quantityPerCarton || 0}</td>
                    <td>${item.totalPieces || 0}</td>
                    <td>${currencySymbol}${(item.unitPrice || 0).toFixed(2)}</td>
                    <td>${currencySymbol}${(item.totalAmount || 0).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
              <tfoot>
                <tr><td colspan="8" style="text-align:right"><strong>Total</strong></td><td><strong>${currencySymbol}${form.totalAmount.toFixed(2)}</strong></td></tr>
              </tfoot>
            </table>
            
            <div class="totals">
              <table>
                <tr><td>Total Cartons:</td><td><strong>${form.totalCartons} CTNS</strong></td></tr>
                <tr><td>Total Quantity:</td><td><strong>${form.totalQuantity} PCS</strong></td></tr>
                <tr><td>Gross Weight:</td><td><strong>${form.grossWeight.toFixed(3)} KGS</strong></td></tr>
                <tr><td>Net Weight:</td><td><strong>${form.netWeight.toFixed(3)} KGS</strong></td></tr>
                <tr><td>Total CBM:</td><td><strong>${form.totalCbm.toFixed(3)}</strong></td></tr>
              </table>
            </div>
            
            <div class="amount-words">
              <strong>Amount in Words:</strong> ${amountWords}
            </div>
            
            <div style="margin-top: 20px; font-size: 11px;">
              <strong>Notes:</strong> ${form.notes}
            </div>
            
            <div class="signature">
              <div style="text-align: right;">
                <p>For ${profile?.company_name}</p>
                <p style="margin-top: 40px;">Authorized Signatory</p>
              </div>
            </div>
            
            <div class="footer">
              <p>This is a system generated invoice - Valid without signature</p>
              <p>Subject to Panipat Jurisdiction</p>
            </div>
          </div>
        </body>
        </html>
      `)
      printWindow?.document.close()
      printWindow?.print()
      setPrinting(false)
    }, 100)
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Invoice Generator</h1>
            <p className="text-slate-500 text-sm">Create professional commercial invoices with packing details</p>
          </div>
          <button onClick={() => setShowModal(true)} className="bg-cyan-600 hover:bg-cyan-700 text-white px-5 py-2 rounded-xl transition">
            + New Invoice
          </button>
        </div>

        {/* Invoices List */}
        {invoices.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border">
            <div className="text-6xl mb-4">🧾</div>
            <p className="text-slate-500 mb-4">No invoices yet</p>
            <button onClick={() => setShowModal(true)} className="bg-cyan-600 text-white px-6 py-3 rounded-xl">
              Create Your First Invoice
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr><th className="p-4">Invoice No</th><th className="p-4">Date</th><th className="p-4">Total</th><th className="p-4">Status</th><th className="p-4">Actions</th></tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.id} className="border-b">
                    <td className="p-4 font-mono">{inv.invoice_number}</td>
                    <td className="p-4">{new Date(inv.invoice_date).toLocaleDateString()}</td>
                    <td className="p-4">${inv.total_amount}</td>
                    <td className="p-4"><span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">{inv.status || 'draft'}</span></td>
                    <td className="p-4">
                      <button onClick={() => viewInvoice(inv)} className="text-blue-600 mr-2 hover:underline">View</button>
                      <button onClick={() => deleteInvoice(inv.id)} className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invoice Creator Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-6xl w-full my-8 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Create Commercial Invoice</h2>
              <p className="text-slate-500 text-sm">Fill in the invoice details below</p>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Invoice Mode Selector */}
              <div className="flex gap-2 border-b pb-4">
                <button onClick={() => setForm({...form, invoiceMode: 'select-products'})} className={`px-4 py-2 rounded-lg font-medium transition ${form.invoiceMode === 'select-products' ? 'bg-cyan-600 text-white' : 'border bg-slate-50 hover:bg-slate-100'}`}>
                  📦 Select Products
                </button>
                <button onClick={() => setForm({...form, invoiceMode: 'custom'})} className={`px-4 py-2 rounded-lg font-medium transition ${form.invoiceMode === 'custom' ? 'bg-cyan-600 text-white' : 'border bg-slate-50 hover:bg-slate-100'}`}>
                  📝 Custom Invoice
                </button>
              </div>

              {/* Manufacturer Details (Auto-populated) */}
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-semibold mb-3">🏢 Your Company Details (Auto-populated)</h3>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="block font-semibold text-blue-900">Company Name</label>
                    <p className="text-slate-700">{form.manufacturerName || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block font-semibold text-blue-900">GST Number</label>
                    <p className="text-slate-700">{form.manufacturerGst || 'Not set'}</p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-blue-900">Address</label>
                    <p className="text-slate-700">{form.manufacturerAddress || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block font-semibold text-blue-900">Phone</label>
                    <p className="text-slate-700">{form.manufacturerPhone || 'Not set'}</p>
                  </div>
                  <div>
                    <label className="block font-semibold text-blue-900">Email</label>
                    <p className="text-slate-700">{form.manufacturerEmail || 'Not set'}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Basic Info */}
              <div className="grid md:grid-cols-4 gap-4">
                <div><label className="block text-sm font-semibold">Invoice No.</label><input type="text" value={form.invoiceNo} onChange={e => setForm({...form, invoiceNo: e.target.value})} className="w-full border rounded-lg p-2" /></div>
                <div><label className="block text-sm font-semibold">Invoice Date</label><input type="date" value={form.invoiceDate} onChange={e => setForm({...form, invoiceDate: e.target.value})} className="w-full border rounded-lg p-2" /></div>
                <div><label className="block text-sm font-semibold">IEC Code</label><input type="text" value={form.iecCode} onChange={e => setForm({...form, iecCode: e.target.value})} placeholder={profile?.iec || '3396003497'} className="w-full border rounded-lg p-2" /></div>
                <div><label className="block text-sm font-semibold">PO/JC Number</label><input type="text" value={form.poNumber} onChange={e => setForm({...form, poNumber: e.target.value})} className="w-full border rounded-lg p-2" placeholder="JC No. 19375" /></div>
              </div>

              {/* Custom Company Details (only in custom mode) */}
              {form.invoiceMode === 'custom' && (
                <div className="border-t pt-4 bg-slate-50 p-4 rounded-lg">
                  <h3 className="font-semibold mb-3">🏢 Your Company Details</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div><label className="block text-sm font-semibold">Company Name</label><input type="text" defaultValue={profile?.company_name} placeholder="Your company name" className="w-full border rounded-lg p-2" /></div>
                    <div><label className="block text-sm font-semibold">GST Number</label><input type="text" defaultValue={profile?.gst} placeholder="Your GST" className="w-full border rounded-lg p-2" /></div>
                    <div className="md:col-span-2"><label className="block text-sm font-semibold">Address</label><textarea rows={2} defaultValue={profile?.address} placeholder="Your full address" className="w-full border rounded-lg p-2" /></div>
                  </div>
                </div>
              )}

              {/* Buyer Details */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Buyer Details</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-semibold">Company Name</label><input type="text" value={form.buyerCompany} onChange={e => setForm({...form, buyerCompany: e.target.value})} className="w-full border rounded-lg p-2" placeholder="KINZI HOMES TEXTILES" /></div>
                  <div><label className="block text-sm font-semibold">Contact Person</label><input type="text" value={form.buyerName} onChange={e => setForm({...form, buyerName: e.target.value})} className="w-full border rounded-lg p-2" /></div>
                  <div className="md:col-span-2"><label className="block text-sm font-semibold">Address</label><textarea rows={2} value={form.buyerAddress} onChange={e => setForm({...form, buyerAddress: e.target.value})} className="w-full border rounded-lg p-2" placeholder="Full address with city, country" /></div>
                  <div><label className="block text-sm font-semibold">GST/Tax ID</label><input type="text" value={form.buyerGst} onChange={e => setForm({...form, buyerGst: e.target.value})} className="w-full border rounded-lg p-2" /></div>
                  <div><label className="block text-sm font-semibold">Phone</label><input type="tel" value={form.buyerPhone} onChange={e => setForm({...form, buyerPhone: e.target.value})} className="w-full border rounded-lg p-2" /></div>
                  <div><label className="block text-sm font-semibold">📧 Email</label><input type="email" value={form.buyerEmail} onChange={e => setForm({...form, buyerEmail: e.target.value})} className="w-full border rounded-lg p-2" placeholder="buyer@company.com" /></div>
                </div>
              </div>

              {/* Shipping Details */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Shipping Details</h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <div><label className="block text-sm font-semibold">Incoterm</label><select value={form.incoterm} onChange={e => setForm({...form, incoterm: e.target.value})} className="w-full border rounded-lg p-2"><option>FOB INDIA</option><option>CIF</option><option>EXW</option><option>FCA</option></select></div>
                  <div><label className="block text-sm font-semibold">Payment Terms</label><select value={form.paymentTerms} onChange={e => setForm({...form, paymentTerms: e.target.value})} className="w-full border rounded-lg p-2"><option>DP AT SIGHT</option><option>LC AT SIGHT</option><option>TT ADVANCE</option><option>30% ADVANCE</option></select></div>
                  <div><label className="block text-sm font-semibold">Port of Loading</label><input type="text" value={form.portOfLoading} onChange={e => setForm({...form, portOfLoading: e.target.value})} className="w-full border rounded-lg p-2" placeholder="MUNDRA, INDIA" /></div>
                  <div><label className="block text-sm font-semibold">Port of Discharge</label><input type="text" value={form.portOfDischarge} onChange={e => setForm({...form, portOfDischarge: e.target.value})} className="w-full border rounded-lg p-2" placeholder="AQABA PORT" /></div>
                  <div><label className="block text-sm font-semibold">Container No.</label><input type="text" value={form.containerNo} onChange={e => setForm({...form, containerNo: e.target.value})} className="w-full border rounded-lg p-2" /></div>
                  <div><label className="block text-sm font-semibold">Vessel/Flight</label><input type="text" value={form.vesselFlightNo} onChange={e => setForm({...form, vesselFlightNo: e.target.value})} className="w-full border rounded-lg p-2" /></div>
                </div>
              </div>

              {/* Product Selection - Only in select-products mode */}
              {form.invoiceMode === 'select-products' && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Select Products</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
                    {products.map(p => (
                      <label key={p.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={selectedProducts.includes(p.id)} onChange={() => toggleProduct(p.id)} />
                        {p.title} - ${p.price_per_unit}
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Manual Item Entry - Only in custom mode */}
              {form.invoiceMode === 'custom' && (
                <div className="border-t pt-4 bg-slate-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold">Invoice Items</h3>
                    <button onClick={() => {
                      const newItem = {
                        productName: '', description: '', colour: '', size: '', cartons: 0, quantityPerCarton: 0,
                        totalPieces: 0, unitPrice: 0, totalAmount: 0, grossWeight: 0, netWeight: 0, cbm: 0, hsCode: ''
                      };
                      setForm({...form, items: [...form.items, newItem]});
                    }} className="px-3 py-1 bg-cyan-600 text-white rounded text-sm">+ Add Item</button>
                  </div>
                  <div className="space-y-4">
                    {form.items.map((item, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-lg border">
                        <div className="grid md:grid-cols-3 gap-3 mb-3">
                          <div><label className="text-xs font-semibold">Product Name</label><input type="text" value={item.productName} onChange={e => updateItem(idx, 'productName', e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Product name" /></div>
                          <div><label className="text-xs font-semibold">Description</label><input type="text" value={item.description || ''} onChange={e => updateItem(idx, 'description', e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Description" /></div>
                          <div><label className="text-xs font-semibold">HS Code</label><input type="text" value={item.hsCode || ''} onChange={e => updateItem(idx, 'hsCode', e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="HS Code" /></div>
                        </div>
                        <div className="grid md:grid-cols-4 gap-3">
                          <div><label className="text-xs font-semibold">Colour</label><input type="text" value={item.colour} onChange={e => updateItem(idx, 'colour', e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Colour" /></div>
                          <div><label className="text-xs font-semibold">Size</label><input type="text" value={item.size} onChange={e => updateItem(idx, 'size', e.target.value)} className="w-full border rounded p-2 text-sm" placeholder="Size" /></div>
                          <div><label className="text-xs font-semibold">Cartons</label><input type="number" value={item.cartons || ''} onChange={e => updateItem(idx, 'cartons', parseInt(e.target.value))} className="w-full border rounded p-2 text-sm" /></div>
                          <div><label className="text-xs font-semibold">Pcs/Carton</label><input type="number" value={item.quantityPerCarton || ''} onChange={e => updateItem(idx, 'quantityPerCarton', parseInt(e.target.value))} className="w-full border rounded p-2 text-sm" /></div>
                        </div>
                        <div className="grid md:grid-cols-5 gap-3 mt-3">
                          <div><label className="text-xs font-semibold">Total Pcs (Auto)</label><input type="number" value={item.totalPieces || ''} readOnly className="w-full border rounded p-2 bg-slate-50 text-sm" /></div>
                          <div><label className="text-xs font-semibold">Unit Price</label><input type="number" step="0.01" value={item.unitPrice || ''} onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value))} className="w-full border rounded p-2 text-sm" /></div>
                          <div><label className="text-xs font-semibold">Amount (Auto)</label><input type="number" value={item.totalAmount || ''} readOnly className="w-full border rounded p-2 bg-slate-50 text-sm" /></div>
                          <div><label className="text-xs font-semibold">Gross Wt (KG)</label><input type="number" step="0.01" value={item.grossWeight || ''} onChange={e => updateItem(idx, 'grossWeight', parseFloat(e.target.value))} className="w-full border rounded p-2 text-sm" /></div>
                          <div><label className="text-xs font-semibold">Net Wt (KG)</label><input type="number" step="0.01" value={item.netWeight || ''} onChange={e => updateItem(idx, 'netWeight', parseFloat(e.target.value))} className="w-full border rounded p-2 text-sm" /></div>
                        </div>
                        <button onClick={() => setForm({...form, items: form.items.filter((_, i) => i !== idx)})} className="mt-3 text-red-600 text-sm">🗑️ Delete Item</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Items Table */}
              {form.items.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Invoice Items</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50">
                        <tr><th className="p-2">Product</th><th className="p-2">Colour</th><th className="p-2">Size</th><th className="p-2">Cartons</th><th className="p-2">Pcs/Ctn</th><th className="p-2">Total Pcs</th><th className="p-2">Unit Price</th><th className="p-2">Amount</th></tr>
                      </thead>
                      <tbody>
                        {form.items.map((item, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2">{item.productName}</td>
                            <td className="p-2"><input type="text" value={item.colour} onChange={e => updateItem(idx, 'colour', e.target.value)} className="w-24 border rounded p-1 text-sm" placeholder="Colour" /></td>
                            <td className="p-2"><input type="text" value={item.size} onChange={e => updateItem(idx, 'size', e.target.value)} className="w-20 border rounded p-1 text-sm" placeholder="Size" /></td>
                            <td className="p-2"><input type="number" value={item.cartons || ''} onChange={e => updateItem(idx, 'cartons', parseInt(e.target.value))} className="w-20 border rounded p-1 text-sm" placeholder="CTNS" /></td>
                            <td className="p-2"><input type="number" value={item.quantityPerCarton || ''} onChange={e => updateItem(idx, 'quantityPerCarton', parseInt(e.target.value))} className="w-20 border rounded p-1 text-sm" placeholder="Pcs/Ctn" /></td>
                            <td className="p-2"><input type="number" value={item.totalPieces || ''} readOnly className="w-20 border rounded p-1 bg-slate-50 text-sm" /></td>
                            <td className="p-2"><input type="number" step="0.01" value={item.unitPrice || ''} onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value))} className="w-24 border rounded p-1 text-sm" /></td>
                            <td className="p-2"><input type="number" value={item.totalAmount || ''} readOnly className="w-24 border rounded p-1 bg-slate-50 text-sm" /></td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-slate-50"><td colSpan={7} className="p-2 text-right font-semibold">Total:</td><td className="p-2 font-bold">${form.totalAmount.toFixed(2)}</td></tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Weight & Dimensions */}
              {form.items.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Weight & Dimensions</h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div><label className="block text-sm font-semibold">Total Cartons</label><input type="number" value={form.totalCartons} readOnly className="w-full border rounded-lg p-2 bg-slate-50" /></div>
                    <div><label className="block text-sm font-semibold">Total Quantity (PCS)</label><input type="number" value={form.totalQuantity} readOnly className="w-full border rounded-lg p-2 bg-slate-50" /></div>
                    <div><label className="block text-sm font-semibold">Gross Weight (KGS)</label><input type="number" value={form.grossWeight} readOnly className="w-full border rounded-lg p-2 bg-slate-50" /></div>
                    <div><label className="block text-sm font-semibold">Net Weight (KGS)</label><input type="number" value={form.netWeight} readOnly className="w-full border rounded-lg p-2 bg-slate-50" /></div>
                    <div><label className="block text-sm font-semibold">Total CBM</label><input type="number" value={form.totalCbm} readOnly className="w-full border rounded-lg p-2 bg-slate-50" /></div>
                  </div>
                </div>
              )}

              {/* Notes */}
              <div><label className="block text-sm font-semibold">Notes / Terms</label><textarea rows={2} value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="w-full border rounded-lg p-2" /></div>

              {/* Buyer Notification */}
              <div className="border-t pt-4 bg-blue-50 p-4 rounded-lg">
                <label className="flex items-center gap-3 mb-3">
                  <input type="checkbox" checked={form.notifyBuyer} onChange={e => setForm({...form, notifyBuyer: e.target.checked})} className="w-4 h-4" />
                  <span className="font-semibold">📧 Notify Buyer via Email</span>
                </label>
                {form.notifyBuyer && (
                  <div>
                    <label className="block text-sm font-semibold mb-2">Notification Message</label>
                    <textarea rows={3} value={form.notificationMessage} onChange={e => setForm({...form, notificationMessage: e.target.value})} placeholder="Dear Buyer, Your invoice is ready. Please find the details attached. Thank you!" className="w-full border rounded-lg p-2 text-sm" />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button onClick={printInvoice} disabled={form.items.length === 0 || printing} className="flex-1 bg-green-600 text-white py-2 rounded-lg disabled:opacity-50">🖨️ {printing ? 'Preparing...' : 'Print Invoice'}</button>
                <button onClick={saveInvoice} disabled={form.items.length === 0} className="flex-1 bg-cyan-600 text-white py-2 rounded-lg disabled:opacity-50">💾 Save Invoice</button>
                <button onClick={() => setShowModal(false)} className="flex-1 border py-2 rounded-lg">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}