'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import { generateManufacturerCode } from '@/lib/utils/codeGenerator'
import { countries, getCountryCode } from '@/lib/countries'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [countryCode, setCountryCode] = useState('+91')
  const router = useRouter()
  const supabase = createClient()

  const [form, setForm] = useState({
    company_name: '',
    registered_address: '',
    factory_address: '',
    country: '',
    contact_person: '',
    designation: '',
    mobile_number: '',
    contact_phone: '',
    email: '',
    website: '',
    gst: '',
    iec_code: '',
    pan_number: '',
    business_nature: '',
    product_categories: '',
    year_established: '',
    annual_turnover: '',
    employee_count: '',
    certifications: '',
    certification_images: [],
    major_customers: '',
    production_capacity: '',
    logo_url: '',
    factory_photos: [],
    factory_video_url: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  async function loadProfile() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(data)
    const country = data?.country || ''
    setCountryCode(getCountryCode(country) || '+91')
    setForm({
      company_name: data?.company_name || '',
      registered_address: data?.registered_address || '',
      factory_address: data?.factory_address || '',
      country: country,
      contact_person: data?.contact_person || '',
      designation: data?.designation || '',
      mobile_number: data?.mobile_number || '',
      contact_phone: data?.contact_phone || '',
      email: data?.email || '',
      website: data?.website || '',
      gst: data?.gst || '',
      iec_code: data?.iec_code || '',
      pan_number: data?.pan_number || '',
      business_nature: data?.business_nature || '',
      product_categories: data?.product_categories || '',
      year_established: data?.year_established || '',
      annual_turnover: data?.annual_turnover || '',
      employee_count: data?.employee_count || '',
      certifications: data?.certifications || '',
      certification_images: data?.certification_images || [],
      major_customers: data?.major_customers || '',
      production_capacity: data?.production_capacity || '',
      logo_url: data?.logo_url || '',
      factory_photos: data?.factory_photos || [],
      factory_video_url: data?.factory_video_url || '',
    })
    setLoading(false)
  }

  async function uploadImage(file, type = 'logo') {
    setUploading(true)
    const { data: { user } } = await supabase.auth.getUser()
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `profiles/${user.id}/${type}/${fileName}`
    
    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, file)
    
    if (uploadError) throw uploadError
    
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath)
    
    setUploading(false)
    return publicUrl
  }

  async function handleLogoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    try {
      const url = await uploadImage(file, 'logo')
      setForm({ ...form, logo_url: url })
    } catch (err) {
      alert('Upload failed: ' + err.message)
    }
  }

  async function handleFactoryPhotosUpload(e) {
    const files = Array.from(e.target.files)
    setUploading(true)
    const newUrls = []
    for (const file of files) {
      try {
        const url = await uploadImage(file, 'factory')
        newUrls.push(url)
      } catch (err) {
        alert('Upload failed: ' + err.message)
      }
    }
    setForm({ ...form, factory_photos: [...form.factory_photos, ...newUrls] })
    setUploading(false)
  }

  function removeFactoryPhoto(index) {
    setForm({ ...form, factory_photos: form.factory_photos.filter((_, i) => i !== index) })
  }

  async function handleCertificationUpload(e) {
    const files = Array.from(e.target.files)
    setUploading(true)
    const newUrls = []
    for (const file of files) {
      try {
        const url = await uploadImage(file, 'certification')
        newUrls.push(url)
      } catch (err) {
        alert('Upload failed: ' + err.message)
      }
    }
    setForm({ ...form, certification_images: [...form.certification_images, ...newUrls] })
    setUploading(false)
  }

  function removeCertificationImage(index) {
    setForm({ ...form, certification_images: form.certification_images.filter((_, i) => i !== index) })
  }

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Generate manufacturer code if it doesn't exist
    const mfrCode = profile?.manufacturer_code || generateManufacturerCode(user.id)
    
    const { error } = await supabase.from('profiles').update({
      company_name: form.company_name,
      registered_address: form.registered_address,
      factory_address: form.factory_address,
      country: form.country,
      contact_person: form.contact_person,
      designation: form.designation,
      mobile_number: form.mobile_number,
      contact_phone: form.contact_phone,
      website: form.website,
      gst: form.gst,
      iec_code: form.iec_code,
      pan_number: form.pan_number,
      business_nature: form.business_nature,
      product_categories: form.product_categories,
      year_established: form.year_established,
      annual_turnover: form.annual_turnover,
      employee_count: form.employee_count,
      certifications: form.certifications,
      certification_images: form.certification_images,
      major_customers: form.major_customers,
      production_capacity: form.production_capacity,
      logo_url: form.logo_url,
      factory_photos: form.factory_photos,
      factory_video_url: form.factory_video_url
    }).eq('id', user.id)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('✅ Profile updated successfully!')
      // Update profile state
      setProfile({ ...profile, ...form })
    }
    setSaving(false)
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Company Profile</h1>
            <button onClick={() => router.push('/manufacturer/dashboard')} className="text-slate-600 hover:text-slate-800">← Back</button>
          </div>

          {/* Manufacturer Code Display */}
          <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-slate-50 rounded-lg border-2 border-blue-200">
            <p className="text-xs text-slate-600 mb-2">🔐 Your Unique Manufacturer Code</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">🏭</div>
              <div>
                <p className="font-mono text-xl font-bold text-blue-600">{profile?.manufacturer_code || 'MFR-CODE'}</p>
                <p className="text-xs text-slate-500">Buyers see only this code (your company details stay private until you connect)</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={saveProfile} className="space-y-6">
            {/* Basic Information */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">🏢 Basic Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold mb-1">Company Name *</label><input type="text" required value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} className="w-full border rounded-lg px-4 py-2" /></div>
                <div><label className="block text-sm font-semibold mb-1">Country</label><select value={form.country} onChange={e => {
                  const selected = e.target.value
                  setForm({...form, country: selected})
                  setCountryCode(getCountryCode(selected))
                }} className="w-full border rounded-lg px-4 py-2"><option value="">Select a country</option>{countries.map(c => <option key={c.name} value={c.name}>{c.name} ({c.code})</option>)}</select></div>
                <div className="md:col-span-2"><label className="block text-sm font-semibold mb-1">Registered Address</label><textarea rows={2} value={form.registered_address} onChange={e => setForm({...form, registered_address: e.target.value})} className="w-full border rounded-lg px-4 py-2" placeholder="Full registered address" /></div>
                <div className="md:col-span-2"><label className="block text-sm font-semibold mb-1">Factory Address (if different)</label><textarea rows={2} value={form.factory_address} onChange={e => setForm({...form, factory_address: e.target.value})} className="w-full border rounded-lg px-4 py-2" /></div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">📞 Contact Details</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold mb-1">Contact Person</label><input type="text" value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})} className="w-full border rounded-lg px-4 py-2" /></div>
                <div><label className="block text-sm font-semibold mb-1">Designation</label><input type="text" value={form.designation} onChange={e => setForm({...form, designation: e.target.value})} className="w-full border rounded-lg px-4 py-2" placeholder="CEO, Director, etc." /></div>
                <div><label className="block text-sm font-semibold mb-1">Mobile Number</label><input type="tel" value={form.mobile_number} onChange={e => setForm({...form, mobile_number: e.target.value})} className="w-full border rounded-lg px-4 py-2" placeholder="+91 98765 43210" /></div>
                <div><label className="block text-sm font-semibold mb-1">Phone Number</label><div className="flex gap-3"><div className="flex items-center bg-slate-100 px-4 rounded-lg border border-slate-300 font-semibold text-slate-700 whitespace-nowrap">{countryCode}</div><input type="tel" value={form.contact_phone} onChange={e => setForm({...form, contact_phone: e.target.value})} className="flex-1 border rounded-lg px-4 py-2" placeholder="Phone number" /></div></div>
                <div className="md:col-span-2"><label className="block text-sm font-semibold mb-1">Email</label><input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border rounded-lg px-4 py-2 bg-slate-50" readOnly /></div>
                <div className="md:col-span-2"><label className="block text-sm font-semibold mb-1">Website</label><input type="url" value={form.website} onChange={e => setForm({...form, website: e.target.value})} className="w-full border rounded-lg px-4 py-2" placeholder="https://www.company.com" /></div>
              </div>
            </div>

            {/* Tax & Legal */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">📄 Tax & Legal</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold mb-1">GST Number</label><input type="text" value={form.gst} onChange={e => setForm({...form, gst: e.target.value})} className="w-full border rounded-lg px-4 py-2" placeholder="22AAAAA0000A1Z" /></div>
                <div><label className="block text-sm font-semibold mb-1">IEC Code (Import Export Code)</label><input type="text" value={form.iec_code} onChange={e => setForm({...form, iec_code: e.target.value})} className="w-full border rounded-lg px-4 py-2" placeholder="1234567890" /></div>
                <div><label className="block text-sm font-semibold mb-1">PAN Number</label><input type="text" value={form.pan_number} onChange={e => setForm({...form, pan_number: e.target.value})} className="w-full border rounded-lg px-4 py-2" placeholder="ABCDE1234F" /></div>
              </div>
            </div>

            {/* Business Information */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">📊 Business Information</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div><label className="block text-sm font-semibold mb-1">Nature of Business</label><select value={form.business_nature} onChange={e => setForm({...form, business_nature: e.target.value})} className="w-full border rounded-lg px-4 py-2"><option value="">Select</option><option value="Manufacturer">Manufacturer</option><option value="Trader">Trader</option><option value="Exporter">Exporter</option><option value="Importer">Importer</option><option value="Manufacturer & Exporter">Manufacturer & Exporter</option></select></div>
                <div><label className="block text-sm font-semibold mb-1">Product Categories</label><input type="text" value={form.product_categories} onChange={e => setForm({...form, product_categories: e.target.value})} className="w-full border rounded-lg px-4 py-2" placeholder="Textiles, Garments, Home Furnishings" /></div>
                <div><label className="block text-sm font-semibold mb-1">Year of Establishment</label><input type="number" value={form.year_established} onChange={e => setForm({...form, year_established: e.target.value})} className="w-full border rounded-lg px-4 py-2" placeholder="2000" /></div>
                <div><label className="block text-sm font-semibold mb-1">Annual Turnover</label><select value={form.annual_turnover} onChange={e => setForm({...form, annual_turnover: e.target.value})} className="w-full border rounded-lg px-4 py-2"><option value="">Select</option><option value="Less than ₹1 Cr">Less than ₹1 Cr</option><option value="₹1 Cr - ₹5 Cr">₹1 Cr - ₹5 Cr</option><option value="₹5 Cr - ₹25 Cr">₹5 Cr - ₹25 Cr</option><option value="₹25 Cr - ₹100 Cr">₹25 Cr - ₹100 Cr</option><option value="Above ₹100 Cr">Above ₹100 Cr</option></select></div>
                <div><label className="block text-sm font-semibold mb-1">Number of Employees</label><select value={form.employee_count} onChange={e => setForm({...form, employee_count: e.target.value})} className="w-full border rounded-lg px-4 py-2"><option value="">Select</option><option value="1-10">1-10</option><option value="11-50">11-50</option><option value="51-200">51-200</option><option value="201-500">201-500</option><option value="500+">500+</option></select></div>
                <div><label className="block text-sm font-semibold mb-1">Production Capacity</label><input type="text" value={form.production_capacity} onChange={e => setForm({...form, production_capacity: e.target.value})} className="w-full border rounded-lg px-4 py-2" placeholder="e.g., 50,000 meters/month" /></div>
              </div>
            </div>

            {/* Certifications & Customers */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">✅ Certifications & Customers</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><label className="block text-sm font-semibold mb-1">Certifications</label><input type="text" value={form.certifications} onChange={e => setForm({...form, certifications: e.target.value})} className="w-full border rounded-lg px-4 py-2" placeholder="ISO, GOTS, OEKO-TEX, BSCI, SEDEX, GRS" /></div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold mb-1">📄 Certification Documents/Images</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {form.certification_images.map((url, idx) => (
                      <div key={idx} className="relative aspect-square bg-slate-100 rounded border-2 border-blue-200 overflow-hidden">
                        <img src={url} className="w-full h-full object-cover rounded" alt={`Cert ${idx + 1}`} />
                        <button type="button" onClick={() => removeCertificationImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs hover:bg-red-600">✕</button>
                      </div>
                    ))}
                  </div>
                  <input type="file" accept="image/*" multiple onChange={handleCertificationUpload} disabled={uploading} className="text-sm" />
                  {uploading && <span className="ml-2 text-sm text-blue-600">Uploading...</span>}
                  <p className="text-xs text-slate-500 mt-1">Upload ISO, quality certifications, compliance documents (multiple images supported)</p>
                </div>
                <div className="md:col-span-2"><label className="block text-sm font-semibold mb-1">Major Customers / Buyers</label><input type="text" value={form.major_customers} onChange={e => setForm({...form, major_customers: e.target.value})} className="w-full border rounded-lg px-4 py-2" placeholder="Walmart, Target, H&M, Zara, etc." /></div>
              </div>
            </div>

            {/* Media Uploads */}
            <div className="border-b pb-4">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">🖼️ Media</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Company Logo</label>
                  {form.logo_url && <img src={form.logo_url} className="h-20 w-20 object-contain border rounded mb-2" />}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="text-sm" />
                  {uploading && <span className="ml-2 text-sm">Uploading...</span>}
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Factory Photos</label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {form.factory_photos.map((url, idx) => (
                      <div key={idx} className="relative aspect-square bg-slate-100 rounded">
                        <img src={url} className="w-full h-full object-cover rounded" />
                        <button type="button" onClick={() => removeFactoryPhoto(idx)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs">✕</button>
                      </div>
                    ))}
                  </div>
                  <input type="file" accept="image/*" multiple onChange={handleFactoryPhotosUpload} className="text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Factory Video URL</label>
                  <input type="url" value={form.factory_video_url} onChange={e => setForm({...form, factory_video_url: e.target.value})} className="w-full border rounded-lg px-4 py-2" placeholder="YouTube or Vimeo link" />
                  {form.factory_video_url && (
                    <div className="mt-2 text-xs text-slate-500">Video link saved</div>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button type="submit" disabled={saving} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded-lg disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <button type="button" onClick={() => router.push('/manufacturer/dashboard')} className="flex-1 border py-2 rounded-lg">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}