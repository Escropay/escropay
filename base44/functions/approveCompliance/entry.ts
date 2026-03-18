/**
 * @function approveCompliance
 * @category Compliance Engine — Admin Actions
 * @description
 *   Admin approves or rejects a user's compliance review.
 *   Updates User.account_status, ComplianceRecord.cdd_status,
 *   writes AuditLog entry, notifies user and admins.
 * @access Admin only
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Verify admin
    const actor = await base44.auth.me();
    if (actor?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { user_id, action, notes, edd_required } = await req.json();
    // action: 'approve' | 'reject' | 'require_edd' | 'suspend' | 'terminate'

    if (!user_id || !action) {
      return Response.json({ error: 'user_id and action required' }, { status: 400 });
    }

    const users = await base44.asServiceRole.entities.User.filter({ id: user_id });
    if (!users.length) return Response.json({ error: 'User not found' }, { status: 404 });
    const user = users[0];

    // Determine new statuses
    const statusMap = {
      approve: { account_status: 'active', cdd_status: 'approved', event_type: 'account_activated' },
      reject: { account_status: 'terminated', cdd_status: 'rejected', event_type: 'account_terminated' },
      require_edd: { account_status: 'restricted', cdd_status: 'edd_required', event_type: 'edd_triggered' },
      suspend: { account_status: 'suspended', cdd_status: 'in_review', event_type: 'account_suspended' },
      terminate: { account_status: 'terminated', cdd_status: 'rejected', event_type: 'account_terminated' },
    };

    const mapping = statusMap[action];
    if (!mapping) return Response.json({ error: 'Invalid action' }, { status: 400 });

    // Update User
    await base44.asServiceRole.entities.User.update(user_id, {
      account_status: mapping.account_status,
      compliance_approved_by: actor.email,
      compliance_approved_at: new Date().toISOString(),
      compliance_notes: notes || ''
    });

    // Update ComplianceRecord
    const records = await base44.asServiceRole.entities.ComplianceRecord.filter({ user_id });
    const reviewEntry = {
      reviewed_by: actor.email,
      reviewed_at: new Date().toISOString(),
      action,
      notes: notes || ''
    };

    if (records.length > 0) {
      const existing = records[0];
      const history = existing.review_history || [];
      await base44.asServiceRole.entities.ComplianceRecord.update(existing.id, {
        cdd_status: mapping.cdd_status,
        edd_required: edd_required || false,
        identity_verified: action === 'approve',
        identity_verified_at: action === 'approve' ? new Date().toISOString() : null,
        identity_verified_by: action === 'approve' ? actor.email : null,
        review_history: [...history, reviewEntry],
        last_review_date: new Date().toISOString(),
      });
    }

    // AuditLog
    await base44.asServiceRole.entities.AuditLog.create({
      event_type: mapping.event_type,
      entity_type: 'User',
      entity_id: user_id,
      actor_email: actor.email,
      actor_role: 'admin',
      description: `Admin ${action}: ${notes || 'No notes provided'}`,
      before_state: { account_status: user.account_status },
      after_state: { account_status: mapping.account_status }
    });

    // If terminating — add to blacklist
    if (action === 'terminate' || action === 'reject') {
      await base44.asServiceRole.entities.Blacklist.create({
        identifier_type: 'email',
        identifier_value: user.email,
        reason: 'compliance_termination',
        source: 'admin',
        added_by: actor.email,
        notes: notes || 'Account terminated via compliance review',
        active: true
      });
    }

    // Notify the user
    await base44.asServiceRole.entities.Notification.create({
      user_email: user.email,
      type: action === 'approve' ? 'escrow_accepted' : 'admin_action_required',
      title: action === 'approve'
        ? '✅ Your account has been approved'
        : `⚠️ Compliance Update: Your account has been ${mapping.account_status}`,
      message: action === 'approve'
        ? 'Your identity verification is complete. You can now create and fund escrow transactions.'
        : `Your account status has been updated to: ${mapping.account_status}. Please contact compliance@escropay.co.za for assistance.`,
      action_url: '/Profile'
    });

    return Response.json({ status: 'success', account_status: mapping.account_status });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});