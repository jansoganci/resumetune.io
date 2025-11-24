/**
 * Email Delivery Utilities
 * Handles sending invoice emails with PDF attachments via Resend
 */

import { Resend } from 'resend';
import { generateInvoiceHTML } from './generate';
import { InvoiceData } from './types';

/**
 * Sends an invoice email with PDF attachment
 * 
 * @param toEmail - Recipient email address
 * @param pdfBuffer - PDF invoice as Buffer
 * @param invoiceData - Invoice data for email content
 */
export async function sendInvoiceEmail(
  toEmail: string, 
  pdfBuffer: Buffer,
  invoiceData?: {
    productName?: string;
    creditsDelivered?: number;
    amount?: number;
    currency?: string;
  }
): Promise<boolean> {
  try {
    // Initialize Resend client
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Create a minimal invoice data object for HTML generation if needed
    const htmlInvoiceData: InvoiceData = {
      userId: 'webhook-generated',
      customerEmail: toEmail,
      amount: invoiceData?.amount || 0,
      currency: invoiceData?.currency || 'usd',
      productName: invoiceData?.productName || 'Product',
      creditsDelivered: invoiceData?.creditsDelivered || 0,
      paymentDate: new Date(),
      invoiceType: 'purchase'
    };
    
    // Generate HTML content for email
    const htmlContent = generateInvoiceHTML(htmlInvoiceData);
    
    // Send email with PDF attachment
    const result = await resend.emails.send({
      from: 'noreply@resend.dev',
      to: toEmail,
      subject: 'Your Invoice',
      html: htmlContent,
      attachments: [
        {
          filename: 'invoice.pdf',
          content: pdfBuffer.toString('base64'),
          contentType: 'application/pdf'
        }
      ]
    });

    import('../logger').then(({ logger }) => {
      logger.info('Invoice email sent successfully', { messageId: result.data?.id || 'unknown' });
    }).catch(() => {});
    return true;

  } catch (error) {
    import('../logger').then(({ logger }) => {
      logger.error('Failed to send invoice email', error instanceof Error ? error : { error });
    }).catch(() => {});
    return false;
  }
}
