import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { escrow_id } = body;

  if (!escrow_id) {
    return Response.json({ error: 'escrow_id required' }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    // Try authenticated first, fall back to service role
    let escrow = null;
    try {
      escrow = await base44.asServiceRole.entities.Escrow.get(escrow_id);
    } catch (e) {
      if (e.message?.includes('not found') || e.status === 404 || String(e.message).includes('404')) {
        return Response.json({ escrow: null }, { status: 200 });
      }
      throw e;
    }

    // Strip sensitive fields before returning to unauthenticated callers
    const safeEscrow = { ...escrow };
    delete safeEscrow.seller_banking_details;
    delete safeEscrow.admin_resolution;
    delete safeEscrow.metadata;

    return Response.json({ escrow: safeEscrow });
  } catch (error) {
    if (error.message?.includes('not found') || error.status === 404) {
      return Response.json({ escrow: null }, { status: 200 });
    }
    console.error('getEscrowPublic error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});