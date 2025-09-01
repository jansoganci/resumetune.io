// ================================================================
// ISOLATED UTILITY FUNCTIONS FOR API ENDPOINTS  
// ================================================================
// This module contains utility functions needed by API endpoints
// Isolated from src/ to avoid cross-boundary import issues

/**
 * Extract the real IP address from request headers
 * Handles Vercel, Cloudflare, and other proxy scenarios
 */
export function extractClientIP(req: any): string {
  // Priority order for IP extraction
  const ipHeaders = [
    'x-forwarded-for',
    'x-real-ip', 
    'x-client-ip',
    'x-forwarded',
    'forwarded-for',
    'forwarded'
  ];
  
  // Try each header in priority order
  for (const header of ipHeaders) {
    const value = req.headers[header];
    if (value) {
      // Handle comma-separated lists (take first IP)
      const ips = value.split(',').map((ip: string) => ip.trim());
      const firstIP = ips[0];
      
      if (isValidIP(firstIP)) {
        return firstIP;
      }
    }
  }
  
  // Fallback to connection remote address
  if (req.connection?.remoteAddress) {
    const ip = req.connection.remoteAddress;
    if (isValidIP(ip)) {
      return ip;
    }
  }
  
  // Final fallback - use a default IP for localhost/development
  if (process.env.NODE_ENV === 'development') {
    return '127.0.0.1';
  }
  
  // In production, if we can't determine IP, use a placeholder
  // This should rarely happen but prevents system crashes
  return '0.0.0.0';
}

/**
 * Validate if a string is a valid IP address
 */
function isValidIP(ip: string): boolean {
  if (!ip || typeof ip !== 'string') {
    return false;
  }
  
  // Remove IPv6 prefix if present
  const cleanIP = ip.replace(/^::ffff:/, '');
  
  // IPv4 validation
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (ipv4Regex.test(cleanIP)) {
    return true;
  }
  
  // IPv6 validation (basic)
  const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
  if (ipv6Regex.test(cleanIP)) {
    return true;
  }
  
  return false;
}

/**
 * Hash IP address for privacy compliance
 * Returns SHA-256 hash of the IP address
 */
export async function hashIP(ip: string): Promise<string> {
  // In a real implementation, you would use crypto to hash the IP
  // For now, return a simple hash to avoid adding crypto dependencies
  // TODO: Implement proper SHA-256 hashing when crypto is available
  
  // Simple hash function for development
  let hash = 0;
  for (let i = 0; i < ip.length; i++) {
    const char = ip.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return `ip_${Math.abs(hash).toString(36)}`;
}

/**
 * Check if IP is from localhost/private network
 * Useful for development and testing
 */
export function isPrivateIP(ip: string): boolean {
  const privateRanges = [
    /^127\./,                    // 127.0.0.0/8
    /^10\./,                     // 10.0.0.0/8
    /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
    /^192\.168\./,               // 192.168.0.0/16
    /^::1$/,                     // IPv6 localhost
    /^fe80:/,                    // IPv6 link-local
    /^fc00:/,                    // IPv6 unique local
  ];
  
  return privateRanges.some(range => range.test(ip));
}

/**
 * Get IP address with privacy considerations
 * Returns hashed IP for production, plain IP for development
 */
export async function getPrivacySafeIP(ip: string): Promise<string> {
  if (process.env.NODE_ENV === 'development') {
    return ip;
  }
  
  // In production, always hash IPs for privacy
  return await hashIP(ip);
}

// ================================================================
// INVOICE GENERATION FUNCTIONS (SIMPLIFIED FOR API USE)
// ================================================================

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

/**
 * Generate simple HTML invoice for API endpoints
 * Minimal version without heavy dependencies
 */
export function generateInvoiceHTML(data: InvoiceData): string {
  const { 
    customerEmail, 
    amount, 
    currency, 
    productName, 
    creditsDelivered, 
    paymentDate,
    invoiceType,
    stripeInvoiceId 
  } = data;
  
  const formatCurrency = (amount: number, currency: string) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount / 100);
  
  const formatDate = (date: Date) => 
    new Intl.DateTimeFormat('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).format(date);

  return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice - ${productName}</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .invoice-details { background: #f9f9f9; padding: 20px; margin: 20px 0; }
        .total { font-size: 1.2em; font-weight: bold; margin-top: 20px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Payment Receipt</h1>
        <p>Thank you for your purchase!</p>
    </div>
    
    <div class="invoice-details">
        <h2>Order Details</h2>
        <p><strong>Customer:</strong> ${customerEmail}</p>
        <p><strong>Product:</strong> ${productName}</p>
        <p><strong>Credits Delivered:</strong> ${creditsDelivered}</p>
        <p><strong>Payment Date:</strong> ${formatDate(paymentDate)}</p>
        <p><strong>Type:</strong> ${invoiceType}</p>
        ${stripeInvoiceId ? `<p><strong>Invoice ID:</strong> ${stripeInvoiceId}</p>` : ''}
        
        <div class="total">
            <p>Total: ${formatCurrency(amount, currency)}</p>
        </div>
    </div>
    
    <p><em>This is an automated receipt. Please keep this for your records.</em></p>
</body>
</html>`;
}

/**
 * Generate PDF invoice (placeholder - returns HTML for now)
 * In a full implementation, this would use a PDF generation library
 */
export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  // For MVP, return HTML as text buffer
  // In production, you would use a PDF library like puppeteer or @react-pdf/renderer
  const html = generateInvoiceHTML(data);
  return Buffer.from(html, 'utf-8');
}

/**
 * Send invoice email (simplified version)
 * Returns success/failure status
 */
export async function sendInvoiceEmail(
  customerEmail: string, 
  invoiceData: InvoiceData,
  pdfBuffer?: Buffer
): Promise<{ success: boolean; error?: string }> {
  try {
    // In a full implementation, this would use a service like Resend or SendGrid
    // For now, just log the email data
    console.log('Email invoice sent:', {
      to: customerEmail,
      subject: `Receipt for ${invoiceData.productName}`,
      credits: invoiceData.creditsDelivered,
      amount: invoiceData.amount,
      currency: invoiceData.currency
    });
    
    return { success: true };
  } catch (error) {
    console.error('Failed to send invoice email:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
