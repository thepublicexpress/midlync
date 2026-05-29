'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/app/components/Navbar'

export default function BuyerProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    setForm({
      company_name: data?.company_name || '',
      country: data?.country || '',
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
    const { error } = await supabase.from('profiles').update(form).eq('id', user.id)
    if (error) {
      alert('Error: ' + error.message)
    } else {
      alert('Profile updated successfully!')
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

          {/* ✅ UPGRADE PLAN SECTION - ADDED HERE */}
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div>
                <h3 className="font-semibold text-lg">💰 Current Plan: <span className="text-purple-600 capitalize">{profile?.subscription_plan || 'Free'}</span></h3>
                {profile?.subscription_status === 'trial' && profile?.trial_end_date && (
                  <p className="text-sm text-green-600">🎉 Trial ends on {new Date(profile.trial_end_date).toLocaleDateString()}</p>
                )}
                {profile?.subscription_status === 'active' && (
                  <p className="text-sm text-gray-500">Valid till: {profile?.subscription_end_date ? new Date(profile.subscription_end_date).toLocaleDateString() : 'N/A'}</p>
                )}
                <p className="text-sm text-gray-500 mt-1">Upgrade to unlock more features</p>
              </div>
              <Link 
                href="/subscription" 
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-semibold transition"
              >
                Upgrade Plan →
              </Link>
            </div>
          </div>
          
          <form onSubmit={saveProfile} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold mb-1">Company Name *</label>
              <input type="text" required value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Country</label>
              <input type="text" value={form.country} onChange={e => setForm({...form, country: e.target.value})}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Contact Person</label>
              <input type="text" value={form.contact_person} onChange={e => setForm({...form, contact_person: e.target.value})}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Contact Phone</label>
              <input type="tel" value={form.contact_phone} onChange={e => setForm({...form, contact_phone: e.target.value})}
                className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:border-cyan-500" />
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