// Payments — first-party manual + Stripe env hook.
// If STRIPE_SECRET_KEY set, create Checkout Session via Stripe SDK; otherwise record manual.
export function stripeEnabled(): boolean { return !!process.env.STRIPE_SECRET_KEY; }

export async function createStripeCheckout(amount: number, currency = "inr", invoiceId?: string): Promise<{ url: string } | null> {
  if (!stripeEnabled()) return null;
  try {
    // Lazy so `npm i stripe` only needed when STRIPE_SECRET_KEY set
    // @ts-ignore — optional dep
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, { apiVersion: "2024-11-20.acacia" } as never);
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price_data: { currency, product_data: { name: invoiceId ? `Invoice ${invoiceId}` : "Payment" }, unit_amount: Math.round(amount*100) }, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/billing?paid=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/billing?cancel=1`,
    });
    return { url: session.url! };
  } catch (e) { console.error("[payments:stripe] failed", e); return null; }
}
