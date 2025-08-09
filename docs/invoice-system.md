# 📄 Invoice System Technical Specification

## 🎯 Goal of the System

The invoice system provides automated PDF invoice generation and email delivery for ResumeTune's credit-based SaaS platform. After successful Stripe payments (one-time credits or subscription renewals), users receive professional receipts via email with attached PDF invoices.

**Key Objectives:**
- Provide immediate payment confirmation to users
- Generate professional, branded invoices for bookkeeping
- Maintain payment records for customer support
- Enhance user trust through transparent billing

---

## 🧱 Tech Stack Overview

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Runtime** | Vercel Serverless Functions | Scalable webhook processing |
| **Language** | TypeScript | Type-safe development |
| **Payments** | Stripe API | Payment processing & webhooks |
| **Database** | Redis (Upstash) | User data & invoice metadata |
| **Email** | Resend API | Reliable email delivery |
| **PDF Generation** | html-pdf-node | Lightweight PDF creation |
| **Templates** | HTML/CSS | Invoice layout & styling |

---

## 🧩 Trigger Points

### Stripe Webhook Events

The invoice system triggers on these Stripe webhook events:

#### 1. `checkout.session.completed`
**When:** Initial payment (one-time credits or new subscription)
**Available Data:**
```typescript
{
  id: "cs_xxx",
  customer_email: "user@example.com",
  amount_total: 900, // $9.00 in cents
  metadata: {
    userId: "user-123",
    plan: "credits_50"
  },
  line_items: [
    {
      price: { id: "price_xxx" },
      quantity: 1,
      amount_total: 900
    }
  ]
}
```

#### 2. `invoice.payment_succeeded`
**When:** Subscription renewal payments
**Available Data:**
```typescript
{
  id: "in_xxx",
  customer_email: "user@example.com",
  amount_paid: 900,
  subscription: "sub_xxx",
  metadata: {
    userId: "user-123"
  },
  lines: {
    data: [
      {
        price: { id: "price_xxx" },
        amount: 900
      }
    ]
  }
}
```

---

## 🏗️ System Architecture

### Flow Diagram
```
Stripe Payment → Webhook → Process Credits → Generate Invoice → Send Email
```

### Detailed Process

#### Step 1: Webhook Reception
```typescript
// api/stripe/webhook.ts
export default async function handler(req: Request) {
  // Verify Stripe signature
  const event = stripe.webhooks.constructEvent(body, signature, secret);
  
  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handleInvoicePaymentSucceeded(event.data.object);
      break;
  }
}
```

#### Step 2: Extract Payment Data
```typescript
interface InvoiceData {
  userId: string;
  customerEmail: string;
  amount: number;
  currency: string;
  productName: string;
  creditsDelivered: number;
  paymentDate: Date;
  invoiceType: 'purchase' | 'renewal';
  stripeInvoiceId?: string;
}
```

#### Step 3: Generate HTML Invoice
```typescript
function generateInvoiceHTML(data: InvoiceData): string {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - ResumeTune</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 40px; color: #333; }
          .header { border-bottom: 3px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { font-size: 24px; font-weight: bold; color: #3B82F6; }
          .invoice-details { background: #F8FAFC; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .total { background: #3B82F6; color: white; padding: 15px; border-radius: 8px; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">ResumeTune</div>
          <h1>Invoice Receipt</h1>
          <p>Date: ${data.paymentDate.toLocaleDateString()}</p>
        </div>
        
        <div class="invoice-details">
          <h2>${data.productName}</h2>
          <p><strong>Customer:</strong> ${data.customerEmail}</p>
          <p><strong>Credits Delivered:</strong> ${data.creditsDelivered}</p>
          <p><strong>Payment Method:</strong> Card (Stripe)</p>
          ${data.stripeInvoiceId ? `<p><strong>Stripe Invoice:</strong> ${data.stripeInvoiceId}</p>` : ''}
        </div>
        
        <div class="total">
          <h2>Total Paid: $${(data.amount / 100).toFixed(2)} ${data.currency.toUpperCase()}</h2>
        </div>
        
        <p style="margin-top: 30px; font-size: 12px; color: #666;">
          Thank you for using ResumeTune! Your credits have been added to your account.
        </p>
      </body>
    </html>
  `;
}
```

#### Step 4: Convert HTML to PDF
```typescript
import htmlPdf from 'html-pdf-node';

async function generateInvoicePDF(htmlContent: string): Promise<Buffer> {
  const options = {
    format: 'A4',
    border: {
      top: '0.5in',
      right: '0.5in',
      bottom: '0.5in',
      left: '0.5in'
    }
  };
  
  const file = { content: htmlContent };
  const pdfBuffer = await htmlPdf.generatePdf(file, options);
  return pdfBuffer;
}
```

#### Step 5: Send Email with PDF Attachment
```typescript
import { Resend } from 'resend';

async function sendInvoiceEmail(data: InvoiceData, pdfBuffer: Buffer) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  const result = await resend.emails.send({
    from: 'billing@resumetune.com',
    to: data.customerEmail,
    subject: `Your Receipt from ResumeTune - ${data.productName}`,
    html: `
      <h2>Thank you for your purchase!</h2>
      <p>Your ${data.creditsDelivered} credits have been added to your account.</p>
      <p>Please find your invoice attached as a PDF.</p>
      <p>Questions? Reply to this email for support.</p>
    `,
    attachments: [
      {
        filename: `invoice-${Date.now()}.pdf`,
        content: pdfBuffer,
      }
    ]
  });
  
  return result;
}
```

#### Step 6: Store Invoice Metadata (Optional)
```typescript
// Store minimal invoice data in Redis for potential future lookup
await redis.hset(`invoice:${userId}:${Date.now()}`, {
  amount: data.amount,
  credits: data.creditsDelivered,
  date: data.paymentDate.toISOString(),
  type: data.invoiceType
});
```

---

## 🔐 Environment Variables Required

Add these to your `.env.local` and Vercel environment:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_xxx  # or sk_live_xxx for production
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email Service
RESEND_API_KEY=re_xxx

# Redis (existing)
UPSTASH_REDIS_REST_URL=https://xxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxx

# Optional: Company Details
COMPANY_NAME="ResumeTune"
COMPANY_EMAIL="billing@resumetune.com"
SUPPORT_EMAIL="support@resumetune.com"
```

