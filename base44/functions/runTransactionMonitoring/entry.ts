/**
 * @function runTransactionMonitoring
 * @description Lightweight transaction monitoring — checks key AML rules efficiently.
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30 * 86400000).toISOString();
    const sixtyDaysAgo = new Date(now - 60 * 86400000).toISOString();

    // Fetch data once — keep limits low to stay within CPU budget
    const [recentEscrows, allUsers, openAlerts, admins] = await Promise.all([
      base44.asServiceRole.entities.Escrow.list('-created_date', 100),
      base44.asServiceRole.entities.User.list('-created_date', 200),
      base44.asServiceRole.entities.TransactionAlert.filter({ status: 'open' }),
      base44.asServiceRole.entities.User.filter({ role: 'admin' }),
    ]);

    // Build lookup maps
    const userMap = Object.fromEntries(allUsers.map(u => [u.email, u]));

    // Build set of already-open alerts (rule_id + user_email) to skip duplicates
    const openAlertKeys = new Set(openAlerts.map(a => `${a.rule_id}::${a.user_email}`));

    const alerts = [];

    // ── RULE_014: New account + high-value transaction ─────────────────────
    for (const escrow of recentEscrows) {
      const user = userMap[escrow.buyer_email];
      if (!user || escrow.amount <= 100000) continue;
      const accountAgeDays = (now - new Date(user.created_date)) / 86400000;
      if (accountAgeDays < 30) {
        alerts.push({
          alert_type: 'new_account_high_value',
          rule_id: 'RULE_014',
          severity: 'high',
          user_email: escrow.buyer_email,
          user_id: user.id,
          escrow_id: escrow.id,
          description: `RULE_014: New account (${Math.round(accountAgeDays)} days) with high-value transaction R${escrow.amount.toLocaleString()}`,
          triggered_at: now.toISOString(),
          status: 'open',
          metadata: { amount: escrow.amount, account_age_days: Math.round(accountAgeDays) }
        });
      }
    }

    // ── RULE_012: Just-below-threshold structuring ─────────────────────────
    for (const escrow of recentEscrows) {
      if (escrow.amount >= 45000 && escrow.amount < 50000) {
        const user = userMap[escrow.buyer_email];
        alerts.push({
          alert_type: 'just_below_threshold',
          rule_id: 'RULE_012',
          severity: 'critical',
          user_email: escrow.buyer_email,
          user_id: user?.id,
          escrow_id: escrow.id,
          description: `RULE_012: Transaction R${escrow.amount.toLocaleString()} just below FICA reporting threshold`,
          triggered_at: now.toISOString(),
          status: 'open',
          metadata: { amount: escrow.amount }
        });
      }
    }

    // ── RULE_015: High dispute count (>2 in 60 days) ──────────────────────
    const disputesByUser = {};
    for (const e of recentEscrows) {
      if (e.status !== 'disputed' || !e.disputed_at || e.disputed_at < sixtyDaysAgo) continue;
      for (const email of [e.buyer_email, e.seller_email].filter(Boolean)) {
        disputesByUser[email] = (disputesByUser[email] || 0) + 1;
      }
    }
    for (const [email, count] of Object.entries(disputesByUser)) {
      if (count > 2) {
        const user = userMap[email];
        alerts.push({
          alert_type: 'high_volume_spike',
          rule_id: 'RULE_015',
          severity: 'critical',
          user_email: email,
          user_id: user?.id,
          description: `RULE_015: User in ${count} disputed escrows in 60 days`,
          triggered_at: now.toISOString(),
          status: 'open',
          metadata: { dispute_count: count }
        });
      }
    }

    // ── RULE_029: Round-number structuring (≥5 in 30 days) ────────────────
    const roundByUser = {};
    for (const e of recentEscrows) {
      if (e.amount % 10000 === 0 && e.amount > 0 && e.created_date > thirtyDaysAgo) {
        roundByUser[e.buyer_email] = (roundByUser[e.buyer_email] || 0) + 1;
      }
    }
    for (const [email, count] of Object.entries(roundByUser)) {
      if (count >= 5) {
        const user = userMap[email];
        alerts.push({
          alert_type: 'round_number_structuring',
          rule_id: 'RULE_029',
          severity: 'high',
          user_email: email,
          user_id: user?.id,
          description: `RULE_029: ${count} round-number transactions in 30 days — possible structuring`,
          triggered_at: now.toISOString(),
          status: 'open',
          metadata: { count }
        });
      }
    }

    // ── Save new alerts + automated actions ───────────────────────────────
    const savedAlerts = [];
    for (const alert of alerts) {
      const key = `${alert.rule_id}::${alert.user_email}`;
      if (openAlertKeys.has(key)) continue; // Skip duplicates

      const saved = await base44.asServiceRole.entities.TransactionAlert.create(alert);
      savedAlerts.push(saved);
      openAlertKeys.add(key); // Prevent duplicates within same run

      // Auto-restrict for HIGH/CRITICAL
      if (['high', 'critical'].includes(alert.severity) && alert.user_id) {
        const user = userMap[alert.user_email];
        if (user && user.account_status === 'active') {
          const newStatus = alert.severity === 'critical' ? 'suspended' : 'restricted';
          await base44.asServiceRole.entities.User.update(alert.user_id, { account_status: newStatus });
          await base44.asServiceRole.entities.AuditLog.create({
            event_type: alert.severity === 'critical' ? 'account_suspended' : 'account_restricted',
            entity_type: 'User',
            entity_id: alert.user_id,
            actor_email: 'system@escropay.co.za',
            actor_role: 'system',
            description: `Auto-restriction by ${alert.rule_id}: ${alert.description}`
          });
          // Notify admins
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

    return Response.json({ alerts_generated: savedAlerts.length });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});