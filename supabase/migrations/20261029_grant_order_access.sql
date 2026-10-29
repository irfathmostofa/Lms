-- Grant digital product access when a store payment is verified.
-- Callable by staff so Downloads still fills if the payments trigger is missing.

create or replace function public.grant_order_product_access(p_order uuid)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid;
begin
  if p_order is null then return; end if;
  if auth.uid() is null then raise exception 'Not authenticated'; end if;
  if not (select public.is_accountant()) then
    raise exception 'Not allowed';
  end if;

  select user_id into v_user from public.orders where id = p_order;
  if v_user is null then return; end if;

  insert into public.product_access (product_id, user_id, order_id, source)
  select oi.product_id, v_user, p_order, 'purchase'
  from public.order_items oi
  join public.products p on p.id = oi.product_id
  where oi.order_id = p_order and p.type = 'digital'
  on conflict (product_id, user_id) do nothing;

  update public.orders
    set status = case when status = 'pending' then 'paid' else status end,
        updated_at = now()
  where id = p_order;
end $$;

grant execute on function public.grant_order_product_access(uuid) to authenticated, service_role;

insert into public.product_access (product_id, user_id, order_id, source)
select oi.product_id, o.user_id, o.id, 'purchase'
from public.orders o
join public.order_items oi on oi.order_id = o.id
join public.products p on p.id = oi.product_id
where p.type = 'digital'
  and (
    o.status in ('paid', 'processing', 'shipped', 'delivered')
    or exists (
      select 1 from public.payments pay
      where pay.order_id = o.id and pay.status = 'verified'
    )
  )
on conflict (product_id, user_id) do nothing;

create or replace function public.on_payment_change()
returns trigger
language plpgsql security definer set search_path = public as $$
declare
  v_net numeric(12,2);
  v_paid numeric(12,2);
begin
  if new.status = 'verified' and old.status is distinct from 'verified' then
    new.verified_at := coalesce(new.verified_at, now());
    new.paid_at := coalesce(new.paid_at, now());

    if new.enrollment_id is not null then
      update public.fee_records fr
        set paid_amount = fr.paid_amount + new.amount,
            status = case
                       when fr.total_amount - fr.discount_amount - (fr.paid_amount + new.amount) <= 0 then 'paid'
                       when fr.paid_amount + new.amount > 0 then 'partial'
                       else 'unpaid'
                     end,
            updated_at = now()
      where fr.enrollment_id = new.enrollment_id;

      select coalesce(sum(total_amount - discount_amount), 0), coalesce(sum(paid_amount), 0)
        into v_net, v_paid
      from public.fee_records where enrollment_id = new.enrollment_id;

      if v_paid >= v_net then
        update public.enrollments
          set status = 'active', updated_at = now()
        where id = new.enrollment_id and status = 'pending';
      end if;
    end if;

    if new.order_id is not null then
      update public.orders
        set status = case when status = 'pending' then 'paid' else status end,
            updated_at = now()
      where id = new.order_id;

      insert into public.product_access (product_id, user_id, order_id, source)
      select oi.product_id, new.student_id, new.order_id, 'purchase'
      from public.order_items oi
      join public.products p on p.id = oi.product_id
      where oi.order_id = new.order_id and p.type = 'digital'
      on conflict (product_id, user_id) do nothing;

      update public.products p
        set stock = greatest(p.stock - oi.quantity, 0)
      from public.order_items oi
      where oi.order_id = new.order_id and oi.product_id = p.id and p.type = 'physical';
    end if;
  end if;
  return new;
end $$;
