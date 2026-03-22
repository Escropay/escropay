import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Utility function: notify all admin users with an in-app notification.
 * Callable from any authenticated frontend context.
 *
 * Payload:
 *   { title, message, escrow_id, type, action_url }
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const caller = await base44.auth.me().catch(() => null);
    if (!caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let body;
    try {
      body = await req.json();
    } catch (parseErr) {
      return Response.json({ error: 'Invalid JSON', details: parseErr?.message }, { status: 400 });
    }

    if (!body || typeof body !== 'object') {
      return Response.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { title, message, escrow_id, type = 'admin_action_required', action_url = '/Admin' } = body;

    if (!title || typeof title !== 'string' || !message || typeof message !== 'string') {
      return Response.json({ error: 'Missing or invalid title/message (must be strings)' }, { status: 400 });
    }

    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' }, '-created_date', 100);
    let notifiedCount = 0;

    for (const admin of admins || []) {
      if (admin?.email) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: admin.email,
          type: type || 'admin_action_required',
          escrow_id: escrow_id || null,
          title: title.substring(0, 200), // Sanitize length
          message: message.substring(0, 1000),
          action_url: action_url || '/Admin'
        }).catch(() => {});
        notifiedCount++;
      }
    }

    return Response.json({ success: true, notified: notifiedCount });
  } catch (err) {
    console.error('notifyAdmins error:', err?.message);
    return Response.json({ error: err?.message || 'Internal server error', notified: 0 }, { status: 500 });
  }
});