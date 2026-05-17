import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-blue-900 flex flex-col items-center justify-center text-white px-4">
      <div className="text-center max-w-3xl">
        <div className="text-sm font-bold tracking-widest text-blue-300 uppercase mb-4">
          B2B Manufacturing Platform
        </div>
        <h1 className="text-5xl font-bold mb-6 leading-tight">
          Midlync
        </h1>
        <p className="text-xl text-slate-300 mb-10">
          Connect manufacturers with verified global buyers. Privacy-first. Agency-managed.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition">
            Login →
          </Link>
          <Link href="/register" className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl transition border border-white/20">
            Register Free
          </Link>
        </div>
        <div className="mt-16 grid grid-cols-3 gap-6 text-center">
          <div className="bg-white/10 rounded-xl p-6">
            <div className="text-3xl mb-2">🏭</div>
            <div className="font-bold">Manufacturers</div>
            <div className="text-sm text-slate-400 mt-1">List products, manage QR, export catalogues</div>
          </div>
          <div className="bg-white/10 rounded-xl p-6">
            <div className="text-3xl mb-2">🛒</div>
            <div className="font-bold">Buyers</div>
            <div className="text-sm text-slate-400 mt-1">Browse verified products, send RFQs</div>
          </div>
          <div className="bg-white/10 rounded-xl p-6">
            <div className="text-3xl mb-2">🏢</div>
            <div className="font-bold">Agency</div>
            <div className="text-sm text-slate-400 mt-1">Manage connections, verify vendors</div>
          </div>
        </div>
      </div>
    </main>
  )
}