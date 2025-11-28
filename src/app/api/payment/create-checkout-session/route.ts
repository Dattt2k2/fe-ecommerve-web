import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

const stripe = new Stripe(STRIPE_SECRET_KEY || '', {});

// POST /api/payment/create-checkout-session
export async function POST(request: NextRequest) {
  try {
    console.log('[API] create-checkout-session called');

    if (!STRIPE_SECRET_KEY) {
      console.error('[API] Stripe configuration missing');
      return NextResponse.json(
        { error: 'Stripe configuration missing' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { orderId, amount, email, items } = body;

    console.log('[API] Request body:', { orderId, amount, email, itemsCount: items?.length });
    console.log('[API] orderId type:', typeof orderId, 'value:', orderId);
    console.log('[API] amount type:', typeof amount, 'value:', amount);

    if (orderId === null || orderId === undefined || amount === null || amount === undefined) {
      return NextResponse.json(
        { error: 'orderId and amount are required' },
        { status: 400 }
      );
    }

    // Create line items for Stripe session
    const lineItems = items && Array.isArray(items) && items.length > 0
      ? items.map((item: any) => ({
          price_data: {
            currency: 'vnd',
            product_data: {
              name: item.name || 'Product',
              description: item.description,
              metadata: {
                product_id: item.product_id,
              },
            },
            unit_amount: Math.round(item.price),
          },
          quantity: item.quantity || 1,
        }))
      : [
          {
            price_data: {
              currency: 'vnd',
              product_data: {
                name: 'Order Payment',
              },
              unit_amount: Math.round(amount),
            },
            quantity: 1,
          },
        ];

    console.log('[API] Creating checkout session with:', {
      line_items_count: lineItems.length,
      total_amount: amount,
    });

    // Get frontend URL (use NEXT_PUBLIC_SITE_URL for frontend, NEXT_PUBLIC_API_URL is for backend)
    const frontendUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
    console.log('[API] Using frontend URL:', frontendUrl);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${frontendUrl}/my-orders`,
      cancel_url: `${frontendUrl}/order?productId=${orderId}`,
      metadata: {
        order_id: orderId,
        email: email || '',
      },
      customer_email: email,
    });

    console.log('[API] Checkout session created:', {
      id: session.id,
      url: !!session.url,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('[API] Checkout session error:', {
      message: error.message,
      type: error.type,
      statusCode: error.statusCode,
    });
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
