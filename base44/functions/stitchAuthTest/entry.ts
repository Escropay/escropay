import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const STITCH_API_KEY = Deno.env.get('STITCH_API_KEY');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const results = {};

    // Try different base URLs and auth header formats
    const baseUrls = [
      'https://express.stitch.money/api/v1',
      'https://just.wigwag.me/api/v1',
    ];

    const authHeaders = [
      { 'Authorization': `Bearer ${STITCH_API_KEY}` },
      { 'x-api-key': STITCH_API_KEY },
      { 'Authorization': `Token ${STITCH_API_KEY}` },
      { 'Authorization': `ApiKey ${STITCH_API_KEY}` },
    ];

    for (const base of baseUrls) {
      for (let i = 0; i < authHeaders.length; i++) {
        const key = `${base} | auth[${i}]`;
        try {
          const res = await fetch(`${base}/payment-links`, {
            method: 'POST',
            headers: { ...authHeaders[i], 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: 10000, currency: 'ZAR', description: 'Test' }),
          });
          const text = await res.text();
          results[key] = { status: res.status, body: text.substring(0, 200) };
        } catch (e) {
          results[key] = { error: e.message };
        }
      }
    }

    return Response.json(results);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});