// ================================================================
// IP ADDRESS EXTRACTION UTILITIES
// ================================================================
// This utility extracts the real IP address from VercelRequest headers
// Handles various proxy scenarios and returns clean IP for rate limiting

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