---

## 🧪 Testing Strategy

### Local Development Testing

#### 1. Test PDF Generation Locally
```typescript
// scripts/test-invoice.ts
import { generateInvoicePDF, generateInvoiceHTML } from '../api/utils/invoice';

const testData = {
  userId: 'test-user',
  customerEmail: 'test@example.com',
  amount: 900,
  currency: 'usd',
  productName: '50 Credits',
  creditsDelivered: 50,
  paymentDate: new Date(),
  invoiceType: 'purchase' as const
};

const html = generateInvoiceHTML(testData);
const pdf = await generateInvoicePDF(html);
// Save to file for manual review
```

#### 2. Test Email Delivery
```bash
# Use Resend test mode
npm run test-email
```

#### 3. Simulate Stripe Webhooks
```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/stripe/webhook

# Trigger test events
stripe trigger checkout.session.completed
stripe trigger invoice.payment_succeeded
```

### Production Testing

#### 1. Webhook Endpoint Testing
```bash
# Test webhook endpoint is accessible
curl -X POST https://your-domain.vercel.app/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": true}'
```

#### 2. End-to-End Payment Flow
1. Create test products in Stripe Dashboard
2. Make test purchases using Stripe test cards
3. Verify webhooks trigger invoice generation
4. Check email delivery in Resend dashboard

### Monitoring & Debugging

```typescript
// Add logging to webhook handler
console.log('Invoice generation started:', {
  userId: data.userId,
  amount: data.amount,
  type: data.invoiceType
});

// Monitor email delivery
console.log('Email sent successfully:', {
  messageId: result.id,
  recipient: data.customerEmail
});
```

---

## 🪄 Future Improvements

### Phase 1: Enhanced Features
- **Invoice Numbers**: Sequential numbering system
- **Tax Calculation**: Support for VAT/sales tax
- **Multi-currency**: Support for EUR, GBP
- **Custom Branding**: Logo upload, color customization

### Phase 2: User Dashboard Integration
- **Invoice History**: `/account/invoices` page
- **Download Previous Invoices**: Re-generate PDFs on demand
- **Email Preferences**: Allow users to disable invoice emails

### Phase 3: Advanced Storage
- **S3 Storage**: Persistent PDF storage
- **Invoice Search**: Filter by date, amount, type
- **Bulk Export**: Download all invoices as ZIP

### Phase 4: Business Features
- **Accounting Integration**: QuickBooks, Xero webhooks
- **Annual Summaries**: Yearly spending reports
- **Enterprise Invoicing**: Custom billing cycles

### Code Structure for Future Expansion
```
src/utils/invoice/
  types.ts                    # Shared invoice interfaces
  generate.ts                 # HTML generation utilities
  email.ts                    # Email delivery utilities
  index.ts                    # Module export hub
  components/
    EmailInvoice.tsx          # ✅ React invoice component
api/
  invoices/
    generate.ts               # Server-side PDF generation
    email.ts                  # Server-side email delivery
    history.ts                # Invoice lookup endpoints
  stripe/
    webhook.ts                # Existing webhook handler
```

---

## 📝 Implementation Checklist

- [x] Install dependencies: `@react-pdf/renderer`, `resend` ✅ Done on 2025-08-09 (using @react-pdf/renderer instead of html-pdf-node due to serverless compatibility)
- [x] Create invoice generation utilities ✅ Done on 2025-08-09 (HTML generation complete, PDF generation placeholder ready)
- [x] Update Stripe webhook handler ✅ Done on 2025-08-09 (integrated invoice generation for checkout.session.completed and invoice.payment_succeeded events)
- [x] Set up Resend account and API key ✅ Done on 2025-08-09 (sendInvoiceEmail function implemented with Resend integration)
- [x] Create HTML invoice template
- [x] Create modular EmailInvoice React component
- [x] Create UI components for invoice system ✅ Done on 2025-08-09 (InvoiceHistoryTable, InvoicePreviewModal, InvoiceToast components)
- [x] Unify type system across components ✅ Done on 2025-08-09 (UIInvoice shared type implemented)
- [ ] Test PDF generation locally
- [ ] Test email delivery
- [ ] Deploy to Vercel
- [ ] Test end-to-end with Stripe test mode
- [ ] Monitor webhook delivery in production

---

## 🆘 Troubleshooting

### Common Issues

**PDF Generation Fails:**
- Check Vercel function memory limits
- Verify HTML template is valid
- Ensure `html-pdf-node` is installed

**Email Delivery Fails:**
- Verify `RESEND_API_KEY` is set
- Check sender domain is verified
- Monitor Resend dashboard for errors

**Webhook Timeouts:**
- Optimize PDF generation speed
- Consider async email sending
- Monitor Vercel function duration

**Missing Invoice Data:**
- Verify Stripe metadata includes `userId`
- Check webhook event data structure
- Add fallback data extraction

---

*This specification serves as the blueprint for implementing a robust, scalable invoice system that enhances user experience and provides essential business documentation.*
