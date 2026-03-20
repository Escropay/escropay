import { createClient } from 'npm:@base44/sdk@0.8.21';

const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID'), useServiceRole: true });

Deno.serve(async (req) => {
  const { escrow_id } = await req.json();

  if (!escrow_id) {
    return Response.json({ error: 'escrow_id required' }, { status: 400 });
  }

  try {
    const escrow = await base44.entities.Escrow.get(escrow_id);
    return Response.json({ escrow });
  } catch (error) {
    // SDK throws on 404 — treat as not found
    if (error.message?.includes('not found') || error.status === 404) {
      return Response.json({ escrow: null }, { status: 200 });
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
});