import { createClient } from 'npm:@base44/sdk@0.8.21';

const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID'), useServiceRole: true });

Deno.serve(async (req) => {
  try {
    const { escrow_id } = await req.json();

    if (!escrow_id) {
      return Response.json({ error: 'escrow_id required' }, { status: 400 });
    }

    const escrow = await base44.entities.Escrow.get(escrow_id);

    if (!escrow) {
      return Response.json({ error: 'Escrow not found' }, { status: 404 });
    }

    return Response.json({ escrow });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});