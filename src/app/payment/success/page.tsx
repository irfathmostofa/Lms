import Link from 'next/link';
import { ButtonLink, Card, CardBody } from '@/components/ui';

export default function PaymentSuccessPage({
  searchParams,
}: {
  searchParams: { payment?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardBody className="space-y-4 p-6 text-center">
          <h1 className="text-lg font-semibold text-slate-900">Payment received</h1>
          <p className="text-sm text-slate-600">
            Thank you. SSLCommerz is confirming your transaction. Your access activates as soon as
            the confirmation arrives.
          </p>
          {searchParams.payment ? (
            <p className="font-mono text-xs text-slate-400">Reference: {searchParams.payment}</p>
          ) : null}
          <ButtonLink href="/dashboard/my-learning" className="w-full">
            Go to my learning
          </ButtonLink>
          <Link href="/dashboard/my-fees" className="block text-sm text-brand-600 hover:underline">
            View my fees
          </Link>
        </CardBody>
      </Card>
    </main>
  );
}
