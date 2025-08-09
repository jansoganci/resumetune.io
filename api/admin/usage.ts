// Admin Usage Endpoint: GET /api/admin/usage?date=YYYY-MM-DD
// Auth: header x-admin-token must match process.env.ADMIN_USAGE_TOKEN
// Returns: { date, usage: { [id]: count } }

type VercelRequest = any;
type VercelResponse = any;

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const { Redis } = await import('@upstash/redis');
  // @ts-ignore - runtime construction
  return new Redis({ url, token });
}

function isValidDateString(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s);
  // Ensure valid date and preserve yyyy-mm-dd
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const tokenHeader = (req.headers['x-admin-token'] || req.headers['X-Admin-Token']) as string | undefined;
  const expected = (process.env.ADMIN_USAGE_TOKEN || '').trim();
  if (!expected || !tokenHeader || tokenHeader.trim() !== expected) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const base = 'http://localhost';
    const url = new URL(req.url || '/api/admin/usage', base);
    const date = (url.searchParams.get('date') || new Date().toISOString().slice(0, 10)).trim();
    if (!isValidDateString(date)) {
      res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      return;
    }

    const redis = await getRedis();
    if (!redis) {
      res.status(501).json({ error: 'Redis not configured' });
      return;
    }

    // Collect all keys for the given date
    let usage: Record<string, number> = {};
    try {
      const pattern = `quota:*:${date}`;
      // Use KEYS for simplicity (admin-only, low-frequency). Switch to SCAN if needed.
      const keys: string[] = (await redis.keys(pattern)) || [];
      if (keys.length === 0) {
        res.status(200).json({ date, usage });
        return;
      }

      // Fetch values in bulk
      // Upstash mget signature accepts variadic args
      const values: (string | number | null)[] = await redis.mget(...keys);
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const v = values[i];
        const parts = k.split(':'); // quota:{id}:{yyyy-mm-dd}
        const id = parts.length >= 3 ? parts[1] : k;
        const num = Number(v || 0);
        usage[id] = num;
      }
    } catch (e) {
      res.status(500).json({ error: 'Failed to read usage' });
      return;
    }

    res.status(200).json({ date, usage });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}


