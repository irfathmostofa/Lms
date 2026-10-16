// supabase/functions/sslcommerz-init/index.ts
// Creates a pending payment then initializes an SSLCommerz session.
// Deploy: supabase functions deploy sslcommerz-init
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return json({ error: 'Unauthorized' }, 401);

    const { enrollment_id, order_id, amount } = await req.json();
    const numericAmount = Number(amount);
    if (!numericAmount || numericAmount <= 0) {
      return json({ error: 'Invalid amount' }, 400);
    }

    // Student-initiated payments always start pending. The status column is part
    // of the INSERT, and RLS requires it to be 'pending', so this cannot be forged.
    const { data: payment, error: insertError } = await supabase
      .from('payments')
      .insert({
        student_id: user.id,
        enrollment_id: enrollment_id ?? null,
        order_id: order_id ?? null,
        purpose: enrollment_id ? 'course' : 'store',
        gateway: 'sslcommerz',
        method: 'sslcommerz',
        amount: numericAmount,
        status: 'pending',
      })
      .select('id')
      .single();

    if (insertError) return json({ error: insertError.message }, 400);

    const isLive = Deno.env.get('SSLCOMMERZ_IS_LIVE') === 'true';
    const base = isLive
      ? 'https://securepay.sslcommerz.com'
      : 'https://sandbox.sslcommerz.com';
    const siteUrl = Deno.env.get('SITE_URL')!;

    const form = new URLSearchParams({
      store_id: Deno.env.get('SSLCOMMERZ_STORE_ID')!,
      store_passwd: Deno.env.get('SSLCOMMERZ_STORE_PASSWORD')!,
      total_amount: numericAmount.toFixed(2),
      currency: 'BDT',
      tran_id: payment.id,
      success_url: `${siteUrl}/payment/success?payment=${payment.id}`,
      fail_url: `${siteUrl}/payment/fail?payment=${payment.id}`,
      cancel_url: `${siteUrl}/payment/cancel?payment=${payment.id}`,
      cus_email: user.email ?? 'unknown@example.com',
      cus_name: user.user_metadata?.full_name ?? 'Student',
      product_name: enrollment_id ? 'Course enrollment' : 'Store order',
      product_category: 'education',
      product_profile: 'general',
      shipping_method: 'NO',
    });

    const response = await fetch(`${base}/gwprocess/v4/api.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    });
    const result = await response.json();

    if (!result?.GatewayPageURL) {
      return json({ error: 'Failed to start SSLCommerz session', detail: result }, 502);
    }

    await supabase.from('payments').update({ raw: result }).eq('id', payment.id);
    return json({ payment_id: payment.id, url: result.GatewayPageURL });
  } catch (error) {
    return json({ error: String(error) }, 500);
  }
});
