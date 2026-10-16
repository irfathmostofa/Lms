import Link from 'next/link';
import { Card, CardBody } from '@/components/ui';

export default function PaymentFailedPage({
  searchParams,
}: {
  searchParams: { payment?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardBody className="space-y-4 p-6 text-center">
          <h1 className="text-lg font-semibold text-slate-900">Payment not completed</h1>
          <p className="text-sm text-slate-600">
            The payment could not be confirmed. You can try again or use a manual mobile banking
            transfer.
          </p>
          {searchParams.payment ? (
            <p className="font-mono text-xs text-slate-400">Reference: {searchParams.payment}</p>
          ) : null}
          <Link href="/dashboard/my-fees" className="text-sm text-brand-600 hover:underline">
            Back to my fees
          </Link>
        </CardBody>
      </Card>
    </main>
  );
}
