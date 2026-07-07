'use client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function SubscriptionPage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-4xl font-bold mb-4 text-slate-900">All Features Included!</h1>
          <p className="text-xl text-slate-600 mb-6">
            Subscriptions have been removed. All features are now free and available to everyone.
          </p>
          
          <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 mb-8">
            <p className="text-lg text-slate-700">
              ✅ Unlimited products  •  ✅ All inquiries  •  ✅ Full support  •  ✅ No credit card needed
            </p>
          </div>
          
          <button 
            onClick={() => router.back()} 
            className="inline-block bg-cyan-600 hover:bg-cyan-700 text-white px-8 py-3 rounded-lg font-semibold transition"
          >
            ← Go Back
          </button>
        </div>
      </div>
    </div>
  )
}