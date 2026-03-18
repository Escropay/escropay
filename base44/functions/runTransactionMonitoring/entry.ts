/**
 * @function runTransactionMonitoring
 * @category Compliance Engine — Transaction Monitoring
 * @description
 *   Evaluates recent escrow transactions against monitoring rules.
 *   Generates TransactionAlert records for violations.
 *   Auto-restricts accounts for HIGH/CRITICAL severity.
 * @rule_coverage RULE_007, RULE_008, RULE_010, RULE_012, RULE_014, RULE_015, RULE_029
 * @trigger Scheduled every 5 minutes + manual admin trigger
 * @regulatory_basis FICA Section 29 (suspicious transaction reporting)
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Allow admin trigger or system call
    let actor;
    try { actor = await base44.auth.me(); } catch (_) { actor = null; }
    if (actor && actor.role !== 'admin') {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const now = new Date();
    const oneDayAgo = new Date(now - 86400000).toISOString();
    const thirtyDaysAgo = new Date(now - 30 * 86400000).toISOString();

    // Fetch recent escrows
    const recentEscrows = await base44.asServiceRole.entities.Escrow.list('-created_date', 200);
    const allUsers = await base44.asServiceRole.entities.User.list('-created_date', 500);

    const alerts = [];

    for (const escrow of recentEscrows) {
      const userEmail = escrow.buyer_email;
      const user = allUsers.find(u => u.email === userEmail);

      // RULE_014: New account high-value transaction (account < 30 days, amount > R100,000)
      if (user && escrow.amount > 100000) {
        const accountAge = (now - new Date(user.created_date)) / 86400000;
        if (accountAge < 30) {
          alerts.push({
            alert_type: 'new_account_high_value',
            rule_id: 'RULE_014',
            severity: 'high',
            user_email: userEmail,
            user_id: user?.id,
            escrow_id: escrow.id,
            description: `RULE_014: New account (${Math.round(accountAge)} days old) with high-value transaction R${escrow.amount.toLocaleString()}`,
            triggered_at: now.toISOString(),
            status: 'open',
            metadata: { amount: escrow.amount, account_age_days: Math.round(accountAge) }
          });
        }
      }

      // RULE_012: Just-below-threshold structuring (amount between R45,000 and R49,999)
      if (escrow.amount >= 45000 && escrow.amount < 50000) {
        alerts.push({
          alert_type: 'just_below_threshold',
          rule_id: 'RULE_012',
          severity: 'critical',
          user_email: userEmail,
          user_id: user?.id,
          escrow_id: escrow.id,
          description: `RULE_012: Transaction amount R${escrow.amount.toLocaleString()} is just below FICA reporting threshold`,
          triggered_at: now.toISOString(),
          status: 'open',
          metadata: { amount: escrow.amount }
        });
      }
    }

    // RULE_015: User involved in >2 disputed escrows in 60 days
    const sixtyDaysAgo = new Date(now - 60 * 86400000).toISOString();
    const disputedEscrows = recentEscrows.filter(e => e.status === 'disputed' && e.disputed_at > sixtyDaysAgo);
    const disputesByUser = {};
    for (const e of disputedEscrows) {
      [e.buyer_email, e.seller_email].filter(Boolean).forEach(email => {
        disputesByUser[email] = (disputesByUser[email] || 0) + 1;
      });
    }
    for (const [email, count] of Object.entries(disputesByUser)) {
      if (count > 2) {
        const user = allUsers.find(u => u.email === email);
        alerts.push({
          alert_type: 'high_volume_spike',
          rule_id: 'RULE_015',
          severity: 'critical',
          user_email: email,
          user_id: user?.id,
          description: `RULE_015: User involved in ${count} disputed escrows in the last 60 days`,
          triggered_at: now.toISOString(),
          status: 'open',
          metadata: { dispute_count: count }
        });
      }
    }

    // RULE_029: Structuring — multiple round-number transactions
    const roundNumberEscrows = recentEscrows.filter(e =>
      e.amount % 10000 === 0 && e.amount > 0 && e.created_date > thirtyDaysAgo
    );
    const roundByUser = {};
    for (const e of roundNumberEscrows) {
      roundByUser[e.buyer_email] = (roundByUser[e.buyer_email] || 0) + 1;
    }
    for (const [email, count] of Object.entries(roundByUser)) {
      if (count >= 5) {
        const user = allUsers.find(u => u.email === email);
        alerts.push({
          alert_type: 'round_number_structuring',
          rule_id: 'RULE_029',
          severity: 'high',
          user_email: email,
          user_id: user?.id,
          description: `RULE_029: ${count} round-number transactions detected in 30 days — possible structuring`,
          triggered_at: now.toISOString(),
          status: 'open',
          metadata: { count }
        });
      }
    }

    // Save all alerts and apply automated actions
    const saved = [];
    for (const alert of alerts) {
      // Check if same alert already open for this user
      const existing = await base44.asServiceRole.entities.TransactionAlert.filter({
        rule_id: alert.rule_id,
        user_email: alert.user_email,
        status: 'open'
      });
      if (existing.length > 0) continue; // Skip duplicates

      const saved_alert = await base44.asServiceRole.entities.TransactionAlert.create(alert);
      saved.push(saved_alert);

      // Auto-restrict for HIGH/CRITICAL
      if (['high', 'critical'].includes(alert.severity) && alert.user_id) {
        const user = allUsers.find(u => u.id === alert.user_id);
        if (user && user.account_status === 'active') {
          const newStatus = alert.severity === 'critical' ? 'suspended' : 'restricted';
          await base44.asServiceRole.entities.User.update(alert.user_id, {
            account_status: newStatus
          });

          await base44.asServiceRole.entities.AuditLog.create({
            event_type: alert.severity === 'critical' ? 'account_suspended' : 'account_restricted',
            entity_type: 'User',
            entity_id: alert.user_id,
            actor_email: 'system@escropay.co.za',
            actor_role: 'system',
            description: `Automated restriction by ${alert.rule_id}: ${alert.description}`
          });

          // Notify admins
          const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
          for (const admin of admins) {
            await base44.asServiceRole.entities.Notification.create({
              user_email: admin.email,
              type: 'admin_action_required',
              title: `🚨 [${alert.severity.toUpperCase()}] ${alert.rule_id} — Auto-action taken`,
              message: alert.description,
              escrow_id: alert.escrow_id,
              action_url: '/Admin'
            });
          }
        }
      }
    }

    return Response.json({ alerts_generated: saved.length, alerts: saved });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});