/**
 * EmailInvoice Component
 * 
 * A reusable React component for rendering invoice content for both email and PDF generation.
 * Designed to be portable across projects and maintain consistent invoice styling.
 * 
 * Usage:
 * - Email templates: Renders as JSX component
 * - PDF generation: Can be converted to HTML string via ReactDOMServer
 * - Printable invoices: Direct JSX rendering
 */

import React from 'react';
import { EmailInvoiceProps } from '../types';

interface EmailInvoiceState {
  invoiceNumber: string;
  formattedDate: string;
  formattedAmount: string;
}

export const EmailInvoice: React.FC<EmailInvoiceProps> = ({
  data,
  className = '',
  companyName = 'ResumeTune',
  supportEmail = 'support@resumetune.com'
}) => {
  // Generate derived data for the invoice
  const invoiceState: EmailInvoiceState = React.useMemo(() => ({
    invoiceNumber: `INV-${Date.now()}`,
    formattedDate: data.paymentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    formattedAmount: `$${(data.amount / 100).toFixed(2)}`
  }), [data.paymentDate, data.amount]);

  return (
    <div className={`invoice-email-template ${className}`}>
      {/* Invoice Header */}
      <header className="invoice-header">
        <div className="company-branding">
          <h1 className="company-name">{companyName}</h1>
          <p className="company-tagline">AI-powered career tools</p>
        </div>
        
        <div className="invoice-meta">
          <h2 className="invoice-title">Invoice</h2>
          <p className="invoice-number">{invoiceState.invoiceNumber}</p>
          <p className="invoice-date">{invoiceState.formattedDate}</p>
        </div>
      </header>

      {/* Customer Information */}
      <section className="customer-section">
        <h3 className="section-title">Bill To:</h3>
        <div className="customer-details">
          <p className="customer-email">{data.customerEmail}</p>
        </div>
      </section>

      {/* Invoice Details */}
      <section className="invoice-details">
        <h3 className="section-title">Invoice Details</h3>
        
        <div className="detail-grid">
          <InvoiceDetailRow 
            label="Product" 
            value={data.productName} 
          />
          
          <InvoiceDetailRow 
            label="Payment Type" 
            value={data.invoiceType === 'purchase' ? 'One-time Purchase' : 'Subscription Renewal'} 
          />
          
          <InvoiceDetailRow 
            label="Payment Method" 
            value="Credit Card (Stripe)" 
          />
          
          <InvoiceDetailRow 
            label="Credits Delivered" 
            value={`${data.creditsDelivered} credits`}
          />
          
          {data.stripeInvoiceId && (
            <InvoiceDetailRow 
              label="Stripe Invoice ID" 
              value={data.stripeInvoiceId} 
            />
          )}
        </div>
      </section>

      {/* Credits Highlight */}
      <section className="credits-highlight">
        <div className="credits-badge">
          <span className="credits-number">{data.creditsDelivered}</span>
          <span className="credits-label">AI Credits Added</span>
        </div>
      </section>

      {/* Total Amount */}
      <section className="total-section">
        <div className="total-container">
          <p className="total-label">Total Amount Paid</p>
          <h2 className="total-amount">
            {invoiceState.formattedAmount} {data.currency.toUpperCase()}
          </h2>
        </div>
      </section>

      {/* Thank You Message */}
      <section className="thank-you-section">
        <h3 className="thank-you-title">Thank you for choosing {companyName}!</h3>
        <p className="thank-you-message">
          Your credits have been successfully added to your account and are ready to use.
        </p>
      </section>

      {/* Footer */}
      <footer className="invoice-footer">
        <div className="footer-content">
          <p className="company-info">{companyName} - AI-powered career tools</p>
          <p className="payment-info">Payment securely processed by Stripe</p>
          <p className="support-info">
            Questions? Contact us at{' '}
            <a href={`mailto:${supportEmail}`} className="support-link">
              {supportEmail}
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
};

/**
 * Individual detail row component for invoice details section
 */
interface InvoiceDetailRowProps {
  label: string;
  value: string;
}

const InvoiceDetailRow: React.FC<InvoiceDetailRowProps> = ({ label, value }) => (
  <div className="detail-row">
    <span className="detail-label">{label}:</span>
    <span className="detail-value">{value}</span>
  </div>
);

/**
 * Utility function to convert the React component to HTML string for PDF generation
 * 
 * Usage:
 * ```typescript
 * import { renderToStaticMarkup } from 'react-dom/server';
 * const htmlString = renderEmailInvoiceToHTML(invoiceData);
 * ```
 */
export const renderEmailInvoiceToHTML = (
  data: EmailInvoiceProps['data'], 
  options?: {
    companyName?: string;
    supportEmail?: string;
    includeStyles?: boolean;
  }
): string => {
  // This function would use ReactDOMServer.renderToStaticMarkup
  // Implementation will be added when PDF generation is integrated
  
  // For now, return a placeholder
  console.log('TODO: Implement renderEmailInvoiceToHTML', { data, options });
  return '';
};

export default EmailInvoice;
