import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import { createClient } from 'supabase/server';

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = req.nextUrl.searchParams.get('token');
  const email = req.nextUrl.searchParams.get('email');

  if (!token || !email) {
    return NextResponse.json(
      { error: 'Missing token or email parameter' },
      { status: 400 }
    );
  }

  try {
    const { data: emailAccount } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('user_id', user.id)
      .eq('email_address', email)
      .single();

    if (!emailAccount) {
      return NextResponse.json(
        { error: 'Email not found or not authorized' },
        { status: 403 }
      );
    }

    const credentialsKey = `creds:${email}:${token}`;
    const credentials = await kv.get(credentialsKey);

    if (!credentials) {
      return NextResponse.json(
        { error: 'Token expired or invalid' },
        { status: 401 }
      );
    }

    await kv.del(credentialsKey);

    return NextResponse.json({
      email: credentials.email,
      password: credentials.password,
      smtp: {
        host: credentials.smtpHost,
        port: credentials.smtpPort,
        user: credentials.email,
        pass: credentials.password,
      },
      imap: {
        host: credentials.serverNode,
        port: 993,
        user: credentials.email,
        pass: credentials.password,
      },
      webmail: `https://${credentials.serverNode}:2096/`,
    });
  } catch (error: any) {
    console.error('Credential retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve credentials', details: error.message },
      { status: 500 }
    );
  }
}
