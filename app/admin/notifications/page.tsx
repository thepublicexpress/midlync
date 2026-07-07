'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminNotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAndLoad()
  }, [])

  async function checkAdminAndLoad() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/admin/login'); return }
      
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      if (profileData?.role !== 'admin') { router.push('/'); return }
      
      setProfile(profileData)
      await loadNotifications()
    } catch (err) {
      console.error(err)
    }
  }

  async function loadNotifications() {
    try {
      const response = await fetch('/api/notifications?userId=admin')
      const data = await response.json()
      setNotifications(data.notifications || [])
      setLoading(false)
    } catch (error) {
      console.error('Error loading notifications:', error)
      setLoading(false)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'inquiry': return '📨'
      case 'order': return '🛒'
      case 'wishlist': return '📌'
      case 'invoice': return '📄'
      default: return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'inquiry': return 'border-l-blue-500 bg-blue-50'
      case 'order': return 'border-l-green-500 bg-green-50'
      case 'wishlist': return 'border-l-pink-500 bg-pink-50'
      case 'invoice': return 'border-l-purple-500 bg-purple-50'
      default: return 'border-l-slate-500 bg-slate-50'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-slate-500">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-red-700 px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <Link href="/admin/dashboard" className="text-white hover:text-gray-100">
            ← Dashboard
          </Link>
          <h1 className="text-xl font-bold text-white">Admin Notifications</h1>
        </div>
        <span className="bg-white text-red-700 text-xs px-3 py-1 rounded-full font-bold">
          {notifications.length} NEW
        </span>
      </nav>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        {notifications.length === 0 ? (
          <div className="bg-white rounded-xl border p-12 text-center">
            <div className="text-6xl mb-4">🔔</div>
            <p className="text-slate-500 text-lg mb-2">No notifications yet</p>
            <p className="text-slate-400 text-sm">System notifications will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif: any) => (
              <div
                key={notif.id}
                className={`bg-white rounded-lg border-l-4 p-4 shadow-sm ${getNotificationColor(notif.type)}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{getNotificationIcon(notif.type)}</span>
                      <h3 className="font-semibold text-slate-900">{notif.title}</h3>
                      {!notif.is_read && (
                        <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">NEW</span>
                      )}
                    </div>
                    <p className="text-slate-700 mb-2">{notif.message}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(notif.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => {
                        // Mark as read
                        supabase.from('notifications').update({ is_read: true }).eq('id', notif.id).then(() => loadNotifications())
                      }}
                      className="text-sm px-3 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                    >
                      ✓ Read
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
