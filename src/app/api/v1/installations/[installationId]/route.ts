import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

// PUT: Called when user clicks "Install" in Vercel Marketplace
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ installationId: string }> } // <-- Added Promise
) {
  const { installationId } = await params; // <-- Awaited params
  const body = await req.json();
  
  // Vercel sends the access token in the body
  const accessToken = body.credentials?.access_token || body.access_token;

  // Save the token to your Vercel KV database
  await kv.set(`install:${installationId}`, {
    accessToken,
    status: 'active',
    installedAt: new Date().toISOString(),
  });

  return NextResponse.json({ success: true });
}

// DELETE: Called when user clicks "Uninstall"
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ installationId: string }> } // <-- Added Promise
) {
  const { installationId } = await params; // <-- Awaited params
  await kv.del(`install:${installationId}`);
  
  // Returning finalized: true tells Vercel to delete the installation immediately
  return NextResponse.json({ finalized: true }); 
}