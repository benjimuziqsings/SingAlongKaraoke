
import { NextResponse, NextRequest } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-06-20',
});

export async function POST(req: NextRequest) {
  try {
    const { amount } = await req.json();
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    if (!amount || amount < 1) { // Stripe requires amount to be at least $0.50, but we'll set the minimum to $1.
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Tip for the KJ/Band',
              description: 'Thank you for supporting the show!',
            },
            unit_amount: Math.round(amount * 100), // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/home?tip_success=true`,
      cancel_url: `${origin}/home?tip_canceled=true`,
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    const error = err as Error;
    console.error('Error creating Stripe session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
