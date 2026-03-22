import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  try {
    if (!RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set');
      return Response.json({ error: 'Email service not configured' }, { status: 503 });
    }

    // Require authenticated caller — prevents unauthenticated email abuse
    const base44 = createClientFromRequest(req);
    const caller = await base44.auth.me().catch(() => null);
    if (!caller) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { to, subject, body, from_name } = await req.json();

    if (!to || !subject || !body) {
      return Response.json({ error: 'Missing required fields: to, subject, body' }, { status: 400 });
    }

    // Basic email format validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
      return Response.json({ error: 'Invalid recipient email' }, { status: 400 });
    }

    const fromName = from_name || 'Escropay';
    const fromEmail = `${fromName} <noreply@escropay.app>`;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html: body,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Resend error:', data);
      return Response.json({ error: data?.message || 'Failed to send email' }, { status: res.status });
    }

    return Response.json({ success: true, id: data?.id });
  } catch (error) {
    console.error('sendEmail error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});