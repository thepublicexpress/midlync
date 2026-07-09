'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function VerifyOtpPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get('email') || ''
  const [otp, setOtp] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    const response = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    })

    const result = await response.json()

    if (!response.ok) {
      setError(result?.error || 'Invalid OTP')
      setLoading(false)
      return
    }

    setMessage('Email verified successfully. Redirecting to login...')
    setTimeout(() => router.push('/login'), 1500)
    setLoading(false)
  }

  async function handleResend() {
    if (!email) return
    setLoading(true)
    setError('')
    setMessage('')

    const response = await fetch('/api/auth/resend-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    })

    const result = await response.json()

    if (!response.ok) {
      setError(result?.error || 'Failed to resend OTP')
    } else {
      setMessage('A new OTP has been sent to your email.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-800 flex items-center justify-center px-4 py-10">
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-bold text-center mb-4">
          <span className="text-slate-900">Mid</span><span className="text-cyan-600">lync</span>
        </h1>
        <p className="text-center text-slate-600 mb-6">
          We sent a 6-digit OTP to <strong>{email}</strong>. Enter it below to verify your account.
        </p>

        {error && <div className="bg-red-50 text-red-600 p-3 mb-4 text-sm rounded-lg">{error}</div>}
        {message && <div className="bg-green-50 text-green-600 p-3 mb-4 text-sm rounded-lg">{message}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            maxLength={6}
            inputMode="numeric"
            value={otp}
            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
            placeholder="Enter OTP"
            className="w-full border rounded-lg px-4 py-3 text-center text-2xl tracking-[0.4em]"
            required
          />
          <button type="submit" disabled={loading || otp.length !== 6} className="w-full bg-cyan-600 text-white font-bold py-3 rounded-xl disabled:opacity-50">
            {loading ? 'Verifying OTP...' : 'Verify OTP'}
          </button>
        </form>

        <button type="button" onClick={handleResend} disabled={loading || !email} className="w-full mt-3 border border-cyan-600 text-cyan-700 font-semibold py-3 rounded-xl disabled:opacity-50">
          Resend OTP
        </button>
      </div>
    </div>
  )
}
