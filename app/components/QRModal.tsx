'use client'
import { useState } from 'react'

export default function QRModal({ isOpen, onClose, product }) {
  const [qrUrl, setQrUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const generateQR = async () => {
    if (!product) return
    setLoading(true)
    const url = `${window.location.origin}/products/${product.id}`
    const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(url)}`
    setQrUrl(qrApi)
    setLoading(false)
  }

  const downloadQR = () => {
    if (qrUrl) {
      const link = document.createElement('a')
      link.href = qrUrl
      link.download = `${product.title}-qr.png`
      link.click()
    }
  }

  const printQR = () => {
    const printWindow = window.open('', '_blank')
    printWindow?.document.write(`
      <html>
        <head><title>QR Code - ${product.title}</title></head>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh">
          <div style="text-align:center">
            <img src="${qrUrl}" style="width:250px;height:250px" />
            <h2>${product.title}</h2>
            <p>${window.location.origin}/products/${product.id}</p>
          </div>
        </body>
      </html>
    `)
    printWindow?.document.close()
    printWindow?.print()
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold mb-2">QR Code</h2>
        <p className="text-slate-500 text-sm mb-4">{product?.title}</p>

        {!qrUrl ? (
          <button
            onClick={generateQR}
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-3 rounded-xl mb-4"
          >
            {loading ? 'Generating...' : 'Generate QR Code'}
          </button>
        ) : (
          <>
            <div className="bg-slate-50 p-4 rounded-xl flex justify-center mb-4">
              <img src={qrUrl} alt="QR Code" className="w-64 h-64" />
            </div>
            <div className="flex gap-3">
              <button
                onClick={downloadQR}
                className="flex-1 bg-green-600 text-white py-2 rounded-lg"
              >
                💾 Download
              </button>
              <button
                onClick={printQR}
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg"
              >
                🖨️ Print
              </button>
              <button
                onClick={onClose}
                className="flex-1 border border-slate-200 text-slate-700 py-2 rounded-lg"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}