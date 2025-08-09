/**
 * Shared Invoice Types
 * Common interfaces and types used across invoice generation, components, and email delivery
 */

export interface InvoiceData {
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

export interface InvoiceProps {
  data: InvoiceData;
  className?: string;
}

export interface EmailInvoiceProps extends InvoiceProps {
  // Additional props specific to email template rendering
  companyName?: string;
  supportEmail?: string;
}

/**
 * UI-specific invoice interface for display components
 * Maps InvoiceData to UI-friendly property names
 */
export interface UIInvoice {
  id: string;
  date: string;
  amount: string;
  currency: string;
  productName: string;
  status: 'paid' | 'pending' | 'failed';
  customerEmail?: string;
  creditsDelivered?: number;
  downloadUrl?: string;
}
