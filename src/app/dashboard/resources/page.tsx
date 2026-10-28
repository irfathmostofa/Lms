import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getSessionContext } from '@/lib/auth';
import { ResourceForm } from '@/components/dashboard/resource-form';
import { ConfirmDeleteButton } from '@/components/dashboard/confirm-delete-button';
import { FormModal } from '@/components/dashboard/form-modal';
import { deleteProductAction } from '@/actions/dashboard';
import { Badge, Card, CardBody, CardHeader, EmptyState, PageHeader, Table, Td, Th } from '@/components/ui';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/lib/types';

export const dynamic = 'force-dynamic';

interface ProductFileRow {
  product_id: string;
  file_url: string;
}

export default async function ResourcesPage() {
  const ctx = await getSessionContext();
  if (ctx?.profile?.role !== 'admin') redirect('/dashboard');

  const supabase = createClient();
  const [{ data, error }, { data: fileData }] = await Promise.all([
    supabase.from('products').select('*').order('created_at', { ascending: false }),
    supabase.from('product_files').select('product_id, file_url'),
  ]);

  const products = (data as Product[]) ?? [];
  const fileByProduct = new Map(
    ((fileData as ProductFileRow[]) ?? []).map((row) => [row.product_id, row.file_url]),
  );

  return (
    <>
      <PageHeader
        title="Resources"
        description="Add digital PDFs and printed books. Published items appear in the homepage resources section and the student store."
        action={
          <FormModal
            title="Add resource"
            description="Digital files unlock after verified payment. Printed books use stock and shipping."
            triggerLabel="Add resource"
          >
            <ResourceForm />
          </FormModal>
        }
      />

      {error ? (
        <p className="mb-6 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          Resources could not be loaded: {error.message}
        </p>
      ) : null}

      {products.length === 0 ? (
        <EmptyState
          title="No resources yet"
          description="Add a handbook, template or printed book. It will show on the homepage and in the store when published."
        />
      ) : (
        <Card>
          <CardHeader title="Catalog" description={`${products.length} resources`} />
          <CardBody className="p-0">
            <Table>
              <thead className="bg-slate-50">
                <tr>
                  <Th>Resource</Th>
                  <Th>Type</Th>
                  <Th>Price</Th>
                  <Th>Stock</Th>
                  <Th>Status</Th>
                  <Th />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((product) => (
                  <tr key={product.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-slate-100 ring-1 ring-slate-200">
                          {product.thumbnail_url ? (
                            <Image
                              src={product.thumbnail_url}
                              alt=""
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center text-[10px] text-slate-400">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium text-slate-900">{product.name}</p>
                          <p className="truncate text-xs text-slate-400">{product.slug}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <Badge>{product.type === 'physical' ? 'printed' : 'digital'}</Badge>
                    </Td>
                    <Td>{formatCurrency(product.price)}</Td>
                    <Td>{product.type === 'physical' ? product.stock : '-'}</Td>
                    <Td>
                      <Badge tone={product.is_active ? 'green' : 'amber'}>
                        {product.is_active ? 'published' : 'hidden'}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex items-center justify-end gap-2">
                        <FormModal
                          title="Edit resource"
                          triggerLabel="Edit"
                          triggerVariant="outline"
                          triggerSize="sm"
                        >
                          <ResourceForm product={product} fileUrl={fileByProduct.get(product.id) ?? ''} />
                        </FormModal>
                        <ConfirmDeleteButton
                          action={deleteProductAction}
                          id={product.id}
                          confirm="Delete this resource?"
                        />
                      </div>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      )}
    </>
  );
}
