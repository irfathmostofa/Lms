import Link from 'next/link';
import { Card, CardBody } from '@/components/ui';
import { getRequestDictionary } from '@/lib/locale';

export default function PaymentFailedPage({
  searchParams,
}: {
  searchParams: { payment?: string };
}) {
  const dict = getRequestDictionary();
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardBody className="space-y-4 p-6 text-center">
          <h1 className="text-lg font-semibold text-slate-900">{dict.payment.failed}</h1>
          <p className="text-sm text-slate-600">{dict.payment.failedBody}</p>
          {searchParams.payment ? (
            <p className="font-mono text-xs text-slate-400">
              {dict.payment.reference.replace('{id}', searchParams.payment)}
            </p>
          ) : null}
          <Link href="/dashboard/my-fees" className="text-sm text-brand-600 hover:underline">
            {dict.payment.backFees}
          </Link>
        </CardBody>
      </Card>
    </main>
  );
}
