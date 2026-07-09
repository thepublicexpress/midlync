'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })

    const result = await response.json()
    
    if (!response.ok) {
      setError(result?.error || 'Failed to send OTP')
    } else {
      setMessage(`✅ OTP sent to ${email}. Redirecting to verification...`)
      setTimeout(() => router.push(`/reset-password?email=${encodeURIComponent(email)}`), 1200)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold">
            <span className="text-slate-900">Mid</span>
            <span className="text-cyan-600">lync</span>
          </h1>
          <p className="text-gray-500 mt-2">Reset your password</p>
        </div>
        
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-600 p-3 mb-4 text-sm rounded-lg">
            {message}
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 mb-4 text-sm rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={handleReset} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)} 
              required 
              placeholder="you@example.com" 
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send OTP'}
          </button>
        </form>
        
        <p className="text-center text-sm mt-6">
          <Link href="/login" className="text-cyan-600 hover:underline">
            ← Back to Login
          </Link>
        </p>
      </div>
    </div>
  )
}