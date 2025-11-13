import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Initialize Stripe with any valid API version
const stripe = new Stripe(STRIPE_SECRET_KEY || '', {});

// POST /api/payment/create-payment-intent
export async function POST(request: NextRequest) {
  try {
    console.log('[API] create-payment-intent called');
    console.log('[API] STRIPE_SECRET_KEY exists:', !!STRIPE_SECRET_KEY);
    console.log('[API] STRIPE_SECRET_KEY format:', STRIPE_SECRET_KEY?.substring(0, 20) + '...');

    if (!STRIPE_SECRET_KEY) {
      console.error('[API] Stripe configuration missing');
      return NextResponse.json(
        { error: 'Stripe configuration missing' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { amount, orderId, email } = body;
    console.log('[API] Request body:', { amount, orderId, email });

    if (!amount || !orderId) {
      return NextResponse.json(
        { error: 'Amount and orderId are required' },
        { status: 400 }
      );
    }

    // Create Stripe PaymentIntent
    console.log('[API] Creating payment intent with:', { 
      amount: Math.round(amount * 100), 
      currency: 'vnd' 
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'vnd',
      metadata: {
        order_id: orderId,
        email: email || '',
      },
    });

    console.log('[API] Payment intent created:', {
      id: paymentIntent.id,
      status: paymentIntent.status,
      client_secret: !!paymentIntent.client_secret,
    });

    return NextResponse.json({
      id: paymentIntent.id,
      client_secret: paymentIntent.client_secret,
      publishable_key: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    });
  } catch (error: any) {
    console.error('[API] Payment intent error:', {
      message: error.message,
      type: error.type,
      statusCode: error.statusCode,
    });
    return NextResponse.json(
      { error: error.message || 'Failed to create payment intent' },
      { status: 500 }
    );
  }
}
