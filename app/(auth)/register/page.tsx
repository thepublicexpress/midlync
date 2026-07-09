'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { countries } from '@/lib/countries'

export default function RegisterPage() {
  const [role, setRole] = useState('manufacturer')
  const [form, setForm] = useState({ email: '', password: '', company_name: '', country: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long.')
      setLoading(false)
      return
    }
    
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        company_name: form.company_name,
        country: form.country,
        role
      })
    })

    const result = await response.json()

    if (!response.ok) {
      setError(result?.error || 'Failed to send OTP')
      setLoading(false); 
      return 
    }

    setSuccess(`OTP sent to ${form.email}. Redirecting to verification...`)
    setTimeout(() => router.push(`/verify-otp?email=${encodeURIComponent(form.email)}`), 1200)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-800 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl p-8 w-full max-w-6xl shadow-2xl">
        <h1 className="text-4xl font-bold text-center mb-6">
          <span className="text-slate-900">Mid</span><span className="text-cyan-600">lync</span>
        </h1>
        
        {error && <div className="bg-red-50 text-red-600 p-3 mb-4 text-sm rounded-lg">{error}</div>}
        {success && <div className="bg-green-50 text-green-600 p-3 mb-4 text-sm rounded-lg">{success}</div>}

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button type="button" onClick={() => setRole('manufacturer')} className={`p-3 rounded-xl border-2 transition ${role === 'manufacturer' ? 'border-cyan-600 bg-cyan-50' : 'border-slate-200'}`}>
              🏭 Manufacturer
            </button>
            <button type="button" onClick={() => setRole('buyer')} className={`p-3 rounded-xl border-2 transition ${role === 'buyer' ? 'border-cyan-600 bg-cyan-50' : 'border-slate-200'}`}>
              🛒 Buyer
            </button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Company Name *</label>
              <input type="text" required value={form.company_name} onChange={e => setForm({...form, company_name: e.target.value})} placeholder="Company Name" className="w-full border rounded-lg px-4 py-3" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Country</label>
              <select
                value={form.country}
                onChange={e => setForm({ ...form, country: e.target.value })}
                className="w-full border rounded-lg px-4 py-3 bg-white"
                required
              >
                <option value="">Select Country</option>
                {countries.map(country => (
                  <option key={country.name} value={country.name}>
                    {country.name}
                  </option>
                ))}
              </select>
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

          <button type="submit" disabled={loading} className="w-full bg-cyan-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-center text-sm mt-6">
          Have an account? <Link href="/login" className="text-cyan-600">Login</Link>
        </p>
      </div>
    </div>
  )
}