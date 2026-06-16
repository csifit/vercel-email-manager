//src/app/api/create-email/route.ts
import { NextResponse } from 'next/server';
import { provisionMXrouteEmail } from '@/lib/mxroute-client';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  // FIX: Await the createClient() function because it returns a Promise
  const supabase = await createClient();
  
  // 1. Verify user is logged in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { prefix, password } = await req.json();
    const domain = "maild.dev"; 

    if (!prefix || !password) {
      return NextResponse.json({ error: 'Prefix and password are required.' }, { status: 400 });
    }

    // 2. Provision on MXroute
    const result = await provisionMXrouteEmail(domain, prefix, password);

    // 3. Save to Supabase Database
    const { error: dbError } = await supabase
      .from('email_accounts')
      .insert({
        user_id: user.id,
        email_address: result.email,
        server_node: result.serverNode,
      });

    if (dbError) {
      console.error('Database insert error:', dbError);
      if (dbError.code === '23505') {
         return NextResponse.json({ error: 'This email address already exists.' }, { status: 400 });
      }
    }

    // 4. Return success to frontend
    return NextResponse.json({
      success: true,
      email: result.email,
      serverNode: result.serverNode,
      smtp: {
        host: result.smtpHost,
        port: result.smtpPort,
        user: result.email,
        pass: password,
      }
    });

  } 
  catch (error: any) {
  console.error('Create Email Error:', error);

  return NextResponse.json(
    {
      error: error?.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    },
    { status: 500 }
  );
  }
}