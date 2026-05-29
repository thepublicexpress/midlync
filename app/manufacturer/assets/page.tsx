'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar'

export default function DigitalAssetsPage() {
  const [assets, setAssets] = useState([])
  const [folders, setFolders] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [showMoodBoardModal, setShowMoodBoardModal] = useState(false)
  const [moodBoardImages, setMoodBoardImages] = useState([])
  const [moodBoardDescription, setMoodBoardDescription] = useState('')
  const [moodBoardTitle, setMoodBoardTitle] = useState('')
  const [moodBoardResult, setMoodBoardResult] = useState(null)
  const [aiProcessing, setAiProcessing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFolderModal, setShowFolderModal] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }
    
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    setProfile(profileData)
    
    const { data: assetsData } = await supabase.from('digital_assets').select('*').eq('manufacturer_id', user.id)
    setAssets(assetsData || [])
    setLoading(false)
  }

  async function uploadAsset(file) {
    setUploading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const fileName = `${Date.now()}_${file.name}`
      const filePath = `assets/${user.id}/${fileName}`
      
      const { error: uploadError } = await supabase.storage.from('product-images').upload(filePath, file)
      if (uploadError) throw uploadError
      
      const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(filePath)
      
      await supabase.from('digital_assets').insert({
        manufacturer_id: user.id,
        asset_type: 'image',
        file_url: publicUrl,
        title: file.name,
        size: file.size
      })
      
      loadData()
    } catch (err) {
      alert('Upload failed: ' + err.message)
    }
    setUploading(false)
  }

  async function deleteAsset(id) {
    if (!confirm('Delete this asset?')) return
    await supabase.from('digital_assets').delete().eq('id', id)
    loadData()
  }

  async function analyzeMoodBoard() {
    if (moodBoardImages.length === 0 && !moodBoardDescription) {
      alert('Please upload images or enter description')
      return
    }
    setAiProcessing(true)
    try {
      const response = await fetch('/api/mood-board', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          images: moodBoardImages,
          description: moodBoardDescription
        })
      })
      const data = await response.json()
      if (data.success) {
        setMoodBoardResult(data.analysis)
      } else {
        alert('Analysis failed: ' + data.error)
      }
    } catch (err) {
      alert('Error: ' + err.message)
    }
    setAiProcessing(false)
  }

  if (loading) return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar role="manufacturer" companyName={profile?.company_name || 'Manufacturer'} />

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Digital Asset Management</h1>
            <p className="text-slate-500 text-sm">{assets.length} assets</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowMoodBoardModal(true)} className="bg-purple-600 text-white px-4 py-2 rounded-lg">
              🎨 Mood Board AI
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="bg-cyan-600 text-white px-4 py-2 rounded-lg">
              📤 Upload Asset
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={(e) => {
              Array.from(e.target.files).forEach(f => uploadAsset(f))
              e.target.value = ''
            }} className="hidden" />
          </div>
        </div>

        <div className="mb-6">
          <input type="text" placeholder="Search assets..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} 
            className="w-full border rounded-lg px-4 py-2" />
        </div>

        {assets.length === 0 ? (
          <div className="bg-white rounded-2xl p-16 text-center border">
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-slate-500 mb-4">No assets uploaded yet</p>
            <button onClick={() => fileInputRef.current?.click()} className="bg-cyan-600 text-white px-6 py-3 rounded-xl">
              Upload Your First Asset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {assets.map((asset) => (
              <div key={asset.id} className="bg-white rounded-xl border shadow-sm overflow-hidden group">
                <div className="aspect-square bg-slate-100 relative">
                  <img src={asset.file_url} className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                    <button onClick={() => deleteAsset(asset.id)} className="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                      🗑️
                    </button>
                  </div>
                </div>
                <div className="p-3">
                  <p className="font-medium text-sm truncate">{asset.title}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mood Board Modal */}
      {showMoodBoardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-auto" onClick={() => setShowMoodBoardModal(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold mb-4">🎨 AI Mood Board Decoder</h2>
            <p className="text-slate-500 text-sm mb-4">Upload reference images or describe your inspiration.</p>
            
            <div className="mb-4">
              <input type="text" placeholder="Mood Board Title" value={moodBoardTitle} onChange={e => setMoodBoardTitle(e.target.value)} 
                className="w-full border rounded-lg p-2" />
            </div>
            
            <div className="mb-4">
              <textarea rows={2} placeholder="Describe your design inspiration..." value={moodBoardDescription} onChange={e => setMoodBoardDescription(e.target.value)} 
                className="w-full border rounded-lg p-2" />
            </div>
            
            <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 text-center mb-4">
              <input type="file" accept="image/*" multiple onChange={(e) => {
                const files = Array.from(e.target.files)
                files.forEach(file => {
                  const reader = new FileReader()
                  reader.onload = (event) => {
                    setMoodBoardImages(prev => [...prev, event.target.result])
                  }
                  reader.readAsDataURL(file)
                })
              }} className="hidden" id="moodBoardUpload" />
              <label htmlFor="moodBoardUpload" className="cursor-pointer text-cyan-600">📤 Click to upload reference images</label>
            </div>
            
            {moodBoardImages.length > 0 && (
              <div className="grid grid-cols-4 gap-2 mb-4">
                {moodBoardImages.map((img, i) => (
                  <img key={i} src={img} className="w-full h-24 object-cover rounded" />
                ))}
              </div>
            )}
            
            <button onClick={analyzeMoodBoard} disabled={aiProcessing || (moodBoardImages.length === 0 && !moodBoardDescription)} 
              className="w-full bg-purple-600 text-white py-2 rounded-lg disabled:opacity-50 mb-4">
              {aiProcessing ? '🤖 AI Analyzing...' : '✨ Analyze Mood Board'}
            </button>
            
            {moodBoardResult && (
              <div className="bg-slate-50 rounded-lg p-4">
                <h3 className="font-semibold mb-2">AI Analysis Result</h3>
                <div className="text-sm">
                  <p><strong>Category:</strong> {moodBoardResult.category || 'N/A'}</p>
                  <p><strong>Fabric Type:</strong> {moodBoardResult.fabricType || 'N/A'}</p>
                  <p><strong>Colors:</strong> {moodBoardResult.colors?.join(', ') || 'N/A'}</p>
                  <p><strong>Pattern:</strong> {moodBoardResult.pattern || 'N/A'}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}