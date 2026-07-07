'use client'
import { useRouter } from 'next/navigation'

export default function PaymentPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-cyan-800 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-3">All Features Unlocked!</h1>
        <p className="text-slate-600 mb-6">
          Subscriptions have been removed. All features are now available to everyone at no cost.
        </p>
        
        <button 
          onClick={() => router.back()} 
          className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-3 rounded-lg font-semibold transition"
        >
          ← Go Back
        </button>
      </div>
    </div>
  )
}