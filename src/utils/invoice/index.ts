/**
 * Invoice Module Export Hub
 * 
 * Centralized exports for all invoice-related utilities, components, and types.
 * This makes the module easy to import and portable across projects.
 * 
 * Usage:
 * ```typescript
 * import { InvoiceData, EmailInvoice, generateInvoiceHTML, sendInvoiceEmail } from '@/utils/invoice';
 * ```
 */

// Types
export type { InvoiceData, InvoiceProps, EmailInvoiceProps } from './types';

// Utilities
export { generateInvoiceHTML, generateInvoicePDF, generateInvoicePDFFromData } from './generate';
export { sendInvoiceEmail } from './email';

// Components
export { EmailInvoice, renderEmailInvoiceToHTML } from './components/EmailInvoice';
export { default as InvoiceHistoryTable } from './components/InvoiceHistoryTable';
export { default as InvoicePreviewModal } from './components/InvoicePreviewModal';
export { default as InvoiceToast, useInvoiceToast } from './components/InvoiceToast';

// Re-export default component for convenience
export { default as EmailInvoiceComponent } from './components/EmailInvoice';
