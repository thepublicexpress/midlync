'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const supabase = createClient()

  useEffect(() => {
    loadNotifications()
    const interval = setInterval(loadNotifications, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  async function loadNotifications() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      const response = await fetch(`/api/notifications?userId=${user.id}&limit=20`)
      const data = await response.json()
      if (data.success) {
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Failed to load notifications:', err)
    }
  }

  async function markAsRead(id) {
    try {
      await fetch(`/api/notifications/${id}`, { method: 'PATCH' })
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (err) {
      console.error('Failed to mark as read:', err)
    }
  }

  async function handleNotificationClick(notif) {
    if (!notif.is_read) {
      await markAsRead(notif.id)
    }
    setIsOpen(false)
    
    // Navigate based on notification type
    if (notif.type === 'inquiry' && notif.related_id) {
      try {
        const response = await fetch(`/api/inquiries/${notif.related_id}`)
        const data = await response.json()
        if (data.success && data.inquiry) {
          window.location.href = `/manufacturer/buyer/${data.inquiry.buyer_id}`
        }
      } catch (err) {
        console.error('Error:', err)
      }
    } else if (notif.type === 'order' && notif.related_id) {
      window.location.href = `/manufacturer/orders/${notif.related_id}`
    }
  }

  const getIcon = (type) => {
    switch(type) {
      case 'inquiry': return '📩'
      case 'connection': return '🤝'
      case 'stock': return '⚠️'
      case 'order': return '📦'
      default: return '🔔'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={() => setIsOpen(!isOpen)} className="relative p-2 rounded-lg hover:bg-slate-700 transition">
        <span className="text-xl">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border z-50">
          <div className="p-3 border-b bg-slate-50 flex justify-between items-center">
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && <span className="text-xs text-blue-600">{unreadCount} unread</span>}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400">No notifications</div>
            ) : (
              notifications.map((n) => (
                <div 
                  key={n.id} 
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${!n.is_read ? 'bg-blue-50' : ''}`} 
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="flex gap-3">
                    <div className="text-2xl">{getIcon(n.type)}</div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{n.title}</div>
                      <div className="text-xs text-slate-500">{n.message}</div>
                      <div className="text-xs text-slate-400 mt-1">
                        {new Date(n.created_at).toLocaleString()}
                      </div>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}