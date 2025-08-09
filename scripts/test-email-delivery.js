/**
 * Local test script for email delivery
 * Run with: RESEND_API_KEY=your_key node scripts/test-email-delivery.js
 */

import { generateInvoiceHTML, generateInvoicePDF, sendInvoiceEmail } from '../src/utils/invoice/index.js';

// Test invoice data
const testInvoiceData = {
  userId: 'test-user-123',
  customerEmail: 'test@example.com',
  amount: 900, // $9.00 in cents
  currency: 'usd',
  productName: '50 Credits',
  creditsDelivered: 50,
  paymentDate: new Date(),
  invoiceType: 'purchase',
  stripeInvoiceId: 'cs_test_123456789'
};

async function testEmailDelivery() {
  try {
    console.log('📧 Testing Email Delivery...');
    
    // Check for API key
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY environment variable is required');
      console.log('Usage: RESEND_API_KEY=your_key node scripts/test-email-delivery.js');
      process.exit(1);
    }
    
    console.log('✅ Resend API key found');
    console.log('Test email will be sent to:', testInvoiceData.customerEmail);
    
    // Generate HTML and PDF
    console.log('\n1. Generating invoice content...');
    const htmlContent = generateInvoiceHTML(testInvoiceData);
    const pdfBuffer = await generateInvoicePDF(htmlContent);
    console.log('✅ Invoice content generated');
    console.log('PDF size:', pdfBuffer.length, 'bytes');
    
    // Test email delivery
    console.log('\n2. Sending test email...');
    const emailSent = await sendInvoiceEmail(
      testInvoiceData.customerEmail,
      pdfBuffer,
      {
        productName: testInvoiceData.productName,
        creditsDelivered: testInvoiceData.creditsDelivered,
        amount: testInvoiceData.amount,
        currency: testInvoiceData.currency
      }
    );
    
    if (emailSent) {
      console.log('✅ Email sent successfully!');
      console.log('\n🎉 Email Delivery Test Complete!');
      console.log('Check your email inbox for the test invoice.');
    } else {
      console.log('❌ Email delivery failed');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Email Delivery Test Failed:', error);
    process.exit(1);
  }
}

testEmailDelivery();
