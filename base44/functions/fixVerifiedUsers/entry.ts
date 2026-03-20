import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (user?.role !== 'admin') {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const users = await base44.asServiceRole.entities.User.list();
  let updated = 0;

  for (const u of users) {
    if (u.kyc_status === 'verified' && u.account_status !== 'active') {
      await base44.asServiceRole.entities.User.update(u.id, { account_status: 'active' });
      updated++;
    }
  }

  return Response.json({ message: `Updated ${updated} users to account_status: active` });
});