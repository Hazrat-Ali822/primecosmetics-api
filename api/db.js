import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_xOcKrsw4NF9k@ep-silent-mountain-aoxdkf76.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require');

export const config = { runtime: 'edge' };

export default async function handler(req) {
  // CORS headers — allow all origins (your GitHub Pages site)
  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: cors });
  }

  try {
    const { query, params = [] } = await req.json();

    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Invalid query' }), { status: 400, headers: cors });
    }

    // Basic security: block dangerous operations
    const q = query.trim().toUpperCase();
    const blocked = ['DROP TABLE', 'DROP DATABASE', 'TRUNCATE', 'ALTER TABLE', 'CREATE USER', 'GRANT ', 'REVOKE '];
    if (blocked.some(b => q.includes(b))) {
      return new Response(JSON.stringify({ error: 'Operation not allowed' }), { status: 403, headers: cors });
    }

    const rows = await sql(query, params);
    return new Response(JSON.stringify({ rows: rows || [] }), { status: 200, headers: cors });

  } catch (err) {
    console.error('DB error:', err.message);
    return new Response(JSON.stringify({ error: err.message, rows: [] }), { status: 500, headers: cors });
  }
}
