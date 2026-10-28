import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { PageHeader } from '@/components/ui';
import { StoreGrid } from '@/components/dashboard/store-grid';
import type { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function StorePage() {
  const ctx = await requireUser();
  const supabase = createClient();

  const [productsRes, accessRes] = await Promise.all([
    supabase.from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }),
    supabase.from('product_access').select('product_id').eq('user_id', ctx.userId),
  ]);

  const products = (productsRes.data as Product[]) ?? [];
  const accessIds = ((accessRes.data as { product_id: string }[]) ?? []).map((row) => row.product_id);

  return (
    <>
      <PageHeader
        title="Store"
        description="Browse digital PDFs, printed books and tools. Add several items, then pay once from Cart."
      />
      <StoreGrid products={products} accessIds={accessIds} />
    </>
  );
}
