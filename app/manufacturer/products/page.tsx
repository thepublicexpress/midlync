'use client'
import { useRouter } from 'next/navigation'

export default function ProductsPage() {
  const router = useRouter()
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">📦</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Products</h1>
        <p className="text-slate-500 mb-6">Product management coming soon</p>
        <button
          onClick={() => router.push('/manufacturer/dashboard')}
          className="bg-blue-600 text-white font-bold px-6 py-3 rounded-xl">
          ← Back to Dashboard
        </button>
      </div>
    </div>
  )
}