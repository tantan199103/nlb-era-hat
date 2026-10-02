-- Transactional checkout for the browser client.
--
-- The public app may create a pending order, but it must not trust a client
-- subtotal, product title or stock flag. This function resolves every line
-- against the source-approved catalog, locks the variant rows, reserves the
-- requested inventory and inserts the order plus its lines atomically.

create or replace function public.create_checkout_order(
  p_customer_email text,
  p_currency text,
  p_items jsonb
)
returns table (
  order_id uuid,
  order_number text,
  subtotal numeric,
  currency text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  item jsonb;
  item_id bigint;
  item_variant_id text;
  item_size text;
  item_quantity integer;
  item_key text;
  customer_email text := lower(trim(coalesce(p_customer_email, '')));
  order_currency text := upper(trim(coalesce(p_currency, 'USD')));
  auth_email text := lower(trim(coalesce(auth.jwt() ->> 'email', '')));
  actor_id uuid := auth.uid();
  item_price numeric;
  product_title text;
  product_thumbnail text;
  available_count integer;
  calculated_subtotal numeric := 0;
  inserted_order public.orders%rowtype;
  seen_keys text[] := array[]::text[];
begin
  if customer_email = '' or customer_email !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' then
    raise exception 'A valid checkout email is required.' using errcode = '22023';
  end if;

  if actor_id is not null and auth_email <> '' and customer_email <> auth_email then
    raise exception 'Authenticated checkout email must match the signed-in account.' using errcode = '42501';
  end if;

  if order_currency !~ '^[A-Z]{3}$' then
    raise exception 'Unsupported checkout currency.' using errcode = '22023';
  end if;

  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Your cart is empty.' using errcode = '22023';
  end if;

  -- First pass validates every line and computes the server-side total.  Row
  -- locks make concurrent checkouts observe the same inventory reservation.
  for item in select value from jsonb_array_elements(p_items) loop
    begin
      item_id := (item ->> 'id')::bigint;
    exception when invalid_text_representation then
      raise exception 'Cart contains an invalid product.' using errcode = '22023';
    end;
    item_variant_id := nullif(trim(item ->> 'variant_id'), '');
    item_size := nullif(trim(item ->> 'size'), '');
    item_quantity := (item ->> 'quantity')::integer;
    if item_id is null or item_size is null or item_quantity is null or item_quantity < 1 or item_quantity > 20 then
      raise exception 'Cart contains an invalid product quantity or size.' using errcode = '22023';
    end if;

    item_key := item_id::text || '|' || lower(item_size);
    if item_key = any(seen_keys) then
      raise exception 'Cart contains a duplicate size line.' using errcode = '22023';
    end if;
    seen_keys := array_append(seen_keys, item_key);

    select p.title, p.thumbnail
      into product_title, product_thumbnail
    from public.products p
    where p.id = item_id
      and p.category = 'hats'
      and p.is_active = true
      and p.source_1688_status = 'MATCHED'
    for update;
    if not found then
      raise exception 'One or more products are no longer available.' using errcode = 'P0001';
    end if;

    if item_variant_id is not null then
      select v.price, v.inventory_count
        into item_price, available_count
      from public.product_variants v
      where v.id = item_variant_id
        and v.product_id = item_id
        and lower(v.size) = lower(item_size)
      for update;
    else
      select v.price, v.inventory_count
        into item_price, available_count
      from public.product_variants v
      where v.product_id = item_id
        and lower(v.size) = lower(item_size)
      order by v.id
      limit 1
      for update;
    end if;
    if not found or coalesce(available_count, 0) < item_quantity then
      raise exception 'One or more selected sizes are out of stock.' using errcode = 'P0001';
    end if;
    calculated_subtotal := calculated_subtotal + (coalesce(item_price, 0) * item_quantity);
  end loop;

  insert into public.orders (user_id, customer_email, currency, subtotal, status)
  values (actor_id, customer_email, order_currency, calculated_subtotal, 'pending')
  returning * into inserted_order;

  for item in select value from jsonb_array_elements(p_items) loop
    item_id := (item ->> 'id')::bigint;
    item_variant_id := nullif(trim(item ->> 'variant_id'), '');
    item_size := nullif(trim(item ->> 'size'), '');
    item_quantity := (item ->> 'quantity')::integer;

    if item_variant_id is not null then
      select v.id, v.price into item_variant_id, item_price
      from public.product_variants v
      where v.id = item_variant_id and v.product_id = item_id and lower(v.size) = lower(item_size);
    else
      select v.id, v.price into item_variant_id, item_price
      from public.product_variants v
      where v.product_id = item_id and lower(v.size) = lower(item_size)
      order by v.id limit 1;
    end if;

    select p.title, p.thumbnail into product_title, product_thumbnail
    from public.products p where p.id = item_id;

    insert into public.order_items (order_id, product_id, variant_id, title, size, unit_price, quantity, thumbnail)
    values (inserted_order.id, item_id, item_variant_id, product_title, item_size, item_price, item_quantity, product_thumbnail);

    update public.product_variants
    set inventory_count = inventory_count - item_quantity,
        in_stock = inventory_count - item_quantity > 0
    where id = item_variant_id;
  end loop;

  return query select inserted_order.id, inserted_order.order_number, inserted_order.subtotal, inserted_order.currency;
end;
$$;

revoke all on function public.create_checkout_order(text, text, jsonb) from public;
grant execute on function public.create_checkout_order(text, text, jsonb) to anon, authenticated;
