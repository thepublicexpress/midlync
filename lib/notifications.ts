import { createClient } from '@/lib/supabase/client'

export interface NotificationData {
  userId: string
  title: string
  message: string
  type: 'order' | 'product' | 'system' | 'payment'
  relatedId?: string
}

export async function sendNotification(notification: NotificationData) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('notifications')
    .insert({
      user_id: notification.userId,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      related_id: notification.relatedId,
      is_read: false
    })
    .select()
    .single()
  
  if (error) {
    console.error('Error sending notification:', error)
    return null
  }
  
  return data
}export async function markAsRead(notificationId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('id', notificationId)
  
  if (error) console.error('Error marking as read:', error)
}

export async function getUnreadCount(userId: string) {
  const supabase = createClient()
  
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false)
  
  if (error) return 0
  return count || 0
}export async function getNotifications(userId: string, limit: number = 20) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  
  if (error) return []
  return data
}

export async function markAllAsRead(userId: string) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('is_read', false)
  
  if (error) console.error('Error marking all as read:', error)
}