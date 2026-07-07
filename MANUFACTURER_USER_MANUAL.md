# Midlync B2B Platform - Manufacturer User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Product Management](#product-management)
4. [Inventory Management](#inventory-management)
5. [Managing Inquiries](#managing-inquiries)
6. [Processing Orders](#processing-orders)
7. [Handling Shipments](#handling-shipments)
8. [Analytics & Insights](#analytics--insights)
9. [Profile & Company Setup](#profile--company-setup)
10. [Advanced Features](#advanced-features)

---

## Getting Started

### Registration

1. Visit Midlync platform homepage
2. Click **"Sign Up"** or **"Register"**
3. Select **"Manufacturer"** as your user role
4. Enter your details:
   - Email address
   - Password (minimum 8 characters)
5. Click **"Create Account"**
6. Verify email via confirmation link
7. **Your unique manufacturer code is auto-generated!** (e.g., MFR-XXXX)
   - Buyers see only this code
   - Your company details stay private on the marketplace

### First Login

- Enter email and password
- Complete company profile setup
- Add your first products
- Start receiving orders

---

## Dashboard Overview

### Manufacturer Dashboard (`/manufacturer/dashboard`)

Your central control center with key metrics:

**📊 Dashboard Widgets:**

1. **Quick Stats**
   - Active orders count
   - Monthly revenue
   - Total products listed
   - Pending inquiries
   - Average response time

2. **Recent Orders**
   - Last 10 orders
   - Order status & dates
   - Order values
   - Quick action buttons

3. **Pending Inquiries**
   - Unanswered buyer inquiries
   - Inquiry timestamps
   - Quick response options

4. **Navigation Menu**
   ```
   Dashboard → Products → Inquiries → Orders
   Inventory → Analytics → Profile → Catalogue
   ```

---

## Product Management

### Products Page (`/manufacturer/products`)

**View All Products:**
- List of all your products
- Status (Active/Inactive)
- Stock levels
- Sales count
- Last updated date

### Adding a New Product

1. Click **"➕ Add New Product"**
2. Fill in product details:

**Basic Information:**
- Product title (required)
- Description (detailed, helps buyers)
- Category (select from dropdown)
- Product images (upload min 1, max 5)

**Pricing & Availability:**
- Cost price (for internal tracking)
- Selling price (per unit)
- Currency (INR/USD)
- MOQ - Minimum Order Quantity
- Maximum available quantity

**Specifications:**
- Weight & dimensions
- Material type
- Color options
- Technical specifications
- Certifications

3. Click **"Publish Product"** to list on marketplace

### Editing Products

1. Go to **Products** page
2. Click on any product
3. Edit any field
4. Click **"Update Product"**
5. Changes live immediately

### Product Visibility

- **Active:** Visible to all buyers on marketplace
- **Inactive:** Hidden from buyers (keep for later)
- **Out of Stock:** Still visible but marked unavailable

---

## Inventory Management

### Inventory Page (`/manufacturer/inventory`)

**Real-time Inventory Tracking:**
- Product stock levels
- Reorder alerts
- Stock movement history
- Low stock warnings

**Managing Stock:**

1. **Update Stock**
   - Click product in inventory
   - Adjust quantity
   - Add notes (e.g., "New batch received")
   - Save

2. **Set Low Stock Alert**
   - Enable alerts for products
   - Set minimum quantity threshold
   - Receive notifications when stock low

3. **Stock History**
   - View all stock changes
   - Date & reason for changes
   - Track inbound shipments

**Best Practices:**
- Update inventory after each order
- Set realistic MOQs based on production capacity
- Monitor slow-moving products
- Plan for seasonal demand

---

## Managing Inquiries

### Inquiries Page (`/manufacturer/inquiries`)

**View All Buyer Inquiries:**

Buyers send inquiries asking about:
- Product availability
- Bulk pricing
- Custom specifications
- Delivery timelines
- Payment terms

**Inquiry Details Include:**
- Buyer code (not real name - privacy)
- Product requested
- Quantity needed
- Delivery timeline
- Budget range
- Special requirements
- Inquiry date & time

### Responding to Inquiries

1. Navigate to **Inquiries** section
2. Click on any inquiry to open
3. Review buyer's requirements
4. Click **"Reply"** button
5. Choose response type:

**Option A: Send Quote**
- Enter your quoted price
- Add delivery timeline
- Include payment terms
- Add any special notes
- Send quote

**Option B: Message Buyer**
- Ask clarifying questions
- Discuss customization
- Negotiate terms
- Share additional details

**Option C: Decline**
- If you can't fulfill request
- Provide brief reason
- Buyer can contact other manufacturers

### Inquiry Status Tracking

- 🕐 **New:** Unread inquiry
- 💬 **Under Discussion:** Active conversation
- 💰 **Quoted:** Price quote sent
- ✅ **Accepted:** Buyer accepted your quote
- ❌ **Declined:** Buyer rejected your offer
- 🎉 **Converted:** Became a confirmed order

---

## Processing Orders

### Orders Page (`/manufacturer/orders`)

**View All Orders:**

Orders flow through these stages:
1. 📋 **Pending Review** - Buyer placed order, awaiting your approval
2. ✅ **Confirmed** - You approved the order
3. 📦 **Preparing Shipment** - Items being packed
4. 🚚 **Shipped** - Order on its way
5. 📍 **In Transit** - With shipping company
6. ✔️ **Delivered** - Buyer received order
7. ❌ **Cancelled** - Order cancelled

### Accepting/Rejecting Orders

**When new order arrives:**

1. Click order in "Pending Review" section
2. Review order details:
   - Product & quantity
   - Buyer code & contact info
   - Delivery address
   - Special instructions
   - PO details (if provided)

3. **Accept Order:**
   - Click **"✅ Confirm Order"**
   - Set expected delivery date
   - Order moves to "Confirmed" status
   - Buyer receives confirmation

4. **Reject Order:**
   - Click **"❌ Reject Order"** if needed
   - Provide reason for rejection
   - Buyer notified immediately

### Updating Order Status

**As you process the order:**

1. **Preparing Shipment**
   - Click order
   - Change status to "📦 Preparing Shipment"
   - Update stock levels automatically

2. **Mark as Shipped**
   - Click order
   - Add tracking number
   - Upload PO/Invoice documents
   - Status changes to "🚚 Shipped"
   - Buyer receives tracking info

3. **Delivery Confirmation**
   - Once buyer confirms delivery
   - Status auto-changes to "✔️ Delivered"
   - Order completion recorded

### Order Management Tips

- ✅ Confirm orders within 24 hours
- ✅ Add tracking numbers promptly
- ✅ Keep buyers updated on delays
- ✅ Resolve issues quickly
- ✅ Request buyer feedback after delivery

---

## Handling Shipments

### Shipment Workflow

**Step 1: Prepare Order**
- Verify product quality
- Check quantities
- Pack carefully
- Inspect packaging

**Step 2: Update Status**
- Go to order details
- Change status to "📦 Preparing Shipment"
- System updates inventory

**Step 3: Get Tracking Number**
- Arrange shipment with carrier
- Obtain tracking number (DHL, FedEx, Local, etc.)
- Have tracking URL ready (optional)

**Step 4: Update Tracking**
1. Go to order in dashboard
2. Click **"📤 Upload PO"** or **"Update PO"**
3. Enter tracking number
4. Add any delivery notes
5. Mark as **"Shipped"**
6. Buyer receives tracking details

**Step 5: Monitor Shipment**
- Keep tracking reference
- Monitor delivery status
- Be ready to resolve shipping issues
- Confirm delivery with buyer

---

## Analytics & Insights

### Analytics Page (`/manufacturer/analytics`)

**Key Performance Metrics:**

1. **Sales Overview**
   - Monthly sales revenue
   - Total orders received
   - Average order value
   - Sales trend chart

2. **Product Performance**
   - Best-selling products
   - Most viewed products
   - Products with most inquiries
   - Out-of-stock products

3. **Buyer Insights**
   - Top buyers by order value
   - Repeat buyers
   - Buyer locations
   - Average buyer spend

4. **Inquiry Analysis**
   - Total inquiries received
   - Inquiry response rate
   - Quote acceptance rate
   - Conversion rate (inquiry to order)

5. **Operational Metrics**
   - Average response time
   - Order fulfillment time
   - Delivery reliability
   - Buyer satisfaction score

### Using Analytics

**Optimize Your Business:**
- Focus on top-selling products
- Improve low-performing products
- Target repeat buyers
- Speed up inquiry responses
- Track monthly growth

---

## Profile & Company Setup

### Profile Page (`/manufacturer/profile`)

**🔐 Manufacturer Code Display**
- Your unique privacy code (e.g., MFR-XXXX)
- Buyers see only this code
- Your real company details protected

**📋 Basic Information**

1. Company name
2. Company registration number
3. Business type
4. Year established
5. Annual turnover
6. Employee count

**🏭 Factory & Operations**

1. Registered address
2. Factory address (if different)
3. Contact person name
4. Contact person designation
5. Mobile number with country code
6. Office phone number with country code

**⚙️ Technical Details**

1. GST number (India)
2. IEC code (India)
3. PAN number (India)
4. Certifications (ISO, etc.)
5. Certification documents

**📝 Business Details**

1. Business nature/description
2. Product categories manufactured
3. Production capacity (units/month)
4. Major customers (list)
5. Certifications held

**🎨 Branding**

1. Company logo upload
2. Factory photos (up to 5)
3. Factory video URL (optional)
4. Website URL

### Updating Profile

1. Navigate to **Profile**
2. Edit desired sections
3. Click **"Save Profile"**
4. Updates live immediately

### Profile Best Practices

✅ Complete all sections
✅ Use high-quality logo & photos
✅ Keep information accurate
✅ Update regularly
✅ Add certifications for credibility

---

## Advanced Features

### Quick Catalogue (`/manufacturer/quick-catalogue`)

**Mass Product Upload:**
- Upload multiple products at once
- Use Excel/CSV template
- Bulk edit products
- Import product data

### AI-Powered Tools

**AI Catalogue**
- Auto-generate product descriptions
- Optimize product titles
- Suggest better pricing
- Enhance product visibility

**Gemini AI Enhancement**
- Auto-enhance product descriptions
- Improve copy quality
- Add SEO keywords
- Generate variations

### Connections & Networking

**View Buyer Connections**
- See all buyers you've contacted
- View purchase history with each
- Track communication
- Build relationships

### QR Labels & Smart Labels

**QR Codes for Products:**
- Generate product QR codes
- Print & attach to products
- Track product popularity
- Link to product pages

---

## Order Management Checklist

### For Each Order, Ensure:

- [ ] Review order within 24 hours
- [ ] Confirm or reject with reason
- [ ] Update inventory stocks
- [ ] Communicate timeline to buyer
- [ ] Prepare order carefully
- [ ] Add tracking number before shipping
- [ ] Update order status to "Shipped"
- [ ] Provide tracking to buyer
- [ ] Confirm delivery completion
- [ ] Request buyer feedback
- [ ] Archive order

---

## Best Practices for Success

### Product Listing

1. **High-Quality Images**
   - Clear, well-lit photos
   - Multiple angles
   - Show product in use
   - Include size reference

2. **Detailed Descriptions**
   - List all specifications
   - Mention materials & colors
   - Add use cases
   - Include dimensions & weight

3. **Competitive Pricing**
   - Research market rates
   - Offer volume discounts
   - Update seasonally
   - Monitor competitor prices

### Customer Service

1. **Fast Responses**
   - Reply to inquiries in <24 hours
   - Answer all questions
   - Be professional & helpful
   - Provide detailed quotes

2. **Clear Communication**
   - Confirm receipt of orders
   - Update on progress
   - Provide tracking
   - Follow up post-delivery

3. **Quality Assurance**
   - Inspect before shipping
   - Proper packaging
   - On-time delivery
   - Handle issues promptly

### Growth Strategies

1. **Build Reputation**
   - Consistent quality
   - Reliable delivery
   - Good customer service
   - Collect positive feedback

2. **Expand Product Line**
   - Add complementary products
   - Listen to buyer requests
   - Follow market trends
   - Innovate regularly

3. **Build Buyer Relationships**
   - Remember repeat buyers
   - Offer loyalty discounts
   - Proactive communication
   - Custom solutions

---

## Troubleshooting

### Common Issues:

**Q: How do I hide a product without deleting it?**
A: Go to Products → Click product → Change status to "Inactive"

**Q: How long does a buyer have to confirm delivery?**
A: Typically 2-3 days after shipment arrival

**Q: Can I change an order after confirming it?**
A: Contact the buyer immediately. Some changes may be possible.

**Q: How do I handle a quality complaint?**
A: Use order messaging to discuss → Arrange replacement or refund → Document all communication

**Q: What if I can't fulfill an order?**
A: Reject order promptly with reason → Offer alternative products → Maintain good relationship

---

## Contact & Support

**Need Help?**
- Email: support@midlync.com
- Dashboard chat support
- Help documentation
- Response time: 24 hours

---

**Last Updated:** July 2026
**Version:** 1.0
