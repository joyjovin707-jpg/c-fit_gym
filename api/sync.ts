import type { VercelRequest, VercelResponse } from '@vercel/node';

// Global in-memory cache for warm lambdas
let cachedDbData: any = null;
let lastUpdatedAt: string = new Date().toISOString();

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      if (body) {
        cachedDbData = body;
        lastUpdatedAt = new Date().toISOString();
      }
      return res.status(200).json({
        success: true,
        updatedAt: lastUpdatedAt,
        message: 'Synchronized with Vercel API'
      });
    } catch (e: any) {
      return res.status(400).json({ success: false, error: e?.message });
    }
  }

  return res.status(200).json({
    success: true,
    updatedAt: lastUpdatedAt,
    data: cachedDbData || {}
  });
}
