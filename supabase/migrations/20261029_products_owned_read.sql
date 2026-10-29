-- Students can still read products they already purchased, even if later hidden.

drop policy if exists products_read on public.products;
create policy products_read on public.products
  for select using (
    is_active
    or (select public.is_staff())
    or (select public.has_product_access(id))
  );
