/**
 * Email utility for sending notifications to admin
 */

export async function sendAdminEmail(subject: string, message: string, type: string = 'notification') {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'info@midlync.com'
    
    // Log the email that would be sent
    console.log(`[ADMIN EMAIL] To: ${adminEmail}`)
    console.log(`[ADMIN EMAIL] Subject: ${subject}`)
    console.log(`[ADMIN EMAIL] Type: ${type}`)
    console.log(`[ADMIN EMAIL] Message: ${message}`)
    console.log(`[ADMIN EMAIL] Timestamp: ${new Date().toISOString()}`)
    
    // For now, we'll just log to console since we don't have email service configured
    // In production, integrate with SendGrid, Resend, or similar
    
    return { success: true, message: 'Admin notified' }
  } catch (error) {
    console.error('Error sending admin email:', error)
    return { success: false, error: (error as Error).message }
  }
}

export async function sendBuyerLikeNotification(
  buyerCode: string,
  productTitle: string,
  manufacturerCode: string
) {
  const subject = `📌 Buyer Liked Product: ${productTitle}`
  const message = `
Buyer Code: ${buyerCode}
Product: ${productTitle}
Manufacturer Code: ${manufacturerCode}
Action: Buyer has marked this product as liked/wishlist
Time: ${new Date().toLocaleString()}
  `
  
  return sendAdminEmail(subject, message, 'buyer-like')
}

export async function sendInquiryNotification(
  buyerCode: string,
  productTitle: string,
  manufacturerCode: string,
  quantity: number,
  message: string
) {
  const subject = `📨 New Inquiry from ${buyerCode}`
  const messageBody = `
Buyer Code: ${buyerCode}
Product: ${productTitle}
Manufacturer Code: ${manufacturerCode}
Quantity: ${quantity}

Buyer Message:
${message}

Time: ${new Date().toLocaleString()}
  `
  
  return sendAdminEmail(subject, messageBody, 'inquiry')
}

export async function sendOrderNotification(
  buyerCode: string,
  orderNumber: string,
  amount: number,
  manufacturerCode: string
) {
  const subject = `🛒 New Order ${orderNumber} from ${buyerCode}`
  const message = `
Buyer Code: ${buyerCode}
Order Number: ${orderNumber}
Amount: ₹${amount.toLocaleString('en-IN')}
Manufacturer Code: ${manufacturerCode}
Time: ${new Date().toLocaleString()}
  `
  
  return sendAdminEmail(subject, message, 'order')
}
