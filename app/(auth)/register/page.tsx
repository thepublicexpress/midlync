'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function RegisterPage() {
  const [role, setRole] = useState<'manufacturer' | 'buyer'>('manufacturer')
  const [form, setForm] = useState({ email: '', password: '', company_name: '', country: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Sign up with metadata — trigger will create profile automatically
    const { data, error: authError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          role: role,
          company_name: form.company_name,
          country: form.country,
        }
      }
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    if (data.user) {
      // Wait for trigger to create profile
      await new Promise(resolve => setTimeout(resolve, 1000))
      if (role === 'manufacturer') router.push('/manufacturer/dashboard')
      else router.push('/buyer/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Midlync</h1>
          <p className="text-slate-500 mt-2">Create your account</p>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <button type="button" onClick={() => setRole('manufacturer')}
            className={`p-4 rounded-xl border-2 text-center transition ${role === 'manufacturer' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
            <div className="text-2xl mb-1">🏭</div>
            <div className="font-bold text-sm">Manufacturer</div>
          </button>
          <button type="button" onClick={() => setRole('buyer')}
            className={`p-4 rounded-xl border-2 text-center transition ${role === 'buyer' ? 'border-blue-600 bg-blue-50' : 'border-slate-200'}`}>
            <div className="text-2xl mb-1">🛒</div>
            <div className="font-bold text-sm">Buyer</div>
          </button>
        </div>
        {error && <div className="bg-red-50 text-red-600 border border-red-200 rounded-lg p-3 mb-4 text-sm">{error}</div>}
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Company Name</label>
            <input type="text" required value={form.company_name}
              onChange={e => setForm({...form, company_name: e.target.value})}
              className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              placeholder="ABC Industries"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Country</label>
            <input type="text" value={form.country}
              onChange={e => setForm({...form, country: e.target.value})}
              className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              placeholder="India"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input type="email" required value={form.email}
              onChange={e => setForm({...form, email: e.target.value})}
              className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              placeholder="you@company.com"/>
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <input type="password" required value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Min 8 characters"/>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition disabled:opacity-50">
            {loading ? 'Creating account...' : `Register as ${role === 'manufacturer' ? 'Manufacturer' : 'Buyer'} →`}
          </button>
        </form>
        <p className="text-center text-sm text-slate-500 mt-6">
          Already have an account? <Link href="/login" className="text-blue-600 font-semibold">Login</Link>
        </p>
      </div>
    </div>
  )
}