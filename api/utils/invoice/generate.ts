/**
 * Invoice Generation Utilities
 * Handles HTML template generation and PDF conversion for invoices
 */

import { InvoiceData } from './types';

/**
 * Generates HTML content for an invoice
 * Creates a production-ready HTML template with inline CSS
 */
export function generateInvoiceHTML(data: InvoiceData): string {
  // Format amount as USD currency
  const formattedAmount = `$${(data.amount / 100).toFixed(2)}`;
  
  // Format date
  const formattedDate = data.paymentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Generate invoice number based on timestamp for uniqueness
  const invoiceNumber = `INV-${Date.now()}`;
  
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Invoice - ResumeTune</title>
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333333;
            background-color: #ffffff;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          
          .header {
            border-bottom: 3px solid #3B82F6;
            padding-bottom: 20px;
            margin-bottom: 30px;
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
          }
          
          .company-logo {
            font-size: 28px;
            font-weight: bold;
            color: #3B82F6;
            letter-spacing: -0.5px;
          }
          
          .invoice-meta {
            text-align: right;
            color: #6B7280;
          }
          
          .invoice-meta h1 {
            color: #111827;
            font-size: 24px;
            margin-bottom: 5px;
          }
          
          .invoice-details {
            background-color: #F8FAFC;
            border: 1px solid #E5E7EB;
            border-radius: 8px;
            padding: 24px;
            margin: 24px 0;
          }
          
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 12px;
            padding: 8px 0;
            border-bottom: 1px solid #E5E7EB;
          }
          
          .detail-row:last-child {
            border-bottom: none;
            margin-bottom: 0;
          }
          
          .detail-label {
            font-weight: 600;
            color: #374151;
            min-width: 140px;
          }
          
          .detail-value {
            color: #111827;
            text-align: right;
            flex: 1;
          }
          
          .total-section {
            background: linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 30px 0;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          
          .total-amount {
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 5px;
          }
          
          .total-label {
            font-size: 14px;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 1px;
          }
          
          .credits-highlight {
            background-color: #ECFDF5;
            border: 1px solid #10B981;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
            text-align: center;
          }
          
          .credits-highlight .credits-number {
            font-size: 24px;
            font-weight: bold;
            color: #059669;
            display: block;
          }
          
          .credits-highlight .credits-text {
            color: #047857;
            font-size: 14px;
            margin-top: 4px;
          }
          
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #E5E7EB;
            text-align: center;
            color: #6B7280;
            font-size: 14px;
          }
          
          .thank-you {
            background-color: #FEF3C7;
            border: 1px solid #F59E0B;
            border-radius: 6px;
            padding: 16px;
            margin: 20px 0;
            text-align: center;
            color: #92400E;
          }
          
          .stripe-info {
            font-size: 12px;
            color: #9CA3AF;
            margin-top: 10px;
          }
          
          @media print {
            body {
              padding: 20px;
            }
            
            .header {
              page-break-inside: avoid;
            }
            
            .total-section {
              page-break-inside: avoid;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-logo">ResumeTune</div>
          <div class="invoice-meta">
            <h1>Invoice</h1>
            <div>${invoiceNumber}</div>
            <div>${formattedDate}</div>
          </div>
        </div>
        
        <div class="invoice-details">
          <div class="detail-row">
            <span class="detail-label">Customer Email:</span>
            <span class="detail-value">${data.customerEmail}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Product:</span>
            <span class="detail-value">${data.productName}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Payment Type:</span>
            <span class="detail-value">${data.invoiceType === 'purchase' ? 'One-time Purchase' : 'Subscription Renewal'}</span>
          </div>
          
          <div class="detail-row">
            <span class="detail-label">Payment Method:</span>
            <span class="detail-value">Credit Card (Stripe)</span>
          </div>
          
          ${data.stripeInvoiceId ? `
          <div class="detail-row">
            <span class="detail-label">Stripe Invoice ID:</span>
            <span class="detail-value">${data.stripeInvoiceId}</span>
          </div>
          ` : ''}
        </div>
        
        <div class="credits-highlight">
          <span class="credits-number">${data.creditsDelivered}</span>
          <div class="credits-text">AI Credits Added to Your Account</div>
        </div>
        
        <div class="total-section">
          <div class="total-label">Total Amount Paid</div>
          <div class="total-amount">${formattedAmount} ${data.currency.toUpperCase()}</div>
        </div>
        
        <div class="thank-you">
          <strong>Thank you for choosing ResumeTune!</strong><br>
          Your credits have been successfully added to your account and are ready to use.
        </div>
        
        <div class="footer">
          <div>ResumeTune - AI-powered career tools</div>
          <div class="stripe-info">Payment securely processed by Stripe</div>
          <div style="margin-top: 10px;">
            Questions? Contact us at support@resumetune.com
          </div>
        </div>
      </body>
    </html>
  `.trim();
}

/**
 * Converts HTML content to PDF buffer
 * TODO: implement PDF conversion using @react-pdf/renderer
 * For now, this is a placeholder that will be implemented in a separate PDF service
 */
export async function generateInvoicePDF(html: string): Promise<Buffer> {
  // TODO: implement PDF conversion
  // This will be moved to a separate service for better separation of concerns
  console.log('TODO: Convert HTML to PDF', { htmlLength: html.length });
  return Buffer.from('PDF_PLACEHOLDER_' + html.substring(0, 100));
}

/**
 * Generates PDF directly from invoice data
 * TODO: implement using @react-pdf/renderer in a separate service
 */
export async function generateInvoicePDFFromData(data: InvoiceData): Promise<Buffer> {
  // For now, generate HTML and use the HTML->PDF converter
  const html = generateInvoiceHTML(data);
  return generateInvoicePDF(html);
}
