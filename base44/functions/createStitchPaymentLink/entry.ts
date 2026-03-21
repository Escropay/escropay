import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const STITCH_API_BASE = 'https://express.stitch.money/api/v1';
const STITCH_API_KEY = Deno.env.get('STITCH_API_KEY');

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { amount, currency = 'ZAR', description, escrow_id, redirect_url, cancel_url } = body;

    if (!amount || !description) {
      return Response.json({ error: 'amount and description are required' }, { status: 400 });
    }

    const payload = {
      amount: Math.round(amount * 100), // convert to cents
      currency,
      description,
      metadata: { escrow_id: escrow_id || null },
      ...(redirect_url && { redirect_url }),
      ...(cancel_url && { cancel_url }),
    };

    const response = await fetch(`${STITCH_API_BASE}/payment-links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STITCH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      return Response.json({ error: data }, { status: response.status });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});