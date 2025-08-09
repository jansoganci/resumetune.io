import { VercelRequest, VercelResponse } from '@vercel/node';

async function getRedis() {
  try {
    const { Redis } = await import('@upstash/redis');
    
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      console.error('Redis environment variables not found');
      return null;
    }

    return new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (error) {
    console.error('Failed to initialize Redis:', error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId, credits } = req.body;
  
  if (!userId || !credits) {
    return res.status(400).json({ 
      error: 'Missing userId or credits',
      example: { userId: 'user-123', credits: 200 }
    });
  }

  try {
    const redis = await getRedis();
    if (!redis) {
      return res.status(503).json({ error: 'Redis not available' });
    }

    const key = `credits:${userId}`;
    const newBalance = await redis.incrby(key, credits);
    
    console.log(`Added ${credits} credits to user ${userId}. New balance: ${newBalance}`);
    
    return res.status(200).json({
      success: true,
      userId,
      creditsAdded: credits,
      newBalance: newBalance,
      message: `Successfully added ${credits} credits`
    });
    
  } catch (error) {
    console.error('Error updating credits:', error);
    return res.status(500).json({ 
      error: 'Failed to update credits',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
