import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_xOcKrsw4NF9k@ep-silent-mountain-aoxdkf76.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { query, params = [] } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Invalid query' });
    }

    // Block dangerous operations
    const q = query.trim().toUpperCase();
    const blocked = ['DROP TABLE', 'DROP DATABASE', 'TRUNCATE', 'ALTER TABLE', 'CREATE USER', 'GRANT ', 'REVOKE '];
    if (blocked.some(b => q.includes(b))) {
      return res.status(403).json({ error: 'Operation not allowed' });
    }

    const rows = await sql(query, params);
    return res.status(200).json({ rows: rows || [] });

  } catch (err) {
    console.error('DB error:', err.message);
    return res.status(500).json({ error: err.message, rows: [] });
  }
}
