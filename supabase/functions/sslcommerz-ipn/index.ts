// supabase/functions/sslcommerz-ipn/index.ts
// SSLCommerz IPN handler. Validates the transaction against SSLCommerz's
// validation API (never the browser redirect), checks the amount, and marks the
// payment verified. Idempotent: repeated IPNs for a verified payment are no-ops.
// Deploy: supabase functions deploy sslcommerz-ipn
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  try {
    const body = await req.formData();
    const valId = String(body.get('val_id') ?? '');
    const status = String(body.get('status') ?? '');
    const tranId = String(body.get('tran_id') ?? '');
    const amountRaw = String(body.get('amount') ?? '0');

    if (!valId || !tranId) return new Response('Missing val_id or tran_id', { status: 400 });

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: payment } = await admin
      .from('payments')
      .select('id, amount, status')
      .eq('id', tranId)
      .maybeSingle();

    if (!payment) return new Response('Unknown transaction', { status: 404 });
    if (payment.status === 'verified') return new Response('OK (already verified)');

    // Server-side validation against SSLCommerz. The redirect alone is not trusted.
    const isLive = Deno.env.get('SSLCOMMERZ_IS_LIVE') === 'true';
    const base = isLive ? 'https://securepay.sslcommerz.com' : 'https://sandbox.sslcommerz.com';
    const verifyUrl =
      `${base}/validator/api/validationserverAPI.php?val_id=${encodeURIComponent(valId)}` +
      `&store_id=${encodeURIComponent(Deno.env.get('SSLCOMMERZ_STORE_ID')!)}` +
      `&store_passwd=${encodeURIComponent(Deno.env.get('SSLCOMMERZ_STORE_PASSWORD')!)}` +
      `&format=json`;

    const verifyRes = await fetch(verifyUrl);
    const verified = await verifyRes.json();

    const isValid =
      verified?.status === 'VALID' || verified?.status === 'VALIDATED';
    const sameAmount = Math.abs(Number(verified?.amount ?? 0) - Number(payment.amount)) < 0.01;

    if (status === 'VALID' && isValid && sameAmount) {
      // Marking verified fires the payments_on_change trigger, which updates the
      // fee record, activates the enrollment, or grants product download access.
      await admin
        .from('payments')
        .update({
          status: 'verified',
          trx_id: verified?.bank_tran_id ?? valId,
          paid_at: verified?.tran_date ? new Date(verified.tran_date).toISOString() : new Date().toISOString(),
          raw: verified,
        })
        .eq('id', payment.id);
    }

    return new Response('OK');
  } catch (error) {
    console.error('IPN error', error);
    return new Response('IPN processing error', { status: 500 });
  }
});
