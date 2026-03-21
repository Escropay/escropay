import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Validate shared secret (optional query param for webhook registration)
    const url = new URL(req.url);
    const secret = url.searchParams.get('secret');
    const expectedSecret = Deno.env.get('STITCH_WEBHOOK_SECRET');
    if (expectedSecret && secret !== expectedSecret) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const event = await req.json();
    console.log('Stitch webhook event:', JSON.stringify(event));

    const { type, data } = event;

    // Handle payment completed event — fund the associated escrow
    if (type === 'payment.completed' || type === 'payment_link.payment_completed') {
      const escrowId = data?.metadata?.escrow_id;
      const paymentId = data?.id || data?.payment_id;

      if (escrowId) {
        // Update escrow to funded
        await base44.asServiceRole.entities.Escrow.update(escrowId, {
          status: 'funded',
          funded_at: new Date().toISOString(),
          metadata: {
            ...(data?.metadata || {}),
            stitch_payment_id: paymentId,
          },
        });

        // Record payment
        const escrow = await base44.asServiceRole.entities.Escrow.get(escrowId);
        if (escrow) {
          await base44.asServiceRole.entities.Payment.create({
            escrow_id: escrowId,
            amount: (data?.amount || 0) / 100,
            currency: data?.currency || 'ZAR',
            gateway: 'zaru',
            status: 'completed',
            gateway_reference: paymentId,
            payer_email: escrow.buyer_email,
            payer_name: escrow.buyer_name,
            metadata: data,
          });
        }

        console.log(`Escrow ${escrowId} funded via Stitch payment ${paymentId}`);
      }
    }

    // Handle refund completed
    if (type === 'payment.refunded' || type === 'refund.completed') {
      const escrowId = data?.metadata?.escrow_id;
      if (escrowId) {
        await base44.asServiceRole.entities.Escrow.update(escrowId, {
          status: 'refunded',
        });
        console.log(`Escrow ${escrowId} marked as refunded`);
      }
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Stitch webhook error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
});