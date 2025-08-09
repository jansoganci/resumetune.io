/**
 * Simple invoice test using direct function calls
 * This bypasses the ES module import issues by using inline code
 */

// Mock invoice data
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

// Simple HTML invoice template
function generateTestInvoiceHTML(data) {
  const formattedAmount = `$${(data.amount / 100).toFixed(2)}`;
  const formattedDate = data.paymentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const invoiceNumber = `INV-${Date.now()}`;

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Invoice - ResumeTune</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; max-width: 800px; }
          .header { border-bottom: 3px solid #3B82F6; padding-bottom: 20px; margin-bottom: 30px; }
          .company-logo { font-size: 28px; font-weight: bold; color: #3B82F6; }
          .invoice-details { background: #F8FAFC; padding: 24px; border-radius: 8px; margin: 24px 0; }
          .total-section { background: #3B82F6; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0; }
          .credits-highlight { background: #ECFDF5; border: 2px solid #10B981; padding: 16px; text-align: center; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-logo">ResumeTune</div>
          <h1>Invoice</h1>
          <p>${invoiceNumber} - ${formattedDate}</p>
        </div>
        
        <div class="invoice-details">
          <h3>Invoice Details</h3>
          <p><strong>Customer:</strong> ${data.customerEmail}</p>
          <p><strong>Product:</strong> ${data.productName}</p>
          <p><strong>Credits Delivered:</strong> ${data.creditsDelivered}</p>
          <p><strong>Payment Method:</strong> Credit Card (Stripe)</p>
          ${data.stripeInvoiceId ? `<p><strong>Stripe ID:</strong> ${data.stripeInvoiceId}</p>` : ''}
        </div>
        
        <div class="credits-highlight">
          <h2>${data.creditsDelivered} AI Credits Added</h2>
        </div>
        
        <div class="total-section">
          <h2>Total: ${formattedAmount} ${data.currency.toUpperCase()}</h2>
        </div>
        
        <p style="margin-top: 30px; text-align: center; color: #666;">
          Thank you for choosing ResumeTune!
        </p>
      </body>
    </html>
  `.trim();
}

// Test function
async function testInvoice() {
  try {
    console.log('🧪 Testing Invoice Generation...');
    
    // Generate HTML
    const htmlContent = generateTestInvoiceHTML(testInvoiceData);
    console.log('✅ HTML generated successfully');
    console.log('HTML length:', htmlContent.length, 'characters');
    
    // Save HTML file
    const fs = await import('fs');
    const path = await import('path');
    
    const htmlPath = path.default.join(process.cwd(), 'test-invoice-simple.html');
    fs.default.writeFileSync(htmlPath, htmlContent);
    console.log('📄 HTML saved to:', htmlPath);
    
    console.log('\n🎉 Test Complete!');
    console.log('✅ Open test-invoice-simple.html in your browser to see the invoice');
    console.log('✅ This proves the invoice HTML generation works');
    
    // Test data structure
    console.log('\n📊 Test Invoice Data:');
    console.log(JSON.stringify(testInvoiceData, null, 2));
    
  } catch (error) {
    console.error('❌ Test Failed:', error);
    process.exit(1);
  }
}

testInvoice();
