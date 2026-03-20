import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const { escrow_id } = await req.json();

  if (!escrow_id) {
    return Response.json({ error: 'escrow_id required' }, { status: 400 });
  }

  const base44 = createClientFromRequest(req);

  try {
    const escrow = await base44.asServiceRole.entities.Escrow.get(escrow_id);
    return Response.json({ escrow });
  } catch (error) {
    // SDK throws on 404 — return null so the frontend shows "not found" gracefully
    if (error.message?.includes('not found') || error.status === 404) {
      return Response.json({ escrow: null }, { status: 200 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});