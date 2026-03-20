/**
 * @function getEscrowPublic
 * @description Fetches an escrow by ID using service role — for unauthenticated sellers viewing from email links.
 * Only returns the escrow if it exists. Updates (accept/reject) still require auth via the normal entity API.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const { escrow_id } = await req.json();

    if (!escrow_id) {
      return Response.json({ error: 'escrow_id required' }, { status: 400 });
    }

    const base44 = createClientFromRequest(req);
    const escrow = await base44.asServiceRole.entities.Escrow.get(escrow_id);

    if (!escrow) {
      return Response.json({ error: 'Escrow not found' }, { status: 404 });
    }

    return Response.json({ escrow });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});