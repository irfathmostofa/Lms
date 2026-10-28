import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { requireUser } from '@/lib/auth';
import { ButtonLink } from '@/components/ui';
import { PdfReader } from '@/components/dashboard/pdf-reader';
import type { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function ResourceReaderPage({ params }: { params: { productId: string } }) {
  const ctx = await requireUser();
  const supabase = createClient();

  const [{ data: product }, { data: access }, { data: files }] = await Promise.all([
    supabase.from('products').select('*').eq('id', params.productId).maybeSingle(),
    supabase
      .from('product_access')
      .select('id')
      .eq('user_id', ctx.userId)
      .eq('product_id', params.productId)
      .maybeSingle(),
    supabase
      .from('product_files')
      .select('file_url, title')
      .eq('product_id', params.productId)
      .order('sort_order')
      .limit(1),
  ]);

  const resource = product as Product | null;
  if (!resource || resource.type !== 'digital') notFound();

  if (!access) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">{resource.name}</h1>
          <p className="mt-2 text-sm text-slate-500">
            Purchase this PDF first. After payment is verified, you can read and download it here.
          </p>
          <ButtonLink href="/dashboard/store" className="mt-5">
            Back to resources
          </ButtonLink>
        </div>
      </div>
    );
  }

  const fileUrl = files?.[0]?.file_url;
  if (!fileUrl) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
        <div className="max-w-md rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-lg font-semibold text-slate-900">{resource.name}</h1>
          <p className="mt-2 text-sm text-slate-500">
            You own this resource, but a PDF file has not been attached yet. Ask an admin to add the download URL.
          </p>
          <Link href="/dashboard/store" className="mt-5 inline-flex text-sm font-medium text-brand-600 hover:underline">
            Back to resources
          </Link>
        </div>
      </div>
    );
  }

  return <PdfReader title={resource.name} fileUrl={fileUrl} />;
}
