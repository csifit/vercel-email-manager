// src/app/api/delete-email/route.ts
import { NextResponse } from 'next/server';
import { provisionMXrouteEmail } from '@/lib/mxroute-client';
import { createClient } from '@/lib/supabase/server';

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { email } = await req.json();

    // Verify ownership
    const { data: account } = await supabase
      .from('email_accounts')
      .select('id, domain')
      .eq('email_address', email)
      .eq('user_id', user.id)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 });
    }

    // Delete from MXroute
    const [prefix, domain] = email.split('@');
    const delRes = await fetch(
      `https://api.mxroute.com/domains/${domain}/email-accounts/${prefix}`,
      {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'X-Server': process.env.MXROUTE_SERVER || '',
          'X-Username': process.env.MXROUTE_USERNAME || '',
          'X-API-Key': process.env.MXROUTE_API_KEY || '',
        },
      }
    );

    if (!delRes.ok) {
      throw new Error(`MXroute delete failed: ${await delRes.text()}`);
    }

    // Delete from DB
    await supabase
      .from('email_accounts')
      .update({ status: 'deleted' })
      .eq('id', account.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}