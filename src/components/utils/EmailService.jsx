import { base44 } from '@/api/base44Client';

const LOGO_URL = "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/69918ad956166c66b33e2ffc/048c9dd05_EscroPay-Brand-Logo2.png";

// Email templates
const getEmailTemplate = (content, title) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); padding: 30px; text-align: center; }
    .header img { height: 40px; }
    .content { padding: 40px 30px; }
    .footer { background: #f9fafb; padding: 20px 30px; text-align: center; font-size: 12px; color: #6b7280; }
    .button { display: inline-block; background: #9333ea; color: white !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .info-box { background: #f3f4f6; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .amount { font-size: 32px; font-weight: bold; color: #9333ea; }
    h1 { color: #111827; margin-bottom: 10px; }
    p { color: #4b5563; line-height: 1.6; }
    .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-funded { background: #cffafe; color: #0e7490; }
    .status-released { background: #d1fae5; color: #065f46; }
    .status-disputed { background: #fee2e2; color: #991b1b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="${LOGO_URL}" alt="Escropay" />
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p style="margin: 0 0 10px 0;">Escropay Financial Services (Pty) Ltd</p>
      <p style="margin: 0 0 10px 0;">CIPC: 2026/128185/07</p>
      <p style="margin: 0;">This email was sent by Escropay. If you have questions, contact us at info@escropay.app</p>
    </div>
  </div>
</body>
</html>
`;

export const EmailService = {
  // Welcome email for new users
  async sendWelcomeEmail(userEmail, userName) {
    const content = `
      <h1>Welcome to Escropay, ${userName || 'there'}! 🎉</h1>
      <p>Thank you for joining Escropay, your trusted partner for secure escrow transactions.</p>
      <p>With Escropay, you can:</p>
      <ul style="color: #4b5563; line-height: 2;">
        <li>Create secure escrow agreements</li>
        <li>Protect both buyers and sellers</li>
        <li>Resolve disputes fairly</li>
        <li>Track transactions in real-time</li>
      </ul>
      <p>To get started, complete your KYC verification to unlock all features.</p>
      <a href="https://escropay.app" class="button">Go to Dashboard</a>
      <p style="font-size: 14px; color: #9ca3af;">Need help? Contact us at info@escropay.app</p>
    `;

    return base44.integrations.Core.SendEmail({
      to: userEmail,
      subject: 'Welcome to Escropay - Secure Escrow Platform',
      body: getEmailTemplate(content, 'Welcome to Escropay'),
      from_name: 'Escropay'
    });
  },

  // Escrow created notification
  async sendEscrowCreatedEmail(escrow, recipientType) {
    const isBuyer = recipientType === 'buyer';
    const recipientEmail = isBuyer ? escrow.buyer_email : escrow.seller_email;
    const recipientName = isBuyer ? escrow.buyer_name : escrow.seller_name;
    const otherParty = isBuyer 
      ? (escrow.seller_name || escrow.seller_email)
      : (escrow.buyer_name || escrow.buyer_email);

    const content = `
      <h1>New Escrow Created</h1>
      <p>Hi ${recipientName || 'there'},</p>
      <p>${isBuyer ? 'You have created a new escrow' : 'A new escrow has been created for you'} with the following details:</p>
      
      <div class="info-box">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #111827;">${escrow.title}</p>
        <div class="amount">R ${escrow.amount?.toLocaleString()}</div>
        <p style="margin: 10px 0 0 0; color: #6b7280;">
          ${isBuyer ? 'Seller' : 'Buyer'}: ${otherParty}
        </p>
        ${escrow.due_date ? `<p style="margin: 5px 0 0 0; color: #6b7280;">Due: ${escrow.due_date}</p>` : ''}
      </div>
      
      <p>${isBuyer 
        ? 'Please fund this escrow to proceed with the transaction.' 
        : 'The buyer will fund this escrow. You will be notified once the funds are received.'
      }</p>
      
      <a href="https://escropay.app" class="button">View Escrow</a>
    `;

    return base44.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `New Escrow: ${escrow.title} - R ${escrow.amount?.toLocaleString()}`,
      body: getEmailTemplate(content, 'New Escrow Created'),
      from_name: 'Escropay'
    });
  },

  // Escrow funded notification
  async sendEscrowFundedEmail(escrow, recipientType) {
    const isBuyer = recipientType === 'buyer';
    const recipientEmail = isBuyer ? escrow.buyer_email : escrow.seller_email;
    const recipientName = isBuyer ? escrow.buyer_name : escrow.seller_name;

    const content = `
      <h1>Escrow Funded <span class="status-badge status-funded">Funded</span></h1>
      <p>Hi ${recipientName || 'there'},</p>
      <p>Great news! The escrow "${escrow.title}" has been successfully funded.</p>
      
      <div class="info-box">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #111827;">${escrow.title}</p>
        <div class="amount">R ${escrow.amount?.toLocaleString()}</div>
        <p style="margin: 10px 0 0 0; color: #059669; font-weight: 500;">✓ Funds secured in escrow</p>
      </div>
      
      <p>${isBuyer 
        ? 'The seller can now proceed with the delivery. Once you receive and verify the goods/services, you can release the funds.' 
        : 'You can now proceed with delivering the goods/services. The buyer will release the funds upon satisfaction.'
      }</p>
      
      <a href="https://escropay.app" class="button">View Transaction</a>
    `;

    return base44.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `Escrow Funded: ${escrow.title}`,
      body: getEmailTemplate(content, 'Escrow Funded'),
      from_name: 'Escropay'
    });
  },

  // Escrow released notification
  async sendEscrowReleasedEmail(escrow, recipientType) {
    const isBuyer = recipientType === 'buyer';
    const recipientEmail = isBuyer ? escrow.buyer_email : escrow.seller_email;
    const recipientName = isBuyer ? escrow.buyer_name : escrow.seller_name;

    const content = `
      <h1>Funds Released <span class="status-badge status-released">Completed</span></h1>
      <p>Hi ${recipientName || 'there'},</p>
      <p>${isBuyer 
        ? 'You have successfully released the funds for the escrow.' 
        : 'Great news! The funds have been released to you.'
      }</p>
      
      <div class="info-box">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #111827;">${escrow.title}</p>
        <div class="amount">R ${escrow.amount?.toLocaleString()}</div>
        <p style="margin: 10px 0 0 0; color: #059669; font-weight: 500;">✓ Transaction completed successfully</p>
      </div>
      
      <p>${isBuyer 
        ? 'Thank you for using Escropay. We hope you had a great experience!' 
        : 'The funds will be transferred to your registered bank account within 1-3 business days.'
      }</p>
      
      <a href="https://escropay.app" class="button">View Details</a>
    `;

    return base44.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `Funds Released: ${escrow.title}`,
      body: getEmailTemplate(content, 'Funds Released'),
      from_name: 'Escropay'
    });
  },

  // Dispute notification
  async sendDisputeEmail(escrow, recipientType) {
    const isBuyer = recipientType === 'buyer';
    const recipientEmail = isBuyer ? escrow.buyer_email : escrow.seller_email;
    const recipientName = isBuyer ? escrow.buyer_name : escrow.seller_name;

    const content = `
      <h1>Dispute Raised <span class="status-badge status-disputed">Disputed</span></h1>
      <p>Hi ${recipientName || 'there'},</p>
      <p>A dispute has been raised on the escrow "${escrow.title}".</p>
      
      <div class="info-box">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #111827;">${escrow.title}</p>
        <div class="amount">R ${escrow.amount?.toLocaleString()}</div>
        ${escrow.dispute_reason ? `<p style="margin: 10px 0 0 0; color: #dc2626;">Reason: ${escrow.dispute_reason}</p>` : ''}
        <p style="margin: 10px 0 0 0; color: #dc2626; font-weight: 500;">⚠️ Funds are now frozen</p>
      </div>
      
      <p>Our dispute resolution team will review the case. You may be asked to provide evidence supporting your position.</p>
      
      <a href="https://escropay.app" class="button">View Dispute</a>
      
      <p style="font-size: 14px; color: #9ca3af;">Need assistance? Contact us at disputes@escropay.app</p>
    `;

    return base44.integrations.Core.SendEmail({
      to: recipientEmail,
      subject: `Dispute Alert: ${escrow.title}`,
      body: getEmailTemplate(content, 'Dispute Raised'),
      from_name: 'Escropay'
    });
  },

  // Escrow invitation to recipient (seller)
  async sendEscrowInvitationEmail(escrow) {
    const escrowLink = `${window.location.origin}${window.location.pathname.split('/').slice(0, -1).join('/')}/#/EscrowView?id=${escrow.id}`;
    const sellerName = escrow.seller_name || 'there';
    const buyerName = escrow.buyer_name || escrow.buyer_email;

    const content = `
      <h1>You've Been Invited to an Escrow Agreement</h1>
      <p>Hi ${sellerName},</p>
      <p><strong>${buyerName}</strong> has initiated a secure escrow transaction and invited you to participate.</p>
      
      <div class="info-box">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: #111827;">${escrow.title}</p>
        <div class="amount">R ${escrow.amount?.toLocaleString()}</div>
        ${escrow.description ? `<p style="margin: 10px 0 0 0; color: #6b7280;">${escrow.description}</p>` : ''}
        ${escrow.due_date ? `<p style="margin: 5px 0 0 0; color: #6b7280;">Due: ${escrow.due_date}</p>` : ''}
        <p style="margin: 10px 0 0 0; color: #059669; font-weight: 500;">🔒 Funds will be held securely until you deliver</p>
      </div>
      
      <p>As the seller, you will need to:</p>
      <ol style="color: #4b5563; line-height: 2;">
        <li>Accept the escrow agreement</li>
        <li>Submit your banking details for fund disbursement</li>
        <li>Deliver the goods or services as agreed</li>
        <li>Receive payment once the buyer confirms delivery</li>
      </ol>

      <p style="margin-top: 24px;">
        <a href="${escrowLink}" class="button">View & Accept Escrow</a>
      </p>

      <p style="font-size: 13px; color: #9ca3af; margin-top: 16px;">
        If you don't have an EscroPay account, you'll be prompted to create one for free.<br/>
        Questions? Contact us at info@escropay.app
      </p>
    `;

    return base44.integrations.Core.SendEmail({
      to: escrow.seller_email,
      subject: `You're invited to an escrow agreement: ${escrow.title}`,
      body: getEmailTemplate(content, 'Escrow Invitation'),
      from_name: 'Escropay'
    });
  },

  // KYC verification reminder
  async sendKycReminderEmail(userEmail, userName) {
    const content = `
      <h1>Complete Your KYC Verification</h1>
      <p>Hi ${userName || 'there'},</p>
      <p>To unlock all features on Escropay and ensure secure transactions, please complete your KYC (Know Your Customer) verification.</p>
      
      <div class="info-box">
        <p style="margin: 0; font-weight: 600; color: #111827;">What you'll need:</p>
        <ul style="color: #4b5563; margin: 10px 0 0 0; padding-left: 20px;">
          <li>Valid South African ID, passport, or driver's license</li>
          <li>Proof of address (utility bill or bank statement, not older than 3 months)</li>
        </ul>
      </div>
      
      <p>KYC verification helps us protect all users and comply with South African financial regulations.</p>
      
      <a href="https://escropay.app" class="button">Complete Verification</a>
    `;

    return base44.integrations.Core.SendEmail({
      to: userEmail,
      subject: 'Action Required: Complete Your KYC Verification',
      body: getEmailTemplate(content, 'KYC Verification'),
      from_name: 'Escropay'
    });
  }
};

export default EmailService;