'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'
import { generateBuyerCode } from '@/lib/utils/codeGenerator'
import { countries, getCountryCode } from '@/lib/countries'

export default function BuyerProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [countryCode, setCountryCode] = useState('+91')
  const [form, setForm] = useState({
    company_name: '',
    country: '',
    contact_person: '',
    contact_phone: '',
    address: '',
  })
  const router = useRouter()
  const supabase = createClient()

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
      country: country,
      contact_person: data?.contact_person || '',
      contact_phone: data?.contact_phone || '',
      address: data?.address || '',
    })
    setLoading(false)
  }

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Generate buyer code if it doesn't exist
    const byerCode = profile?.buyer_code || generateBuyerCode(user.id)
    
    const { error } = await supabase.from('profiles').update({
      ...form
    }).eq('id', user.id)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('✅ Profile updated successfully!')
      // Update profile state with the generated code
      setProfile({ ...profile, buyer_code: byerCode })
    }
    setSaving(false)
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="buyer" companyName={profile?.company_name || 'Buyer'} />

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">My Profile</h1>
            <button onClick={() => router.push('/buyer/dashboard')} className="text-slate-600 hover:text-slate-800">← Back</button>
          </div>

          {/* Profile Information Section */}

          {/* Buyer Code Display */}
          <div className="mb-6 p-4 bg-gradient-to-br from-blue-50 to-slate-50 rounded-lg border-2 border-blue-200">
            <p className="text-xs text-slate-600 mb-2">🔐 Your Unique Buyer Code</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">👤</div>
              <div>
                <p className="font-mono text-xl font-bold text-blue-600">{profile?.buyer_code || 'BYR-CODE'}</p>
                <p className="text-xs text-slate-500">Manufacturers see your orders using this code (your details stay private)</p>
              </div>
            </div>
          </div>
          
          <form onSubmit={saveProfile} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1">Company Name *</label>
              <input type="text" required value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Country *</label>
              <select value={form.country} onChange={e => {
                const selected = e.target.value
                setForm({...form, country: selected})
                setCountryCode(getCountryCode(selected))
              }}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500">
                <option value="">Select a country</option>
                {countries.map(country => (
                  <option key={country.name} value={country.name}>{country.name} ({country.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Contact Person</label>
              <input type="text" value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Contact Phone</label>
              <div className="flex gap-3">
                <div className="flex items-center bg-slate-100 px-4 rounded-lg border border-slate-300 font-semibold text-slate-700 whitespace-nowrap">
                  {countryCode}
                </div>
                <input type="tel" value={form.contact_phone} onChange={e => setForm({...form, contact_phone: e.target.value})}
                  className="flex-1 border rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" placeholder="Enter phone number" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Business Address</label>
              <textarea rows={3} value={form.address} onChange={e => setForm({...form, address: e.target.value})}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
            </div>
            <div className="flex gap-3 pt-4">
              <button type="submit" disabled={saving} className="flex-1 bg-cyan-600 text-white py-2 rounded-lg disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
              <button type="button" onClick={() => router.push('/buyer/dashboard')} className="flex-1 border py-2 rounded-lg">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}