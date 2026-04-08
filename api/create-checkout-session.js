import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { user_id, plan = "monthly" } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  const plans = {
    monthly: { unit_amount: 800, interval: "month" },
    annual:  { unit_amount: 5999, interval: "year" },
  };

  if (!plans[plan]) {
    return res.status(400).json({ error: 'Invalid plan. Must be "monthly" or "annual".' });
  }

  const selected = plans[plan];

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      client_reference_id: user_id,
      metadata: { user_id },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            recurring: { interval: selected.interval },
            product_data: {
              name: 'Dream Shepherd',
              description: 'Unlimited AI Dream Interpretations',
            },
            unit_amount: selected.unit_amount,
          },
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}`,
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
