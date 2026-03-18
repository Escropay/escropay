/**
 * @function runOnboardingCompliance
 * @category Compliance Engine — Post-Onboarding Control Layer
 * @description
 *   Triggered after a user completes onboarding. Performs:
 *   1. Blacklist check (email, phone)
 *   2. Country risk assessment
 *   3. Initial risk score calculation
 *   4. Creates ComplianceRecord
 *   5. Sets account_status based on risk rating
 *   6. Writes AuditLog entries
 *   7. Notifies compliance admins
 * @regulatory_basis FICA, AML, CFT
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

// ─── Risk Configuration ────────────────────────────────────────────────────

const SANCTIONED_COUNTRIES = [
  'Burma', 'Myanmar', 'Iran', 'North Korea', 'Nicaragua',
  'Panama', 'Somalia', 'Syria', 'Yemen', 'Zimbabwe'
];

const ENHANCED_MONITORING_COUNTRIES = [
  'Hong Kong', 'Singapore', 'Malaysia', 'China'
];

const COUNTRY_RISK_SCORES = {
  'Burma': 10, 'Myanmar': 10, 'Iran': 10, 'North Korea': 10,
  'Nicaragua': 10, 'Panama': 10, 'Somalia': 10, 'Syria': 10,
  'Yemen': 10, 'Zimbabwe': 10,
  'Hong Kong': 6, 'Singapore': 5, 'Malaysia': 5, 'China': 7,
  'South Africa': 2, 'United Kingdom': 1, 'Germany': 1, 'United States': 2,
};

const INDUSTRY_RISK_SCORES = {
  'Crypto Asset Service Provider': 9, 'Online Gambling': 9,
  'Sports Betting': 8, 'Money Remittance': 8, 'Arms / Defence': 10,
  'Cannabis': 7, 'Adult Entertainment': 7, 'Real Estate': 4,
  'Technology': 2, 'Retail': 2,
};

const HIGH_RISK_SOF = ['cash', 'crypto', 'unknown', 'third_party'];

// ─── Risk Scoring Engine ───────────────────────────────────────────────────

function calculateRiskScore(user) {
  let totalScore = 0;
  const breakdown = {};

  // 1. Country Risk (weight: 25)
  const countryScore = COUNTRY_RISK_SCORES[user.country] ?? 3;
  const weightedCountry = (countryScore / 10) * 25;
  breakdown.country = { raw: countryScore, weighted: weightedCountry, value: user.country };
  totalScore += weightedCountry;

  // 2. PEP Status (weight: 20)
  const isPep = user.pep_declaration?.is_pep;
  const pepType = user.pep_declaration?.pep_type;
  const pepScore = isPep ? (pepType === 'FPEP' ? 10 : 8) : 0;
  const weightedPep = (pepScore / 10) * 20;
  breakdown.pep = { raw: pepScore, weighted: weightedPep, pep_type: pepType || 'none' };
  totalScore += weightedPep;

  // 3. Industry Risk (weight: 15)
  const industryScore = INDUSTRY_RISK_SCORES[user.industry] ?? 2;
  const weightedIndustry = (industryScore / 10) * 15;
  breakdown.industry = { raw: industryScore, weighted: weightedIndustry, value: user.industry };
  totalScore += weightedIndustry;

  // 4. Source of Funds (weight: 10)
  const sofScore = HIGH_RISK_SOF.includes(user.source_of_funds) ? 7 : 2;
  const weightedSof = (sofScore / 10) * 10;
  breakdown.source_of_funds = { raw: sofScore, weighted: weightedSof, value: user.source_of_funds };
  totalScore += weightedSof;

  // Determine Rating
  const rating = totalScore >= 60 ? 'PROHIBITED'
    : totalScore >= 40 ? 'HIGH'
    : totalScore >= 20 ? 'MEDIUM'
    : 'LOW';

  return { score: Math.round(totalScore), rating, breakdown };
}

function getCountryRisk(country) {
  if (SANCTIONED_COUNTRIES.includes(country)) return 'sanctioned';
  if (ENHANCED_MONITORING_COUNTRIES.includes(country)) return 'high';
  return 'low';
}

// ─── Main Handler ──────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // This function can be called from admin context for a specific user
    const { user_id, user_email } = await req.json();

    if (!user_id || !user_email) {
      return Response.json({ error: 'user_id and user_email required' }, { status: 400 });
    }

    // Fetch user data
    const users = await base44.asServiceRole.entities.User.filter({ id: user_id });
    if (!users.length) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }
    const user = users[0];

    // ── 1. Blacklist Check ────────────────────────────────────────────────
    const identifiersToCheck = [
      { type: 'email', value: user.email },
      { type: 'phone', value: user.phone },
    ].filter(i => i.value);

    let blacklistMatch = null;
    for (const id of identifiersToCheck) {
      const matches = await base44.asServiceRole.entities.Blacklist.filter({
        identifier_type: id.type,
        identifier_value: id.value,
        active: true
      });
      if (matches.length > 0) {
        blacklistMatch = matches[0];
        break;
      }
    }

    if (blacklistMatch) {
      // Block — mark account as blacklisted
      await base44.asServiceRole.entities.User.update(user_id, {
        account_status: 'blacklisted'
      });
      await base44.asServiceRole.entities.AuditLog.create({
        event_type: 'blacklist_match_found',
        entity_type: 'User',
        entity_id: user_id,
        actor_email: 'system@escropay.co.za',
        actor_role: 'system',
        description: `Blacklist match on ${blacklistMatch.identifier_type}: ${blacklistMatch.reason}`
      });
      return Response.json({ status: 'blacklisted', reason: blacklistMatch.reason });
    }

    // ── 2. Country Risk Assessment ────────────────────────────────────────
    const countryRisk = getCountryRisk(user.country);

    // ── 3. Risk Score Calculation ─────────────────────────────────────────
    const { score, rating, breakdown } = calculateRiskScore(user);

    // ── 4. Determine Account Status ───────────────────────────────────────
    let newAccountStatus;
    let eddRequired = false;
    if (rating === 'PROHIBITED' || countryRisk === 'sanctioned') {
      newAccountStatus = 'terminated';
    } else if (rating === 'HIGH' || countryRisk === 'high') {
      newAccountStatus = 'restricted';
      eddRequired = true;
    } else {
      // LOW / MEDIUM — activate after KYC docs submitted
      newAccountStatus = user.kyc_status === 'pending' || user.kyc_status === 'verified'
        ? 'pending_compliance_approval'
        : 'pending_compliance_approval';
    }

    // ── 5. Update User ────────────────────────────────────────────────────
    await base44.asServiceRole.entities.User.update(user_id, {
      account_status: newAccountStatus,
      risk_rating: rating,
      risk_score: score,
      country_risk: countryRisk,
    });

    // ── 6. Create / Update ComplianceRecord ───────────────────────────────
    const existing = await base44.asServiceRole.entities.ComplianceRecord.filter({ user_id });
    const complianceData = {
      user_id,
      user_email,
      cdd_status: rating === 'PROHIBITED' ? 'rejected' : eddRequired ? 'edd_required' : 'pending',
      edd_required: eddRequired,
      edd_reason: eddRequired ? `Risk rating: ${rating}, Country risk: ${countryRisk}` : '',
      risk_rating: rating,
      risk_score: score,
      risk_breakdown: breakdown,
      sanctions_status: 'not_run',
      pep_status: user.pep_declaration?.is_pep ? 'potential_match' : 'not_run',
      adverse_media_status: 'not_run',
      last_review_date: new Date().toISOString(),
    };

    if (existing.length > 0) {
      await base44.asServiceRole.entities.ComplianceRecord.update(existing[0].id, complianceData);
    } else {
      await base44.asServiceRole.entities.ComplianceRecord.create(complianceData);
    }

    // ── 7. AuditLog Entry ─────────────────────────────────────────────────
    await base44.asServiceRole.entities.AuditLog.create({
      event_type: 'risk_score_calculated',
      entity_type: 'User',
      entity_id: user_id,
      actor_email: 'system@escropay.co.za',
      actor_role: 'system',
      description: `Risk score: ${score} | Rating: ${rating} | Country risk: ${countryRisk} | Account status: ${newAccountStatus}`,
      after_state: { account_status: newAccountStatus, risk_rating: rating, risk_score: score }
    });

    // ── 8. Notify Admins if restricted/terminated/high-risk ───────────────
    if (['restricted', 'terminated', 'blacklisted'].includes(newAccountStatus) || eddRequired) {
      const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
      for (const admin of admins) {
        await base44.asServiceRole.entities.Notification.create({
          user_email: admin.email,
          type: 'admin_action_required',
          title: `🚨 Compliance Review Required — ${rating} Risk`,
          message: `User ${user_email} requires compliance review. Risk score: ${score}, Status: ${newAccountStatus}`,
          action_url: '/Admin'
        });
      }
    }

    return Response.json({
      status: 'success',
      account_status: newAccountStatus,
      risk_rating: rating,
      risk_score: score,
      edd_required: eddRequired,
      country_risk: countryRisk
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});