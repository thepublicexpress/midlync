# Midlync B2B Platform - Admin User Manual

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [User Management](#user-management)
4. [Order Management](#order-management)
5. [Buyer-Manufacturer Connections](#buyer-manufacturer-connections)
6. [Inquiries Monitoring](#inquiries-monitoring)
7. [Analytics & Reports](#analytics--reports)
8. [Platform Settings](#platform-settings)
9. [Notifications System](#notifications-system)
10. [Support & Escalation](#support--escalation)

---

## Getting Started

### Admin Access

1. Contact system administrator for admin credentials
2. Login with provided email and password
3. Access admin dashboard at `/admin/dashboard`
4. You have full platform visibility and control

### Admin Responsibilities

- User account management & approvals
- Order oversight & dispute resolution
- Quality assurance & compliance
- Platform analytics & reporting
- User support & issue escalation
- System maintenance & updates

---

## Dashboard Overview

### Admin Dashboard (`/admin/dashboard`)

**Main Control Center:**

**📊 Key Metrics Widget**
- Total platform users
- Total orders this month
- Total revenue
- Active connections
- Pending approvals

**👥 User Management Section**
- Quick user filter (All/Buyers/Manufacturers)
- List of all users with status
- User approval/rejection
- User role assignment
- Account suspension/activation

**📋 Recent Orders**
- Last 20 orders across platform
- Order status overview
- Revenue tracking
- Quick order details

**💬 Support Requests**
- Open support tickets
- User complaints
- Urgent issues
- Response status

**🔔 System Alerts**
- Platform errors
- Security issues
- High-value orders
- Failed transactions

---

## User Management

### Approving Users

**New User Approval Workflow:**

1. New users register on platform
2. Accounts created in "Pending Approval" status
3. Admins review user details
4. Approve or reject accounts

**User Approval Process:**

1. Go to **Admin Dashboard**
2. Find "Pending Approvals" section
3. Click on any pending user
4. Review user details:
   - Email & phone verification
   - Company information
   - Business documents (if required)
   - Registration completeness
   - Any red flags or suspicious activity

5. **Approve User:**
   - Click **"✅ Approve User"**
   - User receives approval email
   - Account activated immediately
   - Can start buying/selling

6. **Reject User:**
   - Click **"❌ Reject User"**
   - Provide rejection reason
   - User receives rejection email
   - Can appeal or re-register

### User Details Modal

**View Complete User Information:**
- Name & email
- Phone & address
- Company details
- Registration date
- Account status
- Total orders placed/received
- Total revenue
- User role (Buyer/Manufacturer)

**Admin Actions:**
- 📧 Send message to user
- 🔒 Suspend account (for violations)
- 🔓 Activate suspended account
- 📋 View order history
- 💬 View support tickets
- 📝 Add internal notes

### User Filtering

**Filter Users by:**
- Status: Active/Pending/Suspended/Inactive
- Role: Buyers/Manufacturers/Agencies
- Registration date range
- Location/Country
- Activity level

**Search Users:**
- By email address
- By company name
- By user code (BYR-XXXX, MFR-XXXX)
- By phone number

### Managing Suspended Accounts

**When to Suspend:**
- Fraud detection
- Policy violation
- Payment disputes
- Non-compliance
- Inactive for 6+ months

**Suspension Process:**
1. Go to user profile
2. Click **"⚠️ Suspend Account"**
3. Provide suspension reason
4. User receives notification
5. Account locked from platform activities
6. Orders still visible (for dispute resolution)

**Reactivation:**
1. Review suspension reason
2. Verify compliance
3. Click **"🔓 Reactivate Account"**
4. User notified

---

## Order Management

### Orders Oversight

**Access All Orders:**
1. Navigate to orders section
2. View all platform orders
3. Filter by:
   - Status (Pending/Confirmed/Shipped/Delivered)
   - Date range
   - Buyer/Manufacturer
   - Order value
   - Location

### Order Monitoring

**Typical Order Journey:**

1. **📋 Pending Review** - Buyer placed → Manufacturer to approve
2. **✅ Confirmed** - Manufacturer accepted
3. **📦 Preparing** - Items being packed
4. **🚚 Shipped** - With carrier
5. **📍 In Transit** - On delivery route
6. **✔️ Delivered** - Buyer received
7. **❌ Cancelled** - Order cancelled

**Admin Oversight Points:**
- Monitor stuck orders (not progressing)
- Check for delayed deliveries
- Verify proper documentation
- Track payment completion
- Identify issues early

### Resolving Order Disputes

**Common Disputes:**

1. **Quality Issues**
   - Buyer reports defective products
   - Manufacturer denies defect
   - Admin reviews evidence & decides
   - Refund/replacement arranged

2. **Non-Delivery**
   - Order not arrived on time
   - Tracking shows lost shipment
   - Admin contacts carrier
   - Initiates compensation

3. **Payment Issues**
   - Payment failed but order confirmed
   - Duplicate charges
   - Refund not processed
   - Admin verifies & corrects

**Dispute Resolution Process:**

1. Click on disputed order
2. Review all communications
3. Check evidence (photos, tracking, etc.)
4. Contact both parties if needed
5. Make fair decision
6. Document resolution
7. Execute (refund/replacement/cancellation)

### Order Tracking & Monitoring

**Track Shipments:**
- Click order for tracking details
- View carrier information
- Monitor delivery progress
- Check estimated arrival

**Monitor Payment Status:**
- Verify payment received
- Check for failed transactions
- Ensure invoice generated
- Confirm receipt by buyer

---

## Buyer-Manufacturer Connections

### Connections Hub (`/admin/connect`)

**Overview:**
- View all buyer-manufacturer connections
- Monitor communication quality
- Track connection history
- Identify healthy relationships
- Detect problematic connections

**Connection Details Include:**
- Buyer code (privacy)
- Manufacturer code (privacy)
- Connection date established
- Number of orders
- Total transaction value
- Last communication date
- Current status

### Managing Connections

**Healthy Connections:**
- Regular orders
- Good communication
- No disputes
- Long-term engagement
- Growth trend

**Problematic Connections:**
- One-sided communication
- Frequent complaints
- Dispute history
- Inactive for long period
- Repeated cancellations

**Admin Interventions:**
1. Mediate communication issues
2. Resolve disputes
3. Prevent fraudulent connections
4. Encourage positive relationships
5. Monitor for red flags

---

## Inquiries Monitoring

### System Inquiries

Inquiries are buyer questions to manufacturers about:
- Product availability
- Bulk pricing
- Custom specifications
- Delivery terms
- Payment options

**Monitor Inquiries for:**
- Response timeliness
- Quote reasonableness
- Communication quality
- Conversion to orders

### Inquiry Metrics

Track:
- Total inquiries/month
- Response time average
- Quote acceptance rate
- Conversion rate (inquiry → order)
- Manufacturer responsiveness

**Escalation:**
- If manufacturer doesn't respond in 48 hours
- If buyer complains about response
- If inquiry converts to dispute

---

## Analytics & Reports

### Platform Analytics Dashboard

**📊 Key Metrics:**

**User Metrics:**
- Total registered users
- Users by role (Buyers/Manufacturers)
- New users/month
- Active users/month
- Suspended/inactive users
- Geographic distribution

**Order Metrics:**
- Total orders/month
- Average order value
- Order growth trend
- Order fulfillment rate
- On-time delivery %
- Cancellation rate

**Revenue Metrics:**
- Monthly revenue
- Total platform revenue
- Average order value
- Revenue by category
- Revenue by geography
- Payment success rate

**Quality Metrics:**
- Dispute rate
- Return rate
- Customer satisfaction score
- Complaint rate
- Resolution time

**Product Metrics:**
- Most popular products
- Best-selling categories
- Inventory turnover
- Product reviews/ratings
- New products added/month

### Generating Reports

**Available Reports:**
1. **Monthly Performance Report**
   - Full month overview
   - All metrics
   - Trends & growth
   - Issues identified

2. **User Report**
   - User growth
   - Active users
   - New registrations
   - Churn rate

3. **Revenue Report**
   - Income summary
   - Revenue by category
   - Top-performing products
   - Forecasting

4. **Compliance Report**
   - Account violations
   - Disputes resolved
   - Suspensions
   - Policy enforcement

**Exporting Reports:**
1. Generate report
2. Click **"Download as PDF"** or **"Export as CSV"**
3. Save to local system
4. Share with stakeholders

---

## Platform Settings

### System Configuration

**Admin Settings Access:**
1. Login as admin
2. Navigate to **Admin Settings** (gear icon)

**Available Settings:**

1. **Platform Configuration**
   - Platform name & branding
   - Logo & favicon
   - Email settings
   - Contact information

2. **Commission Settings**
   - Commission percentage
   - Payment processing fees
   - Tax rates
   - Payout schedule

3. **User Policies**
   - Registration requirements
   - Approval process
   - Suspension conditions
   - Data retention

4. **Product Settings**
   - Categories
   - MOQ minimums
   - Price ranges
   - Image requirements

5. **Payment Settings**
   - Payment methods enabled
   - Currency settings
   - Razorpay integration
   - Payment verification

6. **Email Templates**
   - Approval emails
   - Order confirmation
   - Shipment notifications
   - Support responses
   - System alerts

### Configuring Email Templates

1. Go to **Settings** → **Email Templates**
2. Select template to edit
3. Customize content
4. Use variables: {userName}, {orderId}, {amount}, etc.
5. Preview before saving
6. Save & activate

---

## Notifications System

### System Notifications

**Auto-generated Notifications:**

**For Users:**
- Account approved/rejected
- Order confirmation
- Order status updates
- Shipment tracking
- Delivery confirmation
- Inquiry responses
- Payment confirmation
- Support responses

**To Admin:**
- New user registration
- Large orders (>threshold)
- Failed payments
- Support escalations
- Suspicious activity
- System errors
- Low inventory alerts

### Notification Management

1. Access **Notifications** dashboard
2. View all recent notifications
3. Mark as read/unread
4. Filter by type
5. Archive old notifications

**Custom Notifications:**
- Send bulk messages to users
- Announce platform updates
- Broadcast promotions
- Send urgent notices

---

## Support & Escalation

### Support Ticket System

**User Support Requests:**

Users can submit support tickets for:
- Technical issues
- Account problems
- Order disputes
- Payment issues
- General inquiries

**Ticket Management:**

1. Go to **Support** section
2. View all open tickets
3. Filter by:
   - Status (Open/In Progress/Resolved)
   - Priority (Low/Medium/High/Urgent)
   - Category (Technical/Billing/Dispute/Other)
   - Age (oldest first)

**Resolving Tickets:**

1. Click ticket to open
2. Review user issue
3. Ask clarifying questions if needed
4. Provide solution
5. Mark as **"Resolved"**
6. User confirms resolution
7. Ticket closed

**Response Time Guidelines:**
- Urgent: 2 hours
- High: 8 hours
- Medium: 24 hours
- Low: 48 hours

### Escalation Protocol

**When to Escalate:**
- Complex disputes
- Legal issues
- Fraud suspected
- System compromise
- High-value orders at risk

**Escalation Process:**
1. Mark ticket as **"Escalated"**
2. Assign to senior admin
3. Add detailed notes
4. Set priority level
5. Senior admin reviews & decides
6. Communication sent to all parties

---

## Admin Checklist

### Daily Tasks
- [ ] Check pending user approvals
- [ ] Review new support tickets
- [ ] Monitor high-value orders
- [ ] Check system alerts
- [ ] Respond to critical issues

### Weekly Tasks
- [ ] Generate analytics report
- [ ] Review disputed orders
- [ ] Check inactive users
- [ ] Monitor connection quality
- [ ] Update any policies

### Monthly Tasks
- [ ] Full platform audit
- [ ] User activity review
- [ ] Payment reconciliation
- [ ] Performance analysis
- [ ] Growth assessment
- [ ] Policy updates if needed

---

## Security & Compliance

### Account Security

**Protecting Admin Accounts:**
- Use strong password (16+ characters)
- Enable 2-factor authentication
- Regular password changes (90 days)
- Logout after use
- Don't share credentials
- Report suspicious activity

### Data Protection

**User Data Handling:**
- Protect personal information
- Follow data privacy laws
- Secure database access
- Regular backups
- Encryption of sensitive data
- Audit trail logging

### Fraud Detection

**Watch for Red Flags:**
- Unusual order patterns
- Multiple accounts same person
- Rapid account creation/suspension
- Large orders from new users
- Frequent cancellations
- Payment disputes patterns
- Geographic anomalies

**Prevention Measures:**
- Verify user identity
- Investigate suspicious accounts
- Flag risky transactions
- Review withdrawal patterns
- Monitor for duplicates

---

## Troubleshooting

### Common Admin Issues:

**Q: User approval is not sending email?**
A: Check email configuration in Settings → Email Settings. Verify SMTP details.

**Q: Dashboard metrics not updating?**
A: Try refreshing page. If persists, check database connection in server logs.

**Q: Can't suspend a user account?**
A: User may already be suspended. Check current status. Or user may have active disputes.

**Q: Order stuck in "Pending Review"?**
A: Manufacturer may not have logged in. Send reminder email. Or escalate to support.

**Q: Payment not processing?**
A: Verify Razorpay integration. Check payment gateway settings. Review transaction logs.

---

## Contact & Support

**Admin Support:**
- Email: admin-support@midlync.com
- Phone: +91-XXX-XXX-XXXX
- Internal slack: #admin-support
- Priority: Immediate response

---

## Quick Reference

### Common Links
- Dashboard: `/admin/dashboard`
- Users: `/admin/dashboard?tab=users`
- Orders: `/admin/dashboard?tab=orders`
- Connections: `/admin/connect`
- Settings: `/admin/settings`
- Analytics: `/admin/analytics`
- Support: `/admin/support`

### User Codes
- Buyer: `BYR-XXXX` (Privacy code)
- Manufacturer: `MFR-XXXX` (Privacy code)
- Agency: `AGN-XXXX` (Privacy code)

### Status Indicators
- 🟢 Active/Online
- 🟡 Pending/Away
- 🔴 Offline/Suspended
- ⚫ Inactive

---

**Last Updated:** July 2026
**Version:** 1.0
**Document Confidential - Admin Only**
