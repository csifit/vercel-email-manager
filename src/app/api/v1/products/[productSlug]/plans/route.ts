import { NextResponse } from 'next/server';

export async function GET() {
  const plans = [
    {
      id: 'free-tier',
      name: 'Free Email Forwarding',
      cost: 'Free',
      description: 'Basic email routing for your Vercel domains.',
      paymentMethodRequired: false,
    }
  ];

  return NextResponse.json({ plans });
}