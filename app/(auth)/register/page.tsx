'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [role, setRole] = useState('manufacturer')
  const [form, setForm] = useState({ email: '', password: '', company_name: '', country: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()


  const trialDays = 14

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    const trialStart = new Date()
    const trialEnd = new Date()
    trialEnd.setDate(trialEnd.getDate() + trialDays)
    
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { 
        data: { 
          role, 
          company_name: form.company_name, 
          country: form.country,
          approval_status: 'pending',
          is_approved: false
        } 
      }
    })
    
    if (error) { 
      setError(error.message); 
      setLoading(false); 
      return 
    }
    
    setSuccess(`Registration successful! You have ${trialDays} days free trial. Your account is pending admin approval.`)
    setTimeout(() => router.push('/login'), 3000)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-800 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl p-8 w-full max-w-6xl shadow-2xl">
        <h1 className="text-4xl font-bold text-center mb-6">
          <span className="text-slate-900">Mid</span><span className="text-cyan-600">lync</span>
          <span className="text-sm text-green-600 ml-2">✨ {trialDays} Days Free Trial</span>
        </h1>
        
        {/* Role Selection */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button onClick={() => setRole('manufacturer')} className={`p-3 rounded-xl border-2 transition ${role === 'manufacturer' ? 'border-cyan-600 bg-cyan-50' : 'border-slate-200'}`}>
            🏭 Manufacturer
          </button>
          <button onClick={() => setRole('buyer')} className={`p-3 rounded-xl border-2 transition ${role === 'buyer' ? 'border-cyan-600 bg-cyan-50' : 'border-slate-200'}`}>
            🛒 Buyer
          </button>
        </div>

        {error && <div className="bg-red-50 text-red-600 p-3 mb-4 text-sm rounded-lg">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-3 mb-4 text-sm rounded-lg">{success}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company Name *</label>
              <input type="text" required value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} placeholder="Company Name" className="w-full border rounded-lg px-4 py-3" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <input type="text" value={form.country} onChange={e => setForm({...form, country: e.target.value})} placeholder="Country" className="w-full border rounded-lg px-4 py-3" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email *</label>
              <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder="Email" className="w-full border rounded-lg px-4 py-3" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password *</label>
              <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} placeholder="Password (min 8 characters)" className="w-full border rounded-lg px-4 py-3" />
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg text-center text-sm text-blue-700">
            🎉 <strong>{trialDays}-day free trial</strong> included! No credit card required.
          </div>

          <button type="submit" disabled={loading} className="w-full bg-cyan-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
            {loading ? 'Creating Account...' : `Start ${trialDays}-Day Free Trial`}
          </button>
        </form>

        <p className="text-center text-sm mt-6">
          Have an account? <Link href="/login" className="text-cyan-600">Login</Link>
        </p>
      </div>
    </div>
  )
}