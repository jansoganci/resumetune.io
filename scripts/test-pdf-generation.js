/**
 * Local test script for PDF generation
 * Run with: node scripts/test-pdf-generation.js
 */

import { generateInvoiceHTML, generateInvoicePDF } from '../src/utils/invoice/index.js';
import fs from 'fs';
import path from 'path';

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

async function testPDFGeneration() {
  try {
    console.log('🧪 Testing PDF Generation...');
    console.log('Invoice data:', testInvoiceData);
    
    // Test HTML generation
    console.log('\n1. Testing HTML generation...');
    const htmlContent = generateInvoiceHTML(testInvoiceData);
    console.log('✅ HTML generated successfully');
    console.log('HTML length:', htmlContent.length, 'characters');
    
    // Save HTML for inspection
    const htmlPath = path.join(process.cwd(), 'test-invoice.html');
    fs.writeFileSync(htmlPath, htmlContent);
    console.log('📄 HTML saved to:', htmlPath);
    
    // Test PDF generation
    console.log('\n2. Testing PDF generation...');
    const pdfBuffer = await generateInvoicePDF(htmlContent);
    console.log('✅ PDF generated successfully');
    console.log('PDF size:', pdfBuffer.length, 'bytes');
    
    // Save PDF for inspection
    const pdfPath = path.join(process.cwd(), 'test-invoice.pdf');
    fs.writeFileSync(pdfPath, pdfBuffer);
    console.log('📄 PDF saved to:', pdfPath);
    
    console.log('\n🎉 PDF Generation Test Complete!');
    console.log('Check the generated files:');
    console.log('- HTML:', htmlPath);
    console.log('- PDF:', pdfPath);
    
  } catch (error) {
    console.error('❌ PDF Generation Test Failed:', error);
    process.exit(1);
  }
}

testPDFGeneration();
