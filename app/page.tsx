'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function HomePage() {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    async function getUser() {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()
  }, [])

  return (
    <main className="min-h-screen relative">
      {/* Background Image - Professional Handshake/Trade Deal */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=1974&auto=format')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Dark Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Navbar */}
        <nav className="bg-black/30 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <span className="text-2xl font-bold">
                  <span className="text-white">Mid</span>
                  <span className="text-cyan-300">lync</span>
                </span>
              </div>
              <div className="flex items-center gap-4">
                {user ? (
                  <Link
                    href="/manufacturer/dashboard"
                    className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-5 py-2 rounded-lg transition"
                  >
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link
                      href="/login"
                      className="text-white hover:text-cyan-300 transition font-medium"
                    >
                      Login
                    </Link>
                    <Link
                      href="/register"
                      className="bg-cyan-600 hover:bg-cyan-700 text-white font-semibold px-5 py-2 rounded-lg transition"
                    >
                      Register Free
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
              Global B2B Trade
              <br />
              <span className="text-cyan-300">Made Simple & Secure</span>
            </h1>
            <p className="text-xl text-slate-200 mb-8 max-w-3xl mx-auto">
              Connect manufacturers with verified global buyers. 
              Privacy-first, agency-managed, and built for scale.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/register"
                className="bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-8 rounded-xl transition text-lg"
              >
                Get Started →
              </Link>
              <Link
                href="/login"
                className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl transition text-lg border border-white/20 backdrop-blur-sm"
              >
                Sign In
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-20 text-center">
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-4xl font-bold text-white">1000+</div>
              <div className="text-cyan-300 mt-2">Manufacturers</div>
            </div>
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-4xl font-bold text-white">5000+</div>
              <div className="text-cyan-300 mt-2">Buyers</div>
            </div>
            <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/20">
              <div className="text-4xl font-bold text-white">50+</div>
              <div className="text-cyan-300 mt-2">Countries</div>
            </div>
          </div>

          {/* Features - Only Manufacturer & Buyer */}
          <div className="mt-24">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              Why Choose <span className="text-cyan-300">Midlync</span>?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center hover:bg-black/40 transition">
                <div className="text-5xl mb-4">🏭</div>
                <h3 className="text-xl font-bold text-white mb-2">For Manufacturers</h3>
                <p className="text-slate-200">
                  List products, manage inventory, generate QR codes, export catalogues, and connect with global buyers.
                </p>
              </div>
              <div className="bg-black/30 backdrop-blur-md rounded-xl p-6 border border-white/20 text-center hover:bg-black/40 transition">
                <div className="text-5xl mb-4">🛒</div>
                <h3 className="text-xl font-bold text-white mb-2">For Buyers</h3>
                <p className="text-slate-200">
                  Browse verified products, send RFQs, track orders, and build long-term supplier relationships.
                </p>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mt-24">
            <h2 className="text-3xl md:text-4xl font-bold text-white text-center mb-12">
              How <span className="text-cyan-300">It Works</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="w-20 h-20 bg-cyan-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">1</div>
                <h3 className="text-xl font-bold text-white mb-2">Sign Up</h3>
                <p className="text-slate-200">Create your free account as Manufacturer or Buyer</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 bg-cyan-600 rounded-full flex items-center justify-center text-3xl font-bold text-white mx-auto mb-4">2</div>
                <h3 className="text-xl font-bold text-white mb-2">Get Started</h3>
                <p className="text-slate-200">List products, send inquiries, and grow your business</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-20 bg-cyan-700/40 backdrop-blur-md rounded-2xl p-8 md:p-12 text-center border border-cyan-500/30">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to grow your business?
            </h2>
            <p className="text-slate-200 mb-6 max-w-2xl mx-auto">
              Join thousands of manufacturers and buyers already using Midlync.
            </p>
            <Link
              href="/register"
              className="bg-white text-cyan-700 hover:bg-slate-100 font-bold py-3 px-8 rounded-xl transition text-lg"
            >
              Create Free Account
            </Link>
          </div>

          {/* Footer */}
          <footer className="mt-20 pt-8 border-t border-white/20 text-center text-slate-300 text-sm">
            <p>&copy; 2026 Midlync — B2B Manufacturing Platform. All rights reserved.</p>
          </footer>
        </div>
      </div>
    </main>
  )
}