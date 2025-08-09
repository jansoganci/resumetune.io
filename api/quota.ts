import { VercelRequest, VercelResponse } from '@vercel/node';

// Redis client import
async function getRedis() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  
  try {
    const { Redis } = await import('@upstash/redis');
    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Basic CORS (MVP): allow site origins only
  const origin = req.headers.origin || '';
  const allowed = ['https://resumetune.io', 'http://localhost:5173'];
  if (allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'content-type, x-user-id');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, OPTIONS');
    return res.status(405).json({ error: { code: 'METHOD_NOT_ALLOWED', message: 'Method Not Allowed' } });
  }

  // Require authenticated user
  const userId = req.headers['x-user-id'] as string;
  if (!userId) {
    return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } });
  }

  try {
    const redis = await getRedis();
    if (!redis) {
      return res.status(503).json({ error: { code: 'REDIS_UNAVAILABLE', message: 'Service temporarily unavailable' } });
    }

    // Get today's date for quota key
    const today = new Date().toISOString().slice(0, 10);
    const quotaKey = `quota:${userId}:${today}`;
    const creditsKey = `credits:${userId}`;
    const subKey = `sub:${userId}`;

    // Fetch all data in parallel
    const [todayUsage, credits, subscription] = await Promise.all([
      redis.get(quotaKey),
      redis.get(creditsKey),
      redis.get(subKey),
    ]);

    const response = {
      quota: {
        today: Number(todayUsage || 0),
        limit: 3, // Free tier limit
      },
      credits: Number(credits || 0),
      subscription: subscription as string | null,
    };

    return res.status(200).json(response);
  } catch (error) {
    console.error('Quota API error:', error);
    return res.status(500).json({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: 'Failed to fetch quota information' 
      } 
    });
  }
}
