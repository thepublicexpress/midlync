'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const queryEmail = params.get('email') || ''
    setEmail(queryEmail)

    if (!queryEmail) {
      setError('Missing email. Please request a new reset OTP.')
    }
  }, [])

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault()
    setVerifying(true)
    setError('')
    setMessage('')

    const response = await fetch('/api/auth/verify-reset-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    })

    const result = await response.json()

    if (!response.ok) {
      setError(result?.error || 'Invalid OTP')
      setVerifying(false)
      return
    }

    setOtpVerified(true)
    setMessage('✅ OTP verified. Now create your new password below.')
    setVerifying(false)
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      setError('Passwords do not match!')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long')
      return
    }

    setLoading(true)
    setError('')
    setMessage('')

    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, password, confirmPassword })
    })

    const result = await response.json()

    if (!response.ok) {
      setError(result?.error || 'Password reset failed')
    } else {
      setMessage('✅ Password updated! Redirecting to login...')
      setTimeout(() => router.push('/login'), 1800)
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
          <p className="text-gray-500 mt-2">Reset your password with OTP</p>
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

        {!otpVerified ? (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <p className="text-sm text-gray-600">
              We sent a 6-digit OTP to <strong>{email}</strong>. Enter it below.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">OTP</label>
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="Enter OTP"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-center text-2xl tracking-[0.4em] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                required
              />
            </div>

            <button
              type="submit"
              disabled={verifying || otp.length !== 6}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
            >
              {verifying ? 'Verifying...' : 'Verify OTP'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="bg-cyan-50 border border-cyan-200 text-cyan-700 p-3 rounded-lg text-sm">
              OTP verified. Create a new password below.
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="Enter new password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm your password"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-50"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        <p className="text-center text-sm mt-6">
          <Link href="/login" className="text-cyan-600 hover:underline">
            ← Back to Login
          </Link>
        </p>
      </div>
    </div>
  )
}
