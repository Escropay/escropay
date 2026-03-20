import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const allowedStatuses = ['pending', 'rejected_by_seller', 'modification_requested'];
const allowedFields = ['status', 'recipient_accepted', 'recipient_accepted_at', 'modification_request'];

Deno.serve(async (req) => {
  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { escrow_id, update_data } = body;

  if (!escrow_id || !update_data) {
    return Response.json({ error: 'Missing escrow_id or update_data' }, { status: 400 });
  }

  if (update_data.status && !allowedStatuses.includes(update_data.status)) {
    return Response.json({ error: 'Status not allowed' }, { status: 403 });
  }

  const base44 = createClientFromRequest(req);

  // Verify escrow exists and is in correct state
  let escrow;
  try {
    escrow = await base44.asServiceRole.entities.Escrow.get(escrow_id);
  } catch (error) {
    if (error.message?.includes('not found') || error.status === 404) {
      return Response.json({ error: 'Escrow not found' }, { status: 404 });
    }
    console.error('Fetch escrow error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (escrow.status !== 'pending_seller_acceptance') {
    return Response.json({ error: 'Escrow is not pending seller acceptance' }, { status: 403 });
  }

  // Only allow safe fields
  const safeUpdate = {};
  for (const key of allowedFields) {
    if (update_data[key] !== undefined) safeUpdate[key] = update_data[key];
  }

  try {
    const updated = await base44.asServiceRole.entities.Escrow.update(escrow_id, safeUpdate);
    return Response.json({ escrow: updated });
  } catch (error) {
    console.error('Update escrow error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});