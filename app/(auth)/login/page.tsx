'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError(error.message); setLoading(false); return }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).single()
    const role = profile?.role
    if (role === 'manufacturer') router.push('/manufacturer/dashboard')
    else if (role === 'buyer') router.push('/buyer/dashboard')
    else if (role === 'admin') router.push('/admin')
    else router.push('/')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-4xl font-bold text-center mb-6"><span className="text-slate-900">Mid</span><span className="text-cyan-600">lync</span></h1>
        {error && <div className="bg-red-50 text-red-600 p-3 mb-4 text-sm">{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Email" className="w-full border rounded-lg px-4 py-3" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Password" className="w-full border rounded-lg px-4 py-3" />
          <div className="text-right"><Link href="/forgot-password" className="text-sm text-cyan-600">Forgot Password?</Link></div>
          <button type="submit" disabled={loading} className="w-full bg-cyan-600 text-white font-bold py-3 rounded-xl">{loading ? 'Logging in...' : 'Login'}</button>
        </form>
        <p className="text-center text-sm mt-6">No account? <Link href="/register" className="text-cyan-600">Register</Link></p>
      </div>
    </div>
  )
}