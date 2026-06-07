import { NextRequest, NextResponse } from 'next/server';
import { verifyVercelToken } from '@/lib/vercel-auth';
import { kv } from '@vercel/kv';

// 1. UPSERT INSTALLATION (Called when user clicks "Install")
export async function PUT(
  req: NextRequest,
  { params }: { params: { installationId: string } }
) {
  if (!(await verifyVercelToken(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { installationId } = params;
  const body = await req.json();
  const { credentials, account } = body;

  // Save the Vercel access token to your database so you can use it later
  await kv.set(`install:${installationId}`, {
    accessToken: credentials.access_token,
    accountName: account.name,
    contactEmail: account.contact.email,
    status: 'active'
  });

  return NextResponse.json({ success: true });
}

// 2. DELETE INSTALLATION (Called when user clicks "Uninstall")
export async function DELETE(
  req: NextRequest,
  { params }: { params: { installationId: string } }
) {
  if (!(await verifyVercelToken(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { installationId } = params;
  
  // Clean up MXroute accounts and delete the Vercel token
  await kv.del(`install:${installationId}`);
  
  // Returning finalized: true tells Vercel it can delete the installation immediately
  return NextResponse.json({ finalized: true }); 
}
