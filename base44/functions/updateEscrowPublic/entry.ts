import { createClient } from 'npm:@base44/sdk@0.8.21';

const base44 = createClient({ appId: Deno.env.get('BASE44_APP_ID'), useServiceRole: true });

const allowedStatuses = ['pending', 'rejected_by_seller', 'modification_requested'];
const allowedFields = ['status', 'recipient_accepted', 'recipient_accepted_at', 'modification_request'];

Deno.serve(async (req) => {
  try {
    const { escrow_id, update_data } = await req.json();

    if (!escrow_id || !update_data) {
      return Response.json({ error: 'Missing escrow_id or update_data' }, { status: 400 });
    }

    if (update_data.status && !allowedStatuses.includes(update_data.status)) {
      return Response.json({ error: 'Status not allowed' }, { status: 403 });
    }

    // Verify escrow is in the right state before updating
    const escrow = await base44.entities.Escrow.get(escrow_id);
    if (!escrow) {
      return Response.json({ error: 'Escrow not found' }, { status: 404 });
    }
    if (escrow.status !== 'pending_seller_acceptance') {
      return Response.json({ error: 'Escrow is not pending seller acceptance' }, { status: 403 });
    }

    // Only allow safe fields
    const safeUpdate = {};
    for (const key of allowedFields) {
      if (update_data[key] !== undefined) safeUpdate[key] = update_data[key];
    }

    const updated = await base44.entities.Escrow.update(escrow_id, safeUpdate);
    return Response.json({ escrow: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});