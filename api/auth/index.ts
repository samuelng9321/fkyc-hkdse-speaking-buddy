import type { VercelRequest, VercelResponse } from '@vercel/node';

// Rate limiting: Simple in-memory store (resets on cold start)
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

function getRateLimitKey(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : req.socket?.remoteAddress || 'unknown';
  return ip;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(key);

  if (!record || now > record.resetTime) {
    requestCounts.set(key, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

function isValidOrigin(req: VercelRequest): boolean {
  const origin = req.headers.origin || '';
  const referer = req.headers.referer || '';

  // If no origin header, likely same-origin request (not CORS)
  if (!origin) {
    return true;
  }

  // Allow localhost for development
  if (origin.includes('localhost')) {
    return true;
  }

  // Allow any Vercel deployment URL
  if (origin.includes('.vercel.app')) {
    return true;
  }

  // Allow custom production URL if set
  if (process.env.PRODUCTION_URL && origin.startsWith(process.env.PRODUCTION_URL)) {
    return true;
  }

  // Check referer as fallback
  if (referer.includes('.vercel.app') || referer.includes('localhost')) {
    return true;
  }

  return false;
}

export default function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Validate origin
  if (!isValidOrigin(req)) {
    return res.status(403).json({ error: 'Forbidden: Invalid origin' });
  }

  // Check rate limit
  const rateLimitKey = getRateLimitKey(req);
  if (!checkRateLimit(rateLimitKey)) {
    return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  }

  // Get API key from environment
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // Return the API key
  return res.status(200).json({
    key: apiKey,
    expiresIn: 3600 // Hint to client: consider refreshing after 1 hour
  });
}
