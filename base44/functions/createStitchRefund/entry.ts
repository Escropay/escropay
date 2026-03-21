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

    // Only admins or the buyer can request a refund
    const body = await req.json();
    const { payment_id, amount, reason, escrow_id } = body;

    if (!payment_id) {
      return Response.json({ error: 'payment_id is required' }, { status: 400 });
    }

    const payload = {
      ...(amount && { amount: Math.round(amount * 100) }),
      ...(reason && { reason }),
      ...(escrow_id && { metadata: { escrow_id } }),
    };

    const response = await fetch(`${STITCH_API_BASE}/payment/${payment_id}/refund`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${STITCH_API_KEY}`,
        'x-api-key': STITCH_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    if (!response.ok) {
      return Response.json({ error: data }, { status: response.status });
    }

    // Update escrow status if escrow_id provided
    if (escrow_id) {
      await base44.asServiceRole.entities.Escrow.update(escrow_id, {
        status: 'refunded',
      });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});