import Link from 'next/link';
import { ButtonLink, Card, CardBody } from '@/components/ui';
import { getRequestDictionary } from '@/lib/locale';

export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { payment?: string };
}) {
  const dict = getRequestDictionary();
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardBody className="space-y-4 p-6 text-center">
          <h1 className="text-lg font-semibold text-slate-900">{dict.payment.received}</h1>
          <p className="text-sm text-slate-600">{dict.payment.receivedBody}</p>
          {searchParams.payment ? (
            <p className="font-mono text-xs text-slate-400">
              {dict.payment.reference.replace('{id}', searchParams.payment)}
            </p>
          ) : null}
          <ButtonLink href="/dashboard/my-learning" className="w-full">
            {dict.payment.goLearning}
          </ButtonLink>
          <Link href="/dashboard/my-fees" className="block text-sm text-brand-600 hover:underline">
            {dict.payment.viewFees}
          </Link>
        </CardBody>
      </Card>
    </main>
  );
}
