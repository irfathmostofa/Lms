-- Accept shipping details when a student places a multi-item store order.
-- Printed books and tools require a delivery address.

drop function if exists public.place_order(jsonb);

create or replace function public.place_order(
  p_items jsonb,
  p_shipping_name text default null,
  p_shipping_phone text default null,
  p_shipping_address text default null
)
returns uuid
language plpgsql security definer set search_path = public as $$
declare
  v_user uuid := auth.uid();
  v_order uuid;
  v_subtotal numeric(12,2) := 0;
  v_shipping numeric(12,2) := 0;
  v_item jsonb;
  v_product public.products;
  v_qty int;
  v_has_physical boolean := false;
  v_name text := nullif(trim(coalesce(p_shipping_name, '')), '');
  v_phone text := nullif(trim(coalesce(p_shipping_phone, '')), '');
  v_address text := nullif(trim(coalesce(p_shipping_address, '')), '');
begin
  if v_user is null then raise exception 'Not authenticated'; end if;
  if p_items is null or jsonb_array_length(p_items) = 0 then raise exception 'Empty order'; end if;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(coalesce((v_item->>'quantity')::int, 1), 1);
    select * into v_product from public.products
      where id = (v_item->>'product_id')::uuid and is_active;
    if not found then raise exception 'Product not available'; end if;
    if v_product.type = 'physical' then
      v_has_physical := true;
      if v_product.stock < v_qty then
        raise exception 'Insufficient stock for %', v_product.name;
      end if;
    end if;
    v_subtotal := v_subtotal + v_product.price * v_qty;
  end loop;

  if v_has_physical then
    if v_name is null or v_phone is null or v_address is null then
      raise exception 'Shipping name, phone and address are required for printed items and tools';
    end if;
    v_shipping := public.setting_num('shipping_flat', 0);
    if v_subtotal >= public.setting_num('free_shipping_min', 0) then
      v_shipping := 0;
    end if;
  end if;

  insert into public.orders (
    order_no, user_id, status, source, subtotal, shipping, total,
    shipping_name, shipping_phone, shipping_address
  )
  values (
    'ORD-' || to_char(now(), 'YYMMDDHH24MISSMS'), v_user, 'pending', 'online',
    v_subtotal, v_shipping, v_subtotal + v_shipping,
    v_name, v_phone, v_address
  )
  returning id into v_order;

  for v_item in select * from jsonb_array_elements(p_items) loop
    v_qty := greatest(coalesce((v_item->>'quantity')::int, 1), 1);
    select * into v_product from public.products where id = (v_item->>'product_id')::uuid;
    insert into public.order_items (order_id, product_id, product_name, unit_price, quantity, line_total)
    values (v_order, v_product.id, v_product.name, v_product.price, v_qty, v_product.price * v_qty);
  end loop;

  return v_order;
end $$;

grant execute on function public.place_order(jsonb, text, text, text) to authenticated, service_role;
