import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

/**
 * Utility function: notify all admin users with an in-app notification.
 * Callable from any authenticated frontend context.
 *
 * Payload:
 *   { title, message, escrow_id, type, action_url }
 */
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const caller = await base44.auth.me().catch(() => null);
  if (!caller) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { title, message, escrow_id, type = 'admin_action_required', action_url = '/Admin' } = body;

  if (!title || !message) {
    return Response.json({ error: 'Missing title or message' }, { status: 400 });
  }

  try {
    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' }, '-created_date', 100);
    for (const admin of admins) {
      await base44.asServiceRole.entities.Notification.create({
        user_email: admin.email,
        type,
        escrow_id: escrow_id || null,
        title,
        message,
        action_url
      });
    }
    return Response.json({ success: true, notified: admins.length });
  } catch (err) {
    console.error('notifyAdmins error:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
});