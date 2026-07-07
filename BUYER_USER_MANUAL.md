# Midlync B2B Platform - Buyer User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Browsing Products](#browsing-products)
4. [Managing Wishlist](#managing-wishlist)
5. [Placing Orders](#placing-orders)
6. [Tracking Orders](#tracking-orders)
7. [Making Inquiries](#making-inquiries)
8. [Sample Requests](#sample-requests)
9. [Profile Management](#profile-management)
10. [Cart Management](#cart-management)

---

## Getting Started

### Registration
1. Visit the Midlync platform homepage
2. Click **"Sign Up"** or **"Register"**
3. Select **"Buyer"** as your user role
4. Enter your details:
   - Email address
   - Password (minimum 8 characters)
5. Click **"Create Account"**
6. Verify your email address via the confirmation link
7. **Your unique buyer code is automatically generated!** (e.g., BYR-XXXX)
   - This code keeps your company details private
   - Manufacturers see only this code, not your real company name

### First Login
- Enter your email and password
- You'll be directed to your **Buyer Dashboard**
- Complete your profile to start ordering

---

## Dashboard Overview

### Main Dashboard (`/buyer/dashboard`)

The dashboard is your central hub with:

**📊 Key Sections:**

1. **Quick Stats**
   - Active Orders: Number of orders in progress
   - Total Spent: Lifetime order value
   - Saved Products: Items in your wishlist
   - Pending Inquiries: Awaiting manufacturer response

2. **Recent Orders**
   - Shows your last 5 orders
   - Order number, status, and value
   - Quick action buttons

3. **Manufacturer Connections**
   - List of manufacturers you've contacted
   - Direct messaging available
   - Quick reorder options

4. **Navigation Menu**
   ```
   Dashboard → Browse Products → Orders → Inquiries
   Sample Requests → Wishlist → Profile
   ```

---

## Browsing Products

### Product Marketplace (`/buyer/browse`)

**How to Search:**

1. **Browse by Category**
   - Select product category from dropdown
   - View all products in that category

2. **Search Products**
   - Use the search bar
   - Filter by:
     - Category
     - Price range (minimum - maximum)
     - MOQ (Minimum Order Quantity)

3. **Product Cards Display:**
   - 📷 Product image
   - 📝 Product title & description
   - 🏭 Manufacturer Code (privacy-first design)
   - 💰 Price per unit
   - 📦 MOQ (minimum quantity to order)
   - ⭐ Available status

4. **Product Details**
   - Click on any product to see full details
   - View high-resolution images
   - Check specifications
   - See manufacturer information (as buyer code)
   - Contact the manufacturer

---

## Managing Wishlist

### Adding to Wishlist

1. Browse products in the **Marketplace**
2. Click **"❤️ Add to Wishlist"** on any product
3. Product saved to your wishlist

### Wishlist Page (`/buyer/wishlist`)

**Features:**
- View all saved products
- Track wishlist items for price changes
- Remove items when no longer needed
- Quick order button for each item

**Action Buttons:**
- ❤️ **Remove from Wishlist** - Delete the item
- 🛒 **Add to Cart** - Move to shopping cart
- 👀 **View Details** - Full product information

---

## Placing Orders

### Step 1: Add to Cart

1. Go to **Marketplace** or **Wishlist**
2. Click **"🛒 Add to Cart"**
3. Specify **quantity** (must meet MOQ)
4. Confirm addition

### Step 2: Review Cart (`/buyer/cart`)

Your shopping cart shows:
- Product image & name
- Unit price & total
- Quantity
- Manufacturer code
- MOQ requirements

**Cart Actions:**
- Update quantity
- Remove items
- Apply any available discounts
- Proceed to checkout

### Step 3: Create Order

1. Click **"Proceed to Checkout"**
2. Review order details:
   - Items & quantities
   - Total amount
   - Delivery requirements
3. Add **purchase order (PO)** if required:
   - Upload PO file (PDF/Image)
   - Or enter PO details manually
4. Confirm order

### Step 4: Order Confirmation

- Receive order confirmation email
- Order number assigned (e.g., #ORD-XXXXX)
- Status: **"Pending Manufacturer Review"**
- Manufacturer will review and confirm within 24-48 hours

---

## Tracking Orders

### Orders Page (`/buyer/orders`)

**View All Your Orders:**

1. Navigate to **Orders** section
2. See all orders with current status:
   - 📋 Pending Review
   - ✅ Confirmed
   - 📦 Preparing Shipment
   - 🚚 Shipped
   - 📍 In Transit
   - ✔️ Delivered
   - ❌ Cancelled

**Order Details Include:**
- Order number & date
- Manufacturer name (shown as buyer code)
- Product information
- Quantity & price
- Current status
- Estimated delivery date
- Tracking number (if shipped)

**Tracking Features:**
- Click on any order for full details
- See status history
- Track shipment in real-time
- Download invoice
- Contact manufacturer about delays

---

## Making Inquiries

### Inquiry System

Inquiries allow you to:
- Request product information
- Ask about availability
- Negotiate pricing
- Discuss bulk orders
- Get custom quotes

### Creating an Inquiry

1. Go to **Browse Products**
2. Select a product
3. Click **"📨 Send Inquiry"**
4. Fill in inquiry form:
   - **Quantity needed:** How many units you want
   - **Delivery timeline:** When you need it
   - **Special requirements:** Custom specifications
   - **Budget range:** Price expectations
5. Click **"Send"**

### Managing Inquiries (`/buyer/inquiries`)

**View All Inquiries:**
- Sent inquiries status
- Manufacturer responses
- Messages & negotiations
- Quoted prices

**Status Types:**
- 🕐 Pending - Awaiting response
- 💬 Under Discussion - Active negotiation
- ✅ Quoted - Price quote received
- ❌ Declined - Manufacturer can't fulfill
- 🎉 Converted to Order - Became an order

**Actions:**
- Reply to inquiries
- Accept quotes
- Decline offers
- Discuss delivery & pricing

---

## Sample Requests

### What are Sample Requests?

Sample requests let you order small quantities to:
- Test product quality
- Evaluate manufacturer capabilities
- Check specifications
- Build supplier relationships

### Creating a Sample Request (`/buyer/sample-request`)

1. Navigate to **Sample Request** section
2. Select product
3. Enter sample quantity needed (usually 1-10 units)
4. Specify delivery timeline
5. Add special requirements or testing parameters
6. Submit request

### Sample Request Workflow

1. **Submit** → Manufacturer receives request
2. **Review** → Manufacturer checks feasibility
3. **Quote** → Manufacturer provides sample cost
4. **Accept/Decline** → You approve or reject
5. **Ship** → Sample prepared & shipped
6. **Delivery** → Receive & test sample
7. **Feedback** → Provide evaluation to manufacturer

---

## Profile Management

### Accessing Your Profile (`/buyer/profile`)

1. Click **Profile** in navigation menu
2. View and edit your information

### Profile Sections

**🔐 Buyer Code Display**
- Your unique privacy code (e.g., BYR-XXXX)
- Manufacturers see only this code
- Your real company details remain private

**📋 Basic Information**
- Company name
- Contact person name
- Email address

**🌍 Contact Details**
- Country (dropdown with all countries)
- Country code auto-populated
- Contact phone number with country code
- Business address

**Update Profile**
1. Edit any field
2. Click **"Save Profile"**
3. Changes saved immediately

### Profile Best Practices

✅ Keep information updated
✅ Use valid contact numbers
✅ Maintain accurate company details
✅ Verify email is correct for order notifications

---

## Cart Management

### Shopping Cart (`/buyer/cart`)

**Cart Features:**
- View all items added to cart
- Quantity management
- Price calculations
- Remove items

**Cart Operations:**

1. **Update Quantity**
   - Click quantity field
   - Enter new amount (must meet MOQ)
   - Price updates automatically

2. **Remove Item**
   - Click **"Remove"** button
   - Item deleted from cart
   - Can re-add from marketplace

3. **Clear Cart**
   - Remove all items at once
   - Start fresh shopping session

4. **Proceed to Checkout**
   - Review totals
   - Verify all items
   - Click **"Place Order"**

---

## Tips & Best Practices

### For Better Experience:

1. **Complete Your Profile**
   - Helps manufacturers respond faster
   - Enables faster checkout process

2. **Use Wishlists**
   - Save products for later
   - Compare options
   - Track items over time

3. **Make Inquiries First**
   - For large orders, inquire about bulk discounts
   - Negotiate better prices
   - Discuss customizations

4. **Keep Orders Organized**
   - Track all orders in one place
   - Use order numbers in communications
   - Save invoices for records

5. **Communicate Clearly**
   - Be specific about requirements
   - Mention delivery deadlines early
   - Ask about payment terms

---

## Troubleshooting

### Common Issues:

**Q: Can I see the manufacturer's company name?**
A: No. For privacy, you see only the manufacturer code (MFR-XXXX). This protects both parties.

**Q: How long does order approval take?**
A: Manufacturers usually respond within 24-48 hours.

**Q: Can I modify an order after placing it?**
A: Contact the manufacturer immediately. Some changes can be made before confirmation.

**Q: How do I track my shipment?**
A: Once shipped, a tracking number appears in your order details.

**Q: What if I don't receive the product?**
A: Contact the manufacturer using the order tracking page or make an inquiry about the issue.

---

## Contact & Support

**Need Help?**
- Email: support@midlync.com
- Live chat available in dashboard
- Response time: 24 hours

---

**Last Updated:** July 2026
**Version:** 1.0
